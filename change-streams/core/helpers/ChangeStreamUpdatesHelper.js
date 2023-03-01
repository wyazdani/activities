'use strict';

const _ = require('lodash');
const OPERATION = {
  SET: 'SET',
  UNSET: 'UNSET'
};
/**
 * Rename object fields based off of the field mapping provided
 * Only return fields found on the field mapping
 *
 * @param data
 * @param fieldMapping
 * @returns {{}}
 */
function renameObjectProperties(data, fieldMapping) {
  let remapped = {};
  _.forOwn(fieldMapping, (value, key) => {
    if (!_.isUndefined(data[key])) {
      remapped[value] = data[key];
    }
  });
  return remapped;
}

/**
 * Remap fields when the update field matched a field on the field config
 *
 * @param {Object} mapItem - One field configuration object {from: '', to: '', [properties: []]}
 * @param {Object} updates - Change stream delta updates
 * @param {String} field - Field name from updates
 * @param {OPERATION} operation - operation name
 * @returns Object
 * @private
 */
function _topLevelMatch(mapItem, updates, field, operation) {
  const mapped = {};
  if (mapItem.properties) {
    if (_.isPlainObject(updates[field])) {
      const subFields = updates[field];
      mapItem.properties.forEach((prop) => {
        if (!_.isUndefined(subFields[prop.from])) {
          if (mapped[mapItem.to]) {
            _setPropertyValue(mapped[mapItem.to], prop.to, subFields[prop.from], prop, operation);
          } else {
            mapped[mapItem.to] = {};
            _setPropertyValue(mapped[mapItem.to], prop.to, subFields[prop.from], prop, operation);
          }
        }
      });
    } else {
      _setPropertyValue(mapped, mapItem.to, updates[field], mapItem, operation);
    }
  } else {
    _setPropertyValue(mapped, mapItem.to, updates[field], mapItem, operation);
  }
  return mapped;
}

/**
 * Sets the property value and apply plugins
 *
 * @param {Object} obj - object of the result
 * @param {string} fieldName - property name
 * @param {any} value - object or string value
 * @param {Object} schema - field config
 * @param {OPERATION} operation - operation name
 * @private
 */
function _setPropertyValue(obj, fieldName, value, schema, operation) {
  obj[fieldName] = value;
  _.forEach(schema.plugins || [], (plugin) => {
    switch (plugin) {
      case 'real_low':
        _realLowPlugin(obj, fieldName, value, schema, operation);
        break;
      default:
        throw new Error(`plugin in ChangeStreamUpdateHelper not supported.plugin: ${plugin} field: ${fieldName}`);
    }
  });
}

/**
 * applies real low plugin
 *
 * @param {Object} obj - object of the result
 * @param {string} fieldName - property name
 * @param {any} value - object or string value
 * @param {Object} schema - schema
 * @param {OPERATION} operation - operation name
 * @private
 */
function _realLowPlugin(obj, fieldName, value, schema, operation) {
  if (operation === OPERATION.SET) {
    if (!_.isString(value)) {
      //We're crashing the process on purpose, we can't continue until we solve the issue and redeploy again
      throw new Error(`This field should be string, but it's not: ${fieldName}, schema: ${JSON.stringify(schema)}`);
    }
    obj[`${fieldName}_low`] = _.trim(_.toLower(value));
  } else {
    obj[`${fieldName}_low`] = value;
  }
}

/**
 * Remap fields for dot notation update field
 *
 * @param {Object} mapItem - One field configuration object {from: '', to: '', [properties: []]}
 * @param {Object} updates - Change stream delta updates
 * @param {String} field - Top Level field name from dot notation update
 * @param {Array} fieldParts - The sub fields of the top level field
 * @param {OPERATION} operation - operation name
 * @returns Object
 * @private
 */
function _dotNotationTopLevelMatch(mapItem, updates, field, fieldParts, operation) {
  const mapped = {};
  const subField = fieldParts.join('.');
  if (mapItem.properties) {
    const subFieldMap = mapItem.properties.find((prop) => prop.from === subField);
    if (subFieldMap) {
      _setPropertyValue(mapped, `${mapItem.to}.${subFieldMap.to}`, updates[field], subFieldMap, operation);
    }
  } else {
    _setPropertyValue(mapped, `${mapItem.to}.${subField}`, updates[field], mapItem, operation);
  }

  return mapped;
}

/**
 * Rename updates fields based off of the provided field config
 * TODO Support recursion on nested properties, positional array updates, $addToSet and other operations
 *
 * @param {Object} fieldConfig - Fields mapping from source to how it should look in destination collection
 * @param {Object} updates - Change stream delta updates
 * @param {OPERATION} operation - operation name
 *
 * @returns Object
 */
function remapUpdateFields(fieldConfig, updates, operation) {
  const mapped = {};
  for (const field of Object.keys(updates)) {
    const fieldParts = field.split('.');
    const topLevel = fieldParts.shift();
    for (const mapItem of fieldConfig) {
      if (field === mapItem.from) {
        _.extend(mapped, _topLevelMatch(mapItem, updates, field, operation));
      } else if (topLevel === mapItem.from) {
        _.extend(mapped, _dotNotationTopLevelMatch(mapItem, updates, field, fieldParts, operation));
      } else if (mapItem.from.startsWith(`${field}.`)) {
        _setPropertyValue(mapped, mapItem.to, _.get(updates, mapItem.from, updates[field]), mapItem, operation);
      }
    }
  }
  return mapped;
}
module.exports = {
  renameObjectProperties,
  remapUpdateFields,
  OPERATION
};