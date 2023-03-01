'use strict';
const _ = require('lodash');

class Watcher {
  static getWatcherContext(name, pipelines) {
    return {
      _pipelines: [],
      getStreamingAppName() {
        return name;
      },
      getPipelines() {
        return pipelines;
      },
      getMongoClientConfigKeys() {
        let keys = [];
        for (const item of this.getPipelines()) {
          keys = _.concat(keys, item.getMongoClientConfigKeys());
        }
        return keys;
      },
      async watch(logger, tokenManager) {
        for (const PipelineClass of this.getPipelines()) {
          try {
            const pipeline = PipelineClass.getPipelineInstance(logger, tokenManager);
            this._pipelines.push(pipeline);
            await pipeline.start();
          } catch (error) {
            logger.error('There was an error while trying to initialise all the watchers', error);
            process.exit(1);
          }
        }
      },
      shutdown(logger) {
        logger.info(`triggering shutdown on ${name}`);
        const promiseArray = _.map(this._pipelines, (pipeline)=> {
          if (_.isFunction(pipeline.shutdown)) {
            return pipeline.shutdown();
          }
        });
        return Promise.allSettled(promiseArray);
      }
    };
  }
}

module.exports = Watcher;