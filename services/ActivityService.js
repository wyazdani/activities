'use strict';

const Activity = require('../models/Activity');
const {ValidationError, RuntimeError, ResourceNotFoundError} = require('a24-node-error-utils');
const {ServiceHelper, QueryHelper} = require('a24-node-query-utils');
const config = require('config');
const asyncLib = require('async');
const _ = require('lodash');

class ActivityService {

  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Method implementation to create an activity
   *
   * @param {object} args - The request arguments passed in from the controller
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   *
   * @author Tyler Dean Smith <tyler.smith@a24group.com>
   * @since  12 July 2017
   *
   * @return void
   */
  createActivity(args, res, next) {

    let currentDate = new Date();
    //if args date value is greater than the accepted date return error,
    //this make sure the activity is not more than 3 minutes into future.
    currentDate.setMinutes(currentDate.getMinutes() + 3);
    if (new Date(args.activity.value.activity_date) > currentDate) {
      let validationError = new ValidationError(
        'Invalid activity date, activity date can not be in the future.',
        [
          {
            code: 'INVALID_ACTIVITY_DATE',
            message: 'Invalid activity date, activity date can not be in the future.',
            path: ['activity_date']
          }
        ]
      );
      return next(validationError);
    }
    _validateActivityObject(args.activity.value, (error) => {
      if (error) {
        return next(error);
      }
      //populate the mongoose model
      let activity = new Activity(args.activity.value);

      //save the mongoose model to mongo db
      activity.save(function saveActivity(error, activitySaveReturn) {
        if (error) {
          let runTimeError = new RuntimeError(
            'An error occurred when saving the activity.',
            error
          );
          return next(runTimeError);
        }
        this.logger.info(
          'The Activity create call has been completed successfully.',
          {'response': activitySaveReturn.toJSON({minimize: false})}
        );
        res.setResponse('json', 201, activitySaveReturn);
        return next();
      }.bind(this));
    });
  }

  /**
   * Get a list of activities that can be sorted on
   *  executing_contact, linked_contact,
   *  activity_date, created_by, _id, activity_type, executing_contact,
   *  linked_contact, created_by
   * Get a list of activities that can be filtered on
   *  _id, activity_type, created_by, executing_contact, linked_contact
   *
   * @param {object} args - The request arguments passed in from the controller
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   *
   * @author Tyler Dean Smith <tyler.smith@a24group.com>
   * @since  12 July 2017
   *
   * @return void
   */
  getActivities(args, res, next) {
    let _args = transformPayload(args);

    let query = QueryHelper.getQuery(_args);
    let limit = QueryHelper.getItemsPerPage(args);
    let page = QueryHelper.getPage(args);

    asyncLib.parallel(
      {
        count: asyncLib.apply(_getActivitiesCount, query),
        result: asyncLib.apply(_getActivitiesList, _args, query, page, limit)
      },
      function getActivitiesFinalCallback(error, results) {
        if (error) {
          let runTimeError = new RuntimeError(
            'An error occurred while retrieving activity list',
            error
          );
          return next(runTimeError);
        }
        let count = results.count;
        let activities = results.result;

        let url = '/' + config.exposed_server.version + '/activity';
        let relLinkOptions = _getRelLinkOptions(args, config, url);
        res.setHeader('X-Result-Count', count);
        res.setHeader('Link', ServiceHelper.getRelLink(relLinkOptions, count, page, limit));
        if (activities && activities.length == 0) {
          res.body = null;
          this.logger.info(
            'The activities get list call has been completed successfully.',
            {'status_code': 204}
          );
          res.setResponse('json', 204);
        } else {
          this.logger.info(
            'The activities get list call has been completed successfully.',
            {'status_code': 200, 'response': activities.map((obj) => obj.toJSON({minimize: false}))}
          );
          res.setResponse('json', 200, activities);
        }
        return next();
      }.bind(this)
    );

  }

  /**
   * Get a single activity for the given id
   *
   * @param {ClientRequest} args - The swagger arguments
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   *
   * @author Tyler Dean Smith <tyler.smith@a24group.com>
   * @since  13 July 2017
   *
   * @return void
   */
  getActivity(args, res, next) {
    let id = args.id.value;
    Activity.findById(id, function findActivityById(error, result) {
      if (error) {
        let runTimeError = new RuntimeError(
          'An error occurred while retrieving activity [' + id + ']',
          error
        );
        return next(runTimeError);
      }

      res.setHeader('Content-Type', 'application/json');
      if (!result) {
        let resourceNotFound = new ResourceNotFoundError(
          'Activity with id [' + id + '] was not found'
        );
        this.logger.error(
          'No Activity type was found for id [' + id + ']',
          {'error': resourceNotFound}
        );
        return next(resourceNotFound);
      } else {
        this.logger.info(
          'The activity get call has been completed successfully.',
          {'status_code': 200, 'response': result.toJSON({minimize: false})}
        );
        res.setResponse('json', 200, result);
        return next();
      }
    }.bind(this));
  }

  // NEW GENERATOR FUNCTIONS LOCATION
}

/**
 * Gets the amount of activities that match a given query
 *
 * @param {object} query - The query for the database call
 * @param {function} callback - The callback
 *
 * @author Tyler Dean Smith <tyler.smith@a24group.com>
 * @since  13 July 2017
 *
 * @return void
 */
function _getActivitiesCount(query, callback) {
  Activity.countDocuments(query, function countResults(err, result) {
    if (err) {
      return callback(err, null);
    }
    return callback(null, result);
  });
}

/**
 * Gets the list of activities for a specific query
 *
 * @param {object} args - The request arguments passed from the controller
 * @param {object} query - The query to match
 * @param {number} page - The current page
 * @param {number} limit - The items per page
 * @param {function} callback - The callback
 *
 * @author Tyler Dean Smith <tyler.smith@a24group.com>
 * @since  13 July 2017
 *
 * @return void
 */
function _getActivitiesList(args, query, page, limit, callback) {
  Activity.find(query)
    .skip(QueryHelper.getSkipValue(args, limit))
    .limit(limit)
    .sort(QueryHelper.getSortParams(args))
    .exec(function findResults(error, results) {
      if (error) {
        return callback(error, null);
      }
      return callback(null, results);
    });
}

/**
 * Build the rel link options object
 *
 * Function will help minimize boilerplate code
 *
 * @param Object args - swagger arguments
 * @param Object config - Full app config
 * @param string urlPath - The route to add to rel link i.e /v1/activity?page=4
 *
 * @author Tyler Dean Smith <tyler.smith@a24group.com>
 * @since  13 July 2017
 *
 * @return Object - Object with host, port etc
 */
function _getRelLinkOptions(args, config, urlPath) {
  let serverProtocol =
    (config.exposed_server && config.exposed_server.http_protocol) ? config.exposed_server.http_protocol : 'http';
  let serverPort =
    (config.exposed_server && config.exposed_server.port) ? config.exposed_server.port : config.server.port;
  let serverHost =
    (config.exposed_server && config.exposed_server.host) ? config.exposed_server.host : 'localhost:' + serverPort;
  let queryString = QueryHelper.getQueryAndSortingString(args);
  if (queryString !== '') {
    urlPath += '?' + queryString + '&';
  }

  return {
    host: serverHost,
    port: serverPort,
    protocol: serverProtocol,
    url: urlPath
  };
}

/**
 * Replace the old entity object key to new
 *
 * @param Object payload - swagger arguments
 *
 * @author Naresh Tapatia <naresh.tap@gmail.com>
 * @since  12 January 2018
 *
 * @return Object - Object with host, port etc
 * @private
 */
function transformPayload(swaggerParams) {
  let clonedSwaggerParams = _.cloneDeep(swaggerParams);
  let transformKeys = {
    'subject_entity_id': 'subject.entity_id',
    'subject_entity_type': 'subject.entity_type',
    'subject_name': 'subject.name',
    'executing_entity_id': 'executing_entity.entity_id',
    'executing_entity_type': 'executing_entity.entity_type',
    'executing_entity_context_id': 'executing_entity.context_id',
    'executing_entity_context_type': 'executing_entity.context_type',
    'executing_entity_name': 'executing_entity.name',
    'created_by_entity_id': 'created_by_entity.entity_id',
    'created_by_entity_type': 'created_by_entity.entity_type',
    'created_by_entity_name': 'created_by_entity.name',
    'created_by_entity_context_id': 'created_by_entity.context_id',
    'created_by_entity_context_type': 'created_by_entity.context_type'
  };

  _.forEach(clonedSwaggerParams, (value, key) => {
    if (transformKeys.hasOwnProperty(key)) {
      clonedSwaggerParams[transformKeys[key]] = value;
      delete clonedSwaggerParams[key];
    }
  });
  if (!_.isEmpty(clonedSwaggerParams.sortBy) && !_.isEmpty(clonedSwaggerParams.sortBy.value)) {
    let sortByArray = [];
    _.forEach(clonedSwaggerParams.sortBy.value, (key) => {
      if (transformKeys.hasOwnProperty(key)) {
        sortByArray.push(transformKeys[key]);
      } else if (key[0] === '-' && transformKeys.hasOwnProperty(key.substr(1, key.length))) {
        sortByArray.push('-'.concat(transformKeys[key.substr(1, key.length)]));
      } else {
        sortByArray.push(key);
      }
    });

    clonedSwaggerParams.sortBy.value= sortByArray;
  }

  return clonedSwaggerParams;
}

/**
 * Validates the activity object
 *
 * @param {Object} payload - activity object
 * @param {Object} callback - The callback used to pass control to the next action/middleware
 *
 * @author Abhay Dubey <abhayd1984@gmail.com>
 * @since  18 September 2018
 *
 * @return void
 * @private
 */
function _validateActivityObject(payload, callback) {
  let validationError = null;
  let errors = [];
  if (payload.subject) {
    let subjectValidationError = _validateEntity(payload.subject, 'subject');
    if (subjectValidationError) {
      errors.push(subjectValidationError);
    }
  }
  if (payload.executing_entity) {
    let executingEntityValidationError = _validateEntity(payload.executing_entity, 'executing_entity');
    if (executingEntityValidationError) {
      errors.push(executingEntityValidationError);
    }
  }
  if (payload.created_by_entity) {
    let createdByEntityValidationError = _validateEntity(payload.created_by_entity, 'created_by_entity');
    if (createdByEntityValidationError) {
      errors.push(createdByEntityValidationError);
    }
  }
  if (payload.linked_entities) {
    _.forEach(payload.linked_entities, (entity, index) => {
      let linkedEntityValidationError = _validateEntity(entity, 'linked_entities', index.toString());
      if (linkedEntityValidationError) {
        errors.push(linkedEntityValidationError);
      }
    });
  }
  if (!_.isEmpty(errors)) {
    validationError = new ValidationError(
      'Missing properties in payload entity object',
      errors
    );
    return callback(validationError);
  }
  return callback();
}

/**
 * Validate entity object
 *
 * @param {Object} entity - Entity object
 * @param {Object} entityName - Entity name
 * @param {string} index - The index of entity object, used for linked_entities
 *
 * @author Abhay Dubey <abhayd1984@gmail.com>
 * @since  18 September 2018
 *
 * @return Object|null
 *
 * @private
 */
function _validateEntity(entity, entityName, index) {
  let error = null;
  if ((_.isEmpty(entity.entity_id)) && (_.isEmpty(entity.name))) {
    error = {
      code: 'MISSING_PROPERTY',
      message: 'Expected entity id or entity name to be set',
      path: [entityName]
    };
    if (index) {
      error.path.push(index);
    }
  }
  return error;
}

module.exports = ActivityService;
