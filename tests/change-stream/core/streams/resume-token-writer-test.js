'use strict';

const {assert} = require('chai');
const sinon = require('sinon');
const timefreeze = require('timefreeze');
const ResumeTokenWriter = require('../../../../change-streams/core/streams/ResumeTokenWriter');

describe('ResumeTokenWriter', function () {
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
    const data = {_id: id};

    it('test that token get persisted successfully', function () {
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
        $set: {token: id},
        $inc: {total: 1},
        $currentDate: {updated_at: true},
        $setOnInsert: {created_at: frozenTime}
      };

      const resumeTokenWriter = new ResumeTokenWriter(options);
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
        $set: {token: id},
        $inc: {total: 1},
        $currentDate: {updated_at: true},
        $setOnInsert: {created_at: frozenTime}
      };
      const expectedSecondUpdate = {
        $set: {token: id},
        $inc: {total: persistRate},
        $currentDate: {updated_at: true},
        $setOnInsert: {created_at: frozenTime}
      };

      const resumeTokenWriter = new ResumeTokenWriter(options);
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
        $set: {token: id},
        $inc: {total: 1},
        $currentDate: {updated_at: true},
        $setOnInsert: {created_at: frozenTime}
      };

      const updateError = new Error('some error');
      const resumeTokenWriter = new ResumeTokenWriter(options);
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

    it('testing array success scenario when write resume token', function () {
      const data = [{
        first: 'object'
      },
      {
        second: 'object'
      },
      {
        third: 'object'
      }];
      const expectedQuery = {_id: id};
      const expectedOptions = {upsert: true};
      const expectedUpdateData = {
        $set: {token: data._id},
        $inc: {total: 3},
        $currentDate: {updated_at: true},
        $setOnInsert: {created_at: frozenTime}
      };
      const manager = new ResumeTokenWriter({
        _id: id,
        collection: {
          updateOne: (query, _data, _options, callback) => {
            assert.deepEqual(query, expectedQuery, 'Incorrect update query passed');
            assert.deepEqual(_data, expectedUpdateData, 'Incorrect update data was passed');
            assert.deepEqual(_options, expectedOptions, 'Incorrect update options were passed');
            return callback(null, {n: 1, nModified: 0, ok: 1});
          }
        },
        persistRate: 1
      });
      manager._write(data, {}, (err, response) => {
        assert.isNull(err, 'Expected error to be null');
        assert.isUndefined(response, 'Expected response to be undefined');
      });
    });
  });
});
