'use strict';
const {Transform} = require('stream');
const {INSERT} = require('../../../enums/ChangeStreamEvents');

/**
 * Convert a event store stream change into expected stream structure
 *   Handles the Mongo Change Stream event
 */
class EventStoreTransformer extends Transform {
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
   *  operationType: EVENT,
   *  event_meta: {
   *    event_id: <event_store_id>,
   *    actioned_at: <event_created_at>
   *  }
   * }
   */
  _transform(data, encoding, callback) {
    let newData = {};

    // EventStores only have inserts that have value, anything else is a NOOP
    if (data.operationType !== INSERT) {
      newData = {
        _id: data._id,
        operationType: 'EVENT',
        event: {
          type: 'NOOP'
        }
      };
    } else {
      newData = {
        _id: data._id,
        operationType: 'EVENT',
        event: data.fullDocument,
        event_meta: {
          event_id: data.fullDocument._id,
          actioned_at: data.fullDocument.created_at
        }
      };
    }
    callback(null, newData);
  }
}

module.exports = EventStoreTransformer;