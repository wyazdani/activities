'use strict';

const {Transform} = require('stream');
const {isEmpty} = require('../../../helpers/ComparatorHelper');
const {UPDATE, INSERT, SEED, DELETE, SYNC, REPLACE} = require('../../../enums/ChangeStreamEvents');

/**
 * Enrichment read write class
 * We transform ALL db operations to Update operation
 */
class EnrichmentReadWrite extends Transform {
  constructor(opts) {
    // We only cater for object mode
    opts.objectMode = true;
    super(opts);
    this.collection = opts.collection;
    this.pipeline = opts.pipeline;
    this.logger = opts.logger;
  }

  _transform(data, encoding, callback) {
    switch (data.operationType) {
      case UPDATE:
      case INSERT:
      case SEED:
      case DELETE:
      case SYNC:
      case REPLACE:
        this._update(data, encoding, callback);
        break;
      default:
        this.logger.error(
          'Event not supported, enrichment should always do the update',
          {event: data.operationType}, {pipeline: this.pipeline}
        );
        callback(new Error(`Change Event: ${data.operationType} is currently not supported`));
    }
  }

  _update(data, encoding, callback) {
    if (isEmpty(data.updates['$set']) && isEmpty(data.updates['$unset'])) {
      this.logger.debug('EnrichmentReadWrite::_update NOOP', {pipeline: this.pipeline});
      callback(null, data);
    } else {
      if (isEmpty(data.updates.$set)) {
        delete data.updates.$set;
      }
      if (isEmpty(data.updates.$unset)) {
        delete data.updates.$unset;
      }
      this.collection.updateOne({_id: data.documentKey._id}, data.updates, (error, response) => {
        if (error) {
          this.logger.error('EnrichmentReadWrite::_update failed', {pipeline: this.pipeline, error});
          return callback(error);
        }
        if (response.matchedCount > 0) {
          this.logger.debug('EnrichmentReadWrite::_update executed', {pipeline: this.pipeline});
          callback(null, data);
        } else {
          this.logger.error(
            'EnrichmentReadWrite::_update failed, cant find the record to update',
            {pipeline: this.pipeline, key: data.documentKey._id, operation: data.operationType}
          );
          return callback(
            new Error(`Expected update does not exist, id: ${data.documentKey._id}
              pipeline: ${this.pipeline} original operation: ${data.operationType}`
            )
          );
        }
      });
    }
  }
}

module.exports = EnrichmentReadWrite;
