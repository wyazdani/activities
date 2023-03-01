'use strict';

const {Readable} = require('stream');
const ResumeTokenWriter = require('./streams/ResumeTokenWriter');
const EventStoreResumeTokenWriter = require('./streams/EventStoreResumeTokenWriter');

class StreamEventHandlers {

  /**
   * Basic event handlers to reduce boiler plate code
   *
   * @param {Object} logger - The logger object
   * @param {Stream} stream - The stream to attach event handlers to
   * @param {MetricsManager} metricsManager - metrics manager class
   * @param {StreamEventHandlers.STAGE} stage - stage of the stream on pipeline
   *
   * @returns {Stream} - THe passed in stream
   */
  static attachEventHandlers(logger, stream, metricsManager, stage) {
    if (stream instanceof Readable) {
      stream.on('end', () => {
        logger.info(`Stream event: End for ${stream.constructor.name}`);
      });
    }
    // These are the legacy non-EventStore based streams
    // If more than one is running in the same pod we will kill the process
    // and destroy all the streams, this is expected but not ideally wanted.
    if (stream instanceof ResumeTokenWriter) {
      stream.on('finish', () => {
        logger.info(`Stream event: Finish for ${stream.constructor.name}`);
        // we need to exit the process as the stream is no longer active
        process.exit(0);
      });
    }

    // This is a hack and destroys the graceful shutdown implementation
    // We are however looking at converting all these streams from
    // change-streams into ss-event-store pubsub implementations.
    // This means there is no real value in wasting time on code that we are actively looking to change.
    if (stream instanceof EventStoreResumeTokenWriter) {
      stream.on('finish', () => {
        logger.info(`Stream event: Finish for ${stream.constructor.name}`);
        // we need to exit the process as the stream is no longer active
        process.exit(0);
      });
    }
    // Both Readable and Writeable support these events
    stream.on('close', () => {
      logger.info(`Stream event: Close for ${stream.constructor.name}`);
    });
    stream.on('error', (error) => {
      logger.error(`Stream event error received for ${stream.constructor.name}, exiting process now`, error);
      process.exit(1);
    });

    //for backward compatibility both vars are optional
    if (metricsManager && stage) {
      if (stage === StreamEventHandlers.STAGE.FIRST) {
        stream.on('change', () => {//Mongodb ChangeStream produces `change` event
          metricsManager.received();
        });
      }
      if (stage === StreamEventHandlers.STAGE.LAST) {
        stream.on('data', () => {
          metricsManager.processed();
        });
      }
    }
    return stream;
  }
}
/**
 * types of stages on pipeline
 */
StreamEventHandlers.STAGE = {
  FIRST: 'first',
  LAST: 'last'
};

module.exports = StreamEventHandlers;