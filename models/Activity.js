'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {TransformSchemaMongoosePlugin} = require('a24-node-advanced-query-utils');

const entitySchema = new Schema({
  entity_id: {type: String},
  entity_type: {type: String},
  name: {type: String}
}, {_id: false});

const entityWithContextSchema = new Schema({
  entity_id: {type: String},
  entity_type: {type: String},
  name: {type: String},
  context_id: {type: String},
  context_type: {type: String}
}, {_id: false});

const ActivitySchema = new Schema(
  {
    activity_type: {type: String},
    description: {type: String},
    comment: {type: String},
    linked_entities: [entitySchema],
    subject: entitySchema,
    activity_date: {type: Date},
    executing_entity: entityWithContextSchema,
    created_by_entity: entityWithContextSchema
  },
  {
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
    collection: 'Activity',
    timezone_fields: ['activity_date']
  }
);

ActivitySchema.plugin(TransformSchemaMongoosePlugin.transformSchemaToJsonObject);
module.exports = mongoose.model('Activity', ActivitySchema);
