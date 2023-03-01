'use strict';

module.exports = {
  id: '0005-remove-unused-fields',

  up: (db, cb) => {
    db.collection('Activity').update(
      {},
      {
        '$unset': {
          'executing_contact': 1,
          'executing_contact_name': 1,
          'created_by': 1,
          'created_by_name': 1,
          'linked_contact': 1,
          'linked_contact_name': 1
        }
      },
      {multi: true},
      cb
    );
  },
  down: (db, cb) => {
    cb();
  }
};
