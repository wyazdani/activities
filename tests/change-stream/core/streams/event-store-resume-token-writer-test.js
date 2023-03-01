'use strict';

const {assert} = require('chai');
const sinon = require('sinon');
const timefreeze = require('timefreeze');
const EventStoreResumeTokenWriter = require('../../../../change-streams/core/streams/EventStoreResumeTokenWriter');

describe('EventStoreResumeTokenWriter', function () {
  const id = '5d679643369bc7fa9e7d6fff';
  let sandbox;
  let updateOneStub;
  const frozenTime = new Date();

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    updateOneStub = sandbox.stub();
    timefreeze.freeze(frozenTime);
  });

  afterEach(function () {
    sandbox.restore();
    timefreeze.reset();
  });

  describe('_write()', function () {
    const data = {
      _id: id,
      operationType: 'EVENT',
      event_meta: {
        meta: 'defined'
      }
    };

    it('test that token get persisted successfully for the EVENT operationType', function () {
      const options = {
        _id: id,
        persistRate: 1,
        collection: {
          updateOne: updateOneStub
        }
      };
      const expectedQuery = {_id: id};
      const expectedOpts = {upsert: true};
      const expectedUpdate = {
        $set: {token: id, event_meta: {meta: 'defined'}},
        $inc: {total: 1},
        $currentDate: {updated_at: true},
        $setOnInsert: {created_at: frozenTime}
      };

      const resumeTokenWriter = new EventStoreResumeTokenWriter(options);
      updateOneStub.callsFake((query, updates, options, cb) => {
        assert.deepEqual(query, expectedQuery, 'Incorrect query for updateOne operation');
        assert.deepEqual(updates, expectedUpdate, 'Incorrect updates for updateOne operation');
        assert.deepEqual(options, expectedOpts, 'Incorrect options for updateOne operation');
        cb();
      });
      resumeTokenWriter.write(data);
      assert.equal(updateOneStub.callCount, 1, 'updateOne operation should be called once');
    });

    it('test that token get persisted successfully for the SEED operationType', function () {
      const data = {
        operationType: 'SEED',
        seed_meta: {
          meta: 'defined'
        }
      };
      const options = {
        _id: id,
        persistRate: 1,
        collection: {
          updateOne: updateOneStub
        }
      };
      const expectedQuery = {_id: id};
      const expectedOpts = {upsert: true};
      const expectedUpdate = {
        $set: {seed_meta: {meta: 'defined'}},
        $inc: {total: 1},
        $currentDate: {updated_at: true},
        $setOnInsert: {created_at: frozenTime}
      };

      const resumeTokenWriter = new EventStoreResumeTokenWriter(options);
      updateOneStub.callsFake((query, updates, options, cb) => {
        assert.deepEqual(query, expectedQuery, 'Incorrect query for updateOne operation');
        assert.deepEqual(updates, expectedUpdate, 'Incorrect updates for updateOne operation');
        assert.deepEqual(options, expectedOpts, 'Incorrect options for updateOne operation');
        cb();
      });
      resumeTokenWriter.write(data);
      assert.equal(updateOneStub.callCount, 1, 'updateOne operation should be called once');
    });

    it('test that persist rate works correctly', function () {
      const persistRate = 3;
      const options = {
        _id: id,
        persistRate,
        collection: {
          updateOne: updateOneStub
        }
      };
      const expectedQuery = {_id: id};
      const expectedOpts = {upsert: true};
      const expectedUpdate = {
        $set: {token: id, event_meta: {meta: 'defined'}},
        $inc: {total: 1},
        $currentDate: {updated_at: true},
        $setOnInsert: {created_at: frozenTime}
      };
      const expectedSecondUpdate = {
        $set: {token: id, event_meta: {meta: 'defined'}},
        $inc: {total: persistRate},
        $currentDate: {updated_at: true},
        $setOnInsert: {created_at: frozenTime}
      };

      const resumeTokenWriter = new EventStoreResumeTokenWriter(options);
      updateOneStub.onCall(0).callsFake((query, updates, options, cb) => {
        assert.deepEqual(query, expectedQuery, 'Incorrect query for updateOne operation');
        assert.deepEqual(updates, expectedUpdate, 'Incorrect updates for updateOne operation');
        assert.deepEqual(options, expectedOpts, 'Incorrect options for updateOne operation');
        cb();
      });
      updateOneStub.onCall(1).callsFake((query, updates, options, cb) => {
        assert.deepEqual(query, expectedQuery, 'Incorrect query for updateOne operation');
        assert.deepEqual(updates, expectedSecondUpdate, 'Incorrect updates for updateOne operation');
        assert.deepEqual(options, expectedOpts, 'Incorrect options for updateOne operation');
        cb();
      });

      for (let i = 0; i < persistRate + 1; i++) {
        resumeTokenWriter.write(data);
      }
      assert.equal(updateOneStub.callCount, 2, 'updateOne operation should be called twice');
    });

    it('test that an error is emitted when updateOne operation fails', function () {
      const options = {
        _id: id,
        persistRate: 1,
        collection: {
          updateOne: updateOneStub
        }
      };
      const expectedQuery = {_id: id};
      const expectedOpts = {upsert: true};
      const expectedUpdate = {
        $set: {token: id, event_meta: {meta: 'defined'}},
        $inc: {total: 1},
        $currentDate: {updated_at: true},
        $setOnInsert: {created_at: frozenTime}
      };

      const updateError = new Error('some error');
      const resumeTokenWriter = new EventStoreResumeTokenWriter(options);
      updateOneStub.callsFake((query, updates, options, cb) => {
        assert.deepEqual(query, expectedQuery, 'Incorrect query for updateOne operation');
        assert.deepEqual(updates, expectedUpdate, 'Incorrect updates for updateOne operation');
        assert.deepEqual(options, expectedOpts, 'Incorrect options for updateOne operation');
        cb(updateError);
      });
      resumeTokenWriter.on('error', (e) => {
        assert.deepEqual(e, updateError, 'Incorrect error emitted');
      });
      resumeTokenWriter.write(data);
    });
  });
});
