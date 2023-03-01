'use strict';

const StatusService = require('../services/StatusService');

/**
 * Gets the status of the messaging service
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 *
 * @author Sh33pman <johannes.gryffenberg@gmail.com>
 * @since  6 July 2017
 */
module.exports.getSystemStatus = function getSystemStatus(req, res, next) {
  let statusService = new StatusService(req.Logger);
  statusService.getSystemStatus(req.swagger.params, res, next);
};

// NEW GENERATOR FUNCTIONS LOCATION