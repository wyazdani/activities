'use strict';
const _ = require('lodash');
const ActivitiesPipeline = require('./pipelines/ActivitiesPipeline');
const pipelines = [ActivitiesPipeline];

class ActivitiesWatcher {

  static getStreamingAppName() {
    return 'Activities';
  }

  static getMongoClientConfigKeys(type) {
    let keys = [];
    for (const item of pipelines) {
      if (item.getType() === type) {
        keys = _.concat(keys, item.getMongoClientConfigKeys());
      }
    }
    return keys;
  }

  static async watch(type, logger, tokenManager) {
    for (const item of pipelines) {
      if (item.getType() === type) {
        try {
          await item.watch(logger, tokenManager);
        } catch (error) {
          logger.error('There was an error while trying to initialise all the watchers', error);
          process.exit(1);
        }
      }
    }
  }
}

module.exports = ActivitiesWatcher;
