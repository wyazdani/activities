'use strict';
const {Transform} = require('stream');

/**
 * Convert a cursor stream into expected stream structure
 *   Handles the Mongo Cursor Stream items
 */
class EventStoreReadTransformer extends Transform {
  constructor(opts) {
    // We only cater for object mode
    opts.objectMode = true;
    super(opts);
  }

  /**
   *
   * @param {Object} data - The chunk to be transformed. Will be object since we operate in object mode
   * @param {*} encoding - If the chunk is a string, then this is the encoding type.
   * If data is a buffer, then this is the special value - 'buffer', ignore it in this case.
   * @param {function} callback A callback function (optionally with an error argument and data) to be called
   * after the supplied data has been processed.
   *
   * @returns {Object} - The transformed event in the format
   * {
   *  _id: <change stream identifier>,
   *  event: <full document>
   *  operationType: SEED,
   *  event_meta: {
   *    event_id: <event_store_id>,
   *    actioned_at: <event_created_at>
   *  }
   * }
   */
  _transform(data, encoding, callback) {
    callback(null, {
      operationType: 'SEED',
      event: data,
      seed_meta: {
        event_id: data._id,
        actioned_at: data.created_at
      }
    });
  }
}

module.exports = EventStoreReadTransformer;