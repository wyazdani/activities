'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let streamTrackerSchema = new Schema(
  {
    _id: {
      type: String,
      required: true
    },
    token: {
      type: Object,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    event_meta: {
      type: Object
    },
    seed_meta: {
      type: Object
    },
    seed_complete: {
      type: Boolean
    },
    seed_completed_at: {
      type: Date
    }
  },
  {
    timestamps: {updatedAt: 'updated_at'},
    collection: 'StreamTracker'
  }
);

module.exports = mongoose.model('StreamTracker', streamTrackerSchema);
