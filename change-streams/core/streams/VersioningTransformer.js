'use strict';

const _ = require('lodash');
const {Transform} = require('stream');
const {isEmpty} = require('../../../helpers/ComparatorHelper');
const {INSERT, UPDATE, REPLACE, SEED} = require('../../../enums/ChangeStreamEvents');
const {CORE, ENRICHMENT} = require('../../core/enums/PipelineTypes');
/**
 * Responsible to do versioning on documents
 * This transformer is called usually before readwrite
 */
class VersioningTransformer extends Transform {

  constructor(opts) {
    // We only cater for object mode
    opts.objectMode = true;
    super(opts);
    this.pipelineType = opts.pipelineType;
    this.logger = opts.logger;
    if (!this.pipelineType) {
      throw new Error('pipeline type should be defined for versioning transformer');
    }
  }

  _transform(data, encoding, callback) {
    if (!isEmpty(data.updates)) {
      if (this.pipelineType === CORE) {
        if ([INSERT, SEED, REPLACE].includes(data.operationType)) {
          _.set(data, 'updates.$set.__v', 0);
          const currentDate = new Date(); //we set this into one var to set the both equal
          _.set(data, 'updates.$set.created_at', currentDate);
          _.set(data, 'updates.$set.updated_at', currentDate);
          this.logger.debug('versioning fields set');
        }
      }
      //If pipeline type is core, we check if it's only update we set versioning fields
      if (this.pipelineType === ENRICHMENT || data.operationType === UPDATE) {
        if (!isEmpty(data.updates.$set) || !isEmpty(data.updates.$unset)) {
          _.set(data, 'updates.$set.updated_at', new Date());
          _.set(data, 'updates.$inc.__v', 1);
          this.logger.debug('versioning fields updated');
        }
      }
    }
    callback(null, data);
  }
}

module.exports = VersioningTransformer;