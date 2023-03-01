'use strict';
const config = require('config');
const Permissions = require('a24-node-permissions-client');

/**
 * An instance of the Permissions helper
 *
 * @author Naresh Tapatia <naresh.tap@gmail.com>
 * @since  16 January 2018
 *
 * @module PermissionsHelper
 */
module.exports.getConfiguredPermissionsClientInstance= function getConfiguredPermissionsClientInstance() {
  let clientConfig = config.get('permissions.http_request_options');
  let client = new Permissions.ApiClient();
  client.basePath = clientConfig.protocol + '://' + clientConfig.host + ':' + clientConfig.port + '/'
    + clientConfig.version;
  return client;
};
