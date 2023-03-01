'use strict';

const ActivityAdvancedSearchService = require('../services/ActivityAdvancedSearchService');

/**
 * Advanced search on Activity records
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 *
 * @author Anil Kumar <lanill1986@gmail.com>
 * @since  5 September 2018
 */
module.exports.advancedSearch = function advancedSearch(req, res, next) {
  let activityAdvancedSearchService = new ActivityAdvancedSearchService(req.Logger);
  activityAdvancedSearchService.advancedSearch(req.swagger.params, res, next);
};

// NEW GENERATOR FUNCTIONS LOCATION