'use strict';
const _ = require('lodash');
const {Timestamp} = require('mongodb');
const MongoClients = require('../MongoClients');
const StreamEventHandlers = require('../StreamEventHandlers');
const EventStoreTransformer = require('./EventStoreTransformer');
const EventStoreReadTransformer = require('./EventStoreReadTransformer');
const {WATCH} = require('../enums/StreamTypes');

class EventStorePipeline {
  /**
   * create instance of pipeline
   *
   * Note: why did we create this method?
   * We wanted to test parameters passed to the constructor.
   * Sinon has some limits, we can't assert constructor properties
   *
   * @param {Object} opts - options
   * @param {LoggerContext} opts.logger - logger
   * @param {ResumeTokenCollectionManager} opts.tokenManager - The resume token manager
   * @param {String} opts.pipelineId - pipeline id
   * @param {String} opts.watchId - watch id
   * @param {Number} opts.highWaterMark - high water mark for all of the stages in pipeline
   * @param {String} opts.sourceCollection - event store source collection name
   * @param {String} opts.sourceDBKey - source db key
   * @param {Object[]} opts.transformers - list of transformers
   * @returns {EventStorePipeline}
   */
  static createInstance(opts) {
    return new EventStorePipeline(opts);
  }

  constructor(opts) {
    this._validateRequiredFields(opts);
    this._logger = opts.logger;
    this._tokenManager = opts.tokenManager;
    this._pipelineId = opts.pipelineId;
    this._watchId = opts.watchId;
    this._highWaterMark = opts.highWaterMark;
    this._sourceCollection = opts.sourceCollection;
    this._sourceDBKey = opts.sourceDBKey;
    this._transformers = opts.transformers;

    this._shutdownFunc = null;
  }

  /**
   * validate options to make sure correct arguments are passed to the pipeline
   *
   * @param {Object} opts - options
   * @private
   */
  _validateRequiredFields(opts) {
    const requiredFields = ['logger', 'tokenManager', 'pipelineId', 'watchId', 'highWaterMark',
      'sourceCollection', 'sourceDBKey', 'transformers'];
    _.map(requiredFields, (field) => {
      if (_.isUndefined(opts[field])) {
        throw new Error(`Field ${field} is required in event log pipeline`);
      }
    });
  }

  /**
   * Pipeline entry point, either goes into SEED / WATCH mode depending on the StreamTracker data.
   *
   */
  async start() {
    let watchOptions = await this._tokenManager.setResumeAfterWatchOptions(this._pipelineId, WATCH);
    if (!watchOptions.seed_complete) {
      return this._seed(watchOptions);
    }
    if (!watchOptions.resumeAfter) {
      if (!watchOptions.seed_meta || !watchOptions.seed_meta.actioned_at) {
        this._logger.error('Seed has completed, no token set need the last event timestamp to start watching', {
          watchOptions,
          pipeline_id: this._pipelineId
        });
        return process.exit(1);
      }
      watchOptions.startAtOperationTime = new Timestamp(1, watchOptions.seed_meta.actioned_at.valueOf() / 1000);
    }
    return this._watch(watchOptions);
  }

  /**
   * EVENT mode, will attach a change stream to the related services EventStore.
   * Events are then pushed near real-time into this stream.
   *
   * @param {Object} watchOptions - The watch options used to resume the change stream
   */
  async _watch(watchOptions) {
    const db = await MongoClients.getClientDatabase(this._logger, this._sourceDBKey);
    const watchStream = db.collection(this._sourceCollection).watch([], watchOptions).stream();
    this._logger.info(
      'Collection watch initiated',
      {collection: this._sourceCollection, pipeline_id: this._pipelineId}
    );

    const eventStoreTransformer = new EventStoreTransformer({highWaterMark: this._highWaterMark});

    StreamEventHandlers.attachEventHandlers(this._logger, watchStream);
    const tokenWriterStream = this._tokenManager.getEventStoreResumeTokenWriterStream(
      this._watchId, {highWaterMark: this._highWaterMark}
    );
    let stream = watchStream
      .pipe(StreamEventHandlers.attachEventHandlers(this._logger, eventStoreTransformer));
    _.map(this._transformers, (transformerConfig) => {
      const transformer = new transformerConfig.class(transformerConfig.opts);
      stream = stream.pipe(StreamEventHandlers.attachEventHandlers(this._logger, transformer));
    });
    stream = stream.pipe(StreamEventHandlers.attachEventHandlers(this._logger, tokenWriterStream));
    this._shutdownFunc = () => {
      return new Promise((resolve) => {
        this._logger.info(`${this._pipelineId} exiting change stream gracefully`);
        tokenWriterStream.on('finish', () => {
          this._logger.info(`${this._pipelineId} finished shutdown`);
          resolve();
        });
        watchStream.destroy();
        watchStream.emit('end');
      });
    };
  }

  /**
   * SEED mode, will attach a read stream to the related services EventStore.
   * We read from the EventStore one event at a time
   * When the READ mode completes the entrypoint is re-triggered.
   *
   * @param {Object} watchOptions - The watch options used to resume the read stream
   */
  async _seed(watchOptions) {
    const db = await MongoClients.getClientDatabase(this._logger, this._sourceDBKey);
    const cursor = db.collection(this._sourceCollection).find({}).sort({created_at: 1}).skip(watchOptions.total || 0);
    // If there are no next results, mark seed complete nothing to pipe
    if (!await cursor.hasNext()) {
      await this._tokenManager.setEventStorePipelineSeedComplete(this._watchId);
      return this.start();
    }

    let readTransformer = new EventStoreReadTransformer({highWaterMark: this._highWaterMark});
    //set options to initialize streams
    const tokenWriterStream = this._tokenManager.getEventStoreResumeTokenWriterStream(this._watchId, {
      highWaterMark: this._highWaterMark,
      persistRate: 1
    });
    let stream = cursor.stream();
    StreamEventHandlers.attachEventHandlers(this._logger, stream);
    stream = stream.pipe(StreamEventHandlers.attachEventHandlers(this._logger, readTransformer));
    _.map(this._transformers, (transformerConfig) => {
      const transformer = new transformerConfig.class(transformerConfig.opts);
      stream = stream.pipe(StreamEventHandlers.attachEventHandlers(this._logger, transformer));
    });
    stream.pipe(StreamEventHandlers.attachEventHandlers(this._logger, tokenWriterStream));
    let shutdownCalled = false;
    tokenWriterStream.on('finish', async () => {
      if (!shutdownCalled) {
        this._shutdownFunc = null;//cleanup shutdown function
        await this._tokenManager.setEventStorePipelineSeedComplete(this._watchId);
        return this.start();
      }
    });

    this._shutdownFunc = () => {
      shutdownCalled = true;
      this._logger.info(`${this._pipelineId} shutdown called while doing the seed, exiting gracefully`);
      return new Promise((resolve) => {
        tokenWriterStream.on('finish', () => {
          this._logger.info(`${this._pipelineId} finished shutdown`);
          resolve();
        });
        cursor.close(() => {
          readTransformer.end();
        });
      });
    };
  }

  /**
   * Shutdown pipeline
   *
   * @returns {Promise<void>}
   */
  async shutdown() {
    try {
      this._logger.info(`${this._pipelineId} shutdown called`);
      if (_.isFunction(this._shutdownFunc)) {
        await this._shutdownFunc.bind(this).call();
      }
    } catch (error) {
      this._logger.error(`error while doing shutdown on ${this._pipelineId}`, error);
    }
  }

}

module.exports = EventStorePipeline;
