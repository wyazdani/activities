'use strict';
const config = require('config');

/**
 * Class responsible for collect metrics of change stream
 */
class MetricsManager {
  /**
   *
   * @param {LoggerContext} opts.logger - logger
   * @param {Number} opts.highWaterMark - high water mark
   * @param {String} opts.pipelineName - name of the pipeline
   * @param {String} opts.appName - name of streaming application
   */
  constructor(opts) {
    this._logger = opts.logger;
    this._highWaterMark = opts.highWaterMark;
    this._pipelineName = opts.pipelineName;
    this._appName = opts.appName;
    this._counter = 0;
    this._processedCount = 0;
    this._enabled = config.get('metrics.change_stream.enabled');
  }

  /**
   * it's called when we received the event
   */
  received() {
    if (!this._enabled) {
      return;
    }
    this._counter++;
  }
  /**
   * it will be called when last stage of the pipeline is done
   */
  processed() {
    if (!this._enabled) {
      return;
    }
    this._counter--;
    this._processedCount++;
    this._logger.info('ChangeStream process metric', {
      pipeline_name: this._pipelineName,
      app_name: this._appName,
      counter: this._counter,
      processed_count: this._processedCount,
      highWaterMark: this._highWaterMark,
      memory: process.memoryUsage()
    });
  }
}

module.exports = {MetricsManager};