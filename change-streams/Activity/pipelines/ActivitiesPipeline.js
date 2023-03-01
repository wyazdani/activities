'use strict';
const {Activity} = require('../../../models');
const {ACTIVITIES_DB_KEY} = require('../../DatabaseConfigKeys');
const MongoClients = require('../../core/MongoClients');
const StreamEventHandlers = require('../../core/StreamEventHandlers');
const ChangeStreamDeltaTransformer = require('../../core/streams/ChangeStreamDeltaTransformer');

const {WATCH} = require('../../core/enums/StreamTypes');
const PIPELINE_ID = 'activity_event_store';
const WATCH_ID = `${PIPELINE_ID}_watch`;
const WATCH_COLLECTION = Activity.collection.collectionName;
const {CORE} = require('../../core/enums/PipelineTypes');
const HIGH_WATER_MARK = 5;

class ActivitiesPipeline {

  static getType() {
    return CORE;
  }

  static getMongoClientConfigKeys() {
    return [ACTIVITIES_DB_KEY];
  }

  static async watch(logger, tokenManager) {
    let watchOptions = await tokenManager.setResumeAfterWatchOptions(PIPELINE_ID, WATCH);
    const db = await MongoClients.getClientDatabase(logger, ACTIVITIES_DB_KEY);
    const watchStream = db.collection(WATCH_COLLECTION).watch([], watchOptions).stream();
    logger.info('Collection watch initiated', {collection: WATCH_COLLECTION, pipeline_id: WATCH_ID});
    const deltaTransformer = new ChangeStreamDeltaTransformer({highWaterMark: HIGH_WATER_MARK});
    StreamEventHandlers.attachEventHandlers(logger, watchStream);
    watchStream
      .pipe(StreamEventHandlers.attachEventHandlers(logger, deltaTransformer))
      .pipe(StreamEventHandlers.attachEventHandlers(
        logger,
        tokenManager.getResumeTokenWriterStream(WATCH_ID, {highWaterMark: HIGH_WATER_MARK})
      ));

  }

}

module.exports = ActivitiesPipeline;
