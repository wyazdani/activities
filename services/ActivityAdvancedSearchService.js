'use strict';

const {RuntimeError} = require('a24-node-error-utils');
const {AdvancedSearchMongoQueryHelper} = require('a24-node-advanced-query-utils');
const asyncLib = require('async');
const _ = require('lodash');
const {Activity} = require('../models');

class StatusService {

  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Advanced search on Activity records
   *
   * @param {object} swaggerParams - The request arguments passed in from the controller
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   *
   * @author Anil Kumar <lanill1986@gmail.com>
   * @since  5 September 2018
   */
  advancedSearch(swaggerParams, res, next) {
    let searchCriteria = swaggerParams.searchCriteria.value;
    let query = {};
    if (searchCriteria.query) {
      try {
        query = AdvancedSearchMongoQueryHelper.transformQueryObjectToMongoQuery(
          searchCriteria.query,
          Activity
        );
      } catch (error) {
        if (error.constructor.name === 'ValidationError') {
          error.results.errors.forEach((errorItem) => {
            errorItem.path = ['query'].concat(errorItem.path);
          });
          this.logger.error(
            'The advanced search for Activity threw a validation error',
            {'error': error}
          );

          return next(error);
        } else {
          let runtimeError = new RuntimeError('The advanced search threw an error', error);
          this.logger.error(
            'The advanced search for Activity threw an error',
            {'error': runtimeError}
          );
          return next(runtimeError);
        }
      }
    }

    let page = 1;
    if (searchCriteria.page) {
      page = searchCriteria.page;
    }
    let limit = 25;
    if (searchCriteria.items_per_page) {
      limit = searchCriteria.items_per_page;
    }

    let skipValue = (page - 1) * limit;

    let sortParams = {};
    if (searchCriteria.sort) {
      let arrSortParams = searchCriteria.sort;
      for (let i = 0; i < arrSortParams.length; i++) {
        if (arrSortParams[i].charAt(0) === '-') {
          let field = arrSortParams[i].replace('-', '');
          sortParams[field] = -1;
        } else {
          sortParams[arrSortParams[i]] = 1;
        }
      }
    }

    asyncLib.parallel([
      asyncLib.apply(_getAdvancedSearchCount, query),
      asyncLib.apply(_advancedGetList, query, limit, skipValue, sortParams)
    ], function finalCallback(error, results) {
      if (error) {
        return next(error);
      }
      let searchResultCount = results[0];
      let searchResultList = results[1];
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-Results-Count', searchResultCount);

      if (_.isEmpty(searchResultList)) {
        this.logger.info(
          'The advanced search for Activity has been completed but no results were found'
        );
        res.setResponse('json', 204);
        return next();
      }
      this.logger.info(
        'The advanced search for Activity has completed successfully.'
      );
      res.setResponse('json', 200, searchResultList);
      return next();
    }.bind(this));
  }
  // NEW GENERATOR FUNCTIONS LOCATION
}

/**
 * Retrieves the count of activity records that matches the query
 *
 * @param {object} query - The query for the database call
 * @param {function} callback - The callback
 *
 * @author Anil Kumar <lanill1986@gmail.com>
 * @since  5 September 2018
 *
 * @private
 */
function _getAdvancedSearchCount(query, callback) {
  Activity.countDocuments(query, function countResults(err, result) {
    if (err) {
      let runTimeError = new RuntimeError(
        'An error occurred while counting the activity records for advanced search',
        err
      );
      return callback(runTimeError);
    }
    callback(null, result);
  });
}

/**
 * Retrieves the list of activity records that matches the query
 *
 * @param {object} query - The query for the database call
 * @param {number} limit - The items per page
 * @param {number} skipValue - The skip value
 * @param {object} sortParams - The sort params
 * @param {function} callback - The callback
 *
 * @author Anil Kumar <lanill1986@gmail.com>
 * @since  5 September 2018
 */
function _advancedGetList(query, limit, skipValue, sortParams, callback) {
  Activity.find(query)
    .sort(sortParams)
    .skip(skipValue)
    .limit(limit)
    .exec(function findResults(error, results) {
      if (error) {
        let runTimeError = new RuntimeError(
          'An error occurred while retrieving the activity records for advanced search',
          error
        );
        return callback(runTimeError);
      }
      callback(null, results);
    });
}
module.exports = StatusService;
