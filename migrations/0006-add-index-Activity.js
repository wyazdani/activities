'use strict';

let indexObj = {
  'subject.entity_id': 1,
  'subject.entity_type': 1,
  'activity_date': -1
};
let indexOption = {
  background: true,
  name: 'subject_and_activity_date'
};
module.exports = {
  id: '0006-add-index-Activity',

  up: (db, cb) => {
    db.collection('Activity').createIndex(indexObj, indexOption, cb);
  },
  down: (db, cb) => {
    cb();
  }
};