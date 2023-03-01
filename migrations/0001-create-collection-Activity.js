'use strict';

module.exports = {
  id: '0001-create-collection-Activity',

  up: (db, cb) => {
    db.createCollection('Activity', {collation: {locale: 'en_US', strength: 2}}, cb);
  },

  down: (db, cb) => {
    db.collection('Activity').drop(cb);
  }
};
