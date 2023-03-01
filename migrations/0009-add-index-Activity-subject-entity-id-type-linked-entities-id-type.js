'use strict';

const indexObj = {
  'subject.entity_id': 1,
  'subject.entity_type': 1,
  'linked_entities.entity_id': 1,
  'linked_entities.entity_type': 1,
  'activity_date': -1
};

const indexName = 'subject_entity_id_type_linked_entity_id_type_act_date';

const indexOption = {
  background: true,
  name: indexName
};
module.exports = {
  id: '0009-add-index-Activity-subject-entity-id-type-linked-entities-id-type',

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