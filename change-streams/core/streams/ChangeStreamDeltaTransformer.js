'use strict';

const {Transform} = require('stream');
const {DELETE, INSERT, UPDATE, REPLACE} = require('../../../enums/ChangeStreamEvents');

/**
 * Convert a standard delta change stream event into an upsert structure that can be used
 */
class ChangeStreamDeltaTransformer extends Transform {

  constructor(opts) {
    // We only cater for object mode
    opts.objectMode = true;
    super(opts);
  }

  /**
   *
   * @param {Object} data - The chunk to be transformed. Will be object since we operate in object mode
   * @param {*} encoding - If the chunk is a string, then this is the encoding type. If data is a buffer,
   *                       then this is the special value - 'buffer', ignore it in this case.
   * @param {function} callback A callback function (optionally with an error argument and data) to be
   *                           called after the supplied data has been processed.
   *
   * @returns {Object} - The tranformed event in the format
   * {
   *  _id: <change stream identifier>,
   *  operationType: <ChangeStreamEvents Enum>
   *  documentKey: <document identifier>
   *  updates: {
   *   $set: {},
   *   $unset: {}
   *  }
   * }
   */
  _transform(data, encoding, callback) {
    let newData = {
      _id: data._id,
      operationType: data.operationType,
      documentKey: data.documentKey
    };

    // for a delete there is no need to consider sets and unsets
    if (data.operationType !== DELETE) {
      newData.updates = {'$set': getSetFields(data)};

      // only apply unset if there are fields that need to be removed
      if (
        data.updateDescription &&
        data.updateDescription.removedFields &&
        data.updateDescription.removedFields.length !== 0
      ) {
        newData.updates['$unset'] = getUnsetFields(data);
      }
    }
    callback(null, newData);
  }
}

/**
 * Gets fields that need to be set
 *
 * @param {Object} data - The delta change stream object
 *
 * @returns {Object} - The fields that would need to be set
 */
function getSetFields(data) {
  if (data.operationType === INSERT || data.operationType === REPLACE) {
    return data.fullDocument;
  }
  if (data.operationType === UPDATE) {
    return data.updateDescription.updatedFields;
  }
  return {};
}

/**
 * Gets the fields that need to be unset
 *
 * @param {Object} data - The delta change stream object
 *
 * @returns {Object} - The fields that would need to be unset
 */
function getUnsetFields(data) {
  if (data.operationType === UPDATE) {
    return Object.fromEntries(data.updateDescription.removedFields.map((item) => [item, 1]));
  }
  return {};
}

module.exports = ChangeStreamDeltaTransformer;
