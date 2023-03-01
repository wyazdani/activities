'use strict';

let indexObj = {
  'linked_entities.entity_id': 1,
  'linked_entities.entity_type': 1,
  'activity_date': 1
};

const indexName = 'linked_entity_id_type_act_date';

const indexOption = {
  background: true,
  name: indexName
};
module.exports = {
  id: '0008-add-index-Activity-linked_entities_entity_id_type_activity_date',

  up: (db, cb) => {
    db.collection('Activity').createIndex(indexObj, indexOption, cb);
  },
  down: (db, cb) => {
    db.collection('Activity').indexes((error, indexes) => {
      if (error) {
        return cb(error);
      }
      if (indexes.find((index) => index.name === indexName)) {
        db.collection('Activity').dropIndex(indexName, cb);
      } else {
        cb();
      }
    });
  }
};