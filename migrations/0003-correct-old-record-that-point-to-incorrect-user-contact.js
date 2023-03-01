'use strict';
const async = require('async');

let findId ;
let replaceId;

module.exports = {
  id: '0003-correct-old-record-that-point-to-incorrect-user-contact',

  up: (db, cb) => {
    findId = '5903592716728f0001121847';
    replaceId = '59d4d0d7f7ceff00011bf5c1';
    correctuserContact(db, cb);
  },
  down: (db, cb) => {
    findId = '59d4d0d7f7ceff00011bf5c1';
    replaceId = '5903592716728f0001121847';
    correctuserContact(db, cb);
  }
};

/**
 * Correct old records that point to incorrect user contact
 *
 * @param {Object} db - The database object
 * @param {function} cb - The callback used to pass control to the next action/middleware
 *
 * @author Yogendra Tomar <brilliantyog@gmail.com>
 * @since  10 January 2018
 *
 * @return void
 */
function correctuserContact(db, cb) {
  let createdBy = {
    query: {'created_by': findId},
    update: {'created_by': replaceId}
  };

  let executingContact = {
    query: {'executing_contact': findId},
    update: {'executing_contact': replaceId}
  };

  db.collection('Activity').updateMany(createdBy.query, {$set: createdBy.update}, (err, updatedRecords)=>{
    if (err) {return cb(); }
    db.collection('Activity').updateMany(executingContact.query, {$set: executingContact.update}, cb);
  });
}

