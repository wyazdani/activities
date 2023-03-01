'use strict';

const ActivityService = require('../services/ActivityService');

/**
 * Creates a new activity
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 *
 * @author Sh33pman <johannes.gryffenberg@gmail.com>
 * @since  6 July 2017
 */
module.exports.createActivity = function createActivity(req, res, next) {
  let activityService = new ActivityService(req.Logger);
  activityService.createActivity(req.swagger.params, res, next);
};

/**
 * Retrieves a list of activities
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 *
 * @author Sh33pman <johannes.gryffenberg@gmail.com>
 * @since  6 July 2017
 */
module.exports.getActivities = function getActivities(req, res, next) {
  let activityService = new ActivityService(req.Logger);
  activityService.getActivities(req.swagger.params, res, next);
};

/**
 * Retrieves the activity for the provided id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 *
 * @author Sh33pman <johannes.gryffenberg@gmail.com>
 * @since  6 July 2017
 */
module.exports.getActivity = function getActivity(req, res, next) {
  let activityService = new ActivityService(req.Logger);
  activityService.getActivity(req.swagger.params, res, next);
};

// NEW GENERATOR FUNCTIONS LOCATION