'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const assert = chai.assert;
const {ResumeTokenCollectionManager} = require('../../../change-streams/core/ResumeTokenCollectionManager');
const ResumeTokenWriter = require('../../../change-streams/core/streams/ResumeTokenWriter');
const EventStoreResumeTokenWriter = require('../../../change-streams/core/streams/EventStoreResumeTokenWriter');
const STREAM_TYPES = require('../../../change-streams/core/enums/StreamTypes');
const {Timestamp} = require('mongodb');
const timefreeze = require('timefreeze');

describe('ResumeTokenCollectionManager', function () {
  const pipeline = 'user_context';
  const collection = 'Activity';
  let sandbox;
  let findOneStub;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    findOneStub = sandbox.stub();
  });

  afterEach(function () {
    sandbox.restore();
    timefreeze.reset();
  });

  describe('setResumeAfterWatchOptions()', function () {
    describe('stream type: seed', function () {
      it('return expected watch options when no resume is found', async function () {
        const db = {
          collection: (colName) => {
            assert.equal(colName, collection, 'Incorrect collection used');
            return {findOne: findOneStub};
          }
        };

        findOneStub.resolves(null);
        const resumeTokenCollectionManager = new ResumeTokenCollectionManager();
        resumeTokenCollectionManager.setDatabase(db);
        resumeTokenCollectionManager.setCollectionName(collection);
        const results = await resumeTokenCollectionManager.setResumeAfterWatchOptions(pipeline, STREAM_TYPES.SEED);
        assert.deepEqual(results, {}, 'Incorrect resume watch options returned');
        findOneStub.should.have.been.calledWith({_id: 'user_context_seed'});
      });

      it('return expected watch options when resume token is found in the DB', async function () {
        const token = '12345';
        const total = 5;
        const db = {
          collection: (colName) => {
            assert.equal(colName, collection, 'Incorrect collection used');
            return {findOne: findOneStub};
          }
        };
        const expectedWatchOptions = {
          resumeAfter: {data: token},
          total
        };
        findOneStub.resolves({token: {data: token}, total});
        const resumeTokenCollectionManager = new ResumeTokenCollectionManager();
        resumeTokenCollectionManager.setDatabase(db);
        resumeTokenCollectionManager.setCollectionName(collection);
        const results = await resumeTokenCollectionManager.setResumeAfterWatchOptions(pipeline, STREAM_TYPES.SEED);
        assert.deepEqual(results, expectedWatchOptions, 'Incorrect resume watch options returned');
        findOneStub.should.have.been.calledWith({_id: 'user_context_seed'});
      });

      it(
        'return expected watch options when resume token is found in the DB with seed properties defined',
        async function () {
          const token = '12345';
          const total = 5;
          const db = {
            collection: (colName) => {
              assert.equal(colName, collection, 'Incorrect collection used');
              return {findOne: findOneStub};
            }
          };
          const expectedWatchOptions = {
            resumeAfter: {data: token},
            seed_complete: false,
            seed_meta: {meta: 'defined'},
            total
          };
          findOneStub.resolves(
            {
              seed_complete: false,
              seed_meta: {meta: 'defined'},
              token: {data: token},
              total
            }
          );
          const resumeTokenCollectionManager = new ResumeTokenCollectionManager();
          resumeTokenCollectionManager.setDatabase(db);
          resumeTokenCollectionManager.setCollectionName(collection);
          const results = await resumeTokenCollectionManager.setResumeAfterWatchOptions(pipeline, STREAM_TYPES.SEED);
          assert.deepEqual(results, expectedWatchOptions, 'Incorrect resume watch options returned');
          findOneStub.should.have.been.calledWith({_id: 'user_context_seed'});
        }
      );

      it('throw an error when db or collection is not set', async function () {
        const resumeTokenCollectionManager = new ResumeTokenCollectionManager();
        await resumeTokenCollectionManager.setResumeAfterWatchOptions(pipeline, STREAM_TYPES.SEED)
          .should.be.rejectedWith(Error, 'Set both db and collection name before requesting watch option');
      });

      it('throw an error when findOne operation fails', async function () {
        const db = {
          collection: () => ({findOne: findOneStub})
        };
        findOneStub.rejects(new Error('something is afoot'));
        const resumeTokenCollectionManager = new ResumeTokenCollectionManager();
        resumeTokenCollectionManager.setDatabase(db);
        resumeTokenCollectionManager.setCollectionName(collection);
        await resumeTokenCollectionManager.setResumeAfterWatchOptions(pipeline, STREAM_TYPES.SEED)
          .should.be.rejectedWith(Error, 'something is afoot');
      });

      it('throw an error when operation type not specified', async function () {
        const resumeTokenCollectionManager = new ResumeTokenCollectionManager();
        resumeTokenCollectionManager.setDatabase({});
        resumeTokenCollectionManager.setCollectionName({});
        await resumeTokenCollectionManager.setResumeAfterWatchOptions(pipeline)
          .should.be.rejectedWith(Error, `StreamType is not defined for pipeline: ${pipeline}`);
      });
    });
    describe('stream type: watch', function () {
      const createdAt = new Date();
      it('return expected watch options when no resume is found', async function () {
        const db = {
          collection: (colName) => {
            assert.equal(colName, collection, 'Incorrect collection watch');
            return {findOne: findOneStub};
          }
        };
        findOneStub.onCall(0).resolves(null);
        findOneStub.onCall(1).resolves({
          created_at: createdAt
        });
        const resumeTokenCollectionManager = new ResumeTokenCollectionManager();
        resumeTokenCollectionManager.setDatabase(db);
        resumeTokenCollectionManager.setCollectionName(collection);
        const results = await resumeTokenCollectionManager.setResumeAfterWatchOptions(pipeline, STREAM_TYPES.WATCH);
        assert.deepEqual(results, {
          startAtOperationTime: new Timestamp(1, createdAt.valueOf() / 1000)
        }, 'Incorrect resume watch options returned');
        findOneStub.getCall(0).args.should.to.deep.equal([{_id: 'user_context_watch'}]);
        findOneStub.getCall(1).args.should.to.deep.equal([{_id: 'user_context_seed'}]);
      });

      it('return expected watch options when resume token is found in the DB', async function () {
        const token = '12345';
        const total = 5;
        const db = {
          collection: (colName) => {
            assert.equal(colName, collection, 'Incorrect collection watch');
            return {findOne: findOneStub};
          }
        };
        const expectedWatchOptions = {
          resumeAfter: {data: token},
          total
        };
        findOneStub.resolves({token: {data: token}, total});
        const resumeTokenCollectionManager = new ResumeTokenCollectionManager();
        resumeTokenCollectionManager.setDatabase(db);
        resumeTokenCollectionManager.setCollectionName(collection);
        const results = await resumeTokenCollectionManager.setResumeAfterWatchOptions(pipeline, STREAM_TYPES.WATCH);
        assert.deepEqual(results, expectedWatchOptions, 'Incorrect resume watch options returned');
        findOneStub.should.have.been.calledWith({_id: 'user_context_watch'});
      });
    });
  });

  describe('getResumeTokenWriterStream()', function () {
    it('should return ResumeTokenWriter', function () {
      const db = {
        collection: (colName) => {
          assert.equal(colName, collection, 'Incorrect collection used');
          return {findOne: findOneStub};
        }
      };
      const resumeTokenCollectionManager = new ResumeTokenCollectionManager();
      resumeTokenCollectionManager.setDatabase(db);
      resumeTokenCollectionManager.setCollectionName(collection);
      const writerStream = resumeTokenCollectionManager.getResumeTokenWriterStream('user_context_watch');
      assert.equal(
        writerStream instanceof ResumeTokenWriter,
        true,
        'Returned stream is not an instance of ResumeTokenWriter'
      );
    });
  });

  describe('getEventStoreResumeTokenWriterStream()', function () {
    it('should return EventStoreResumeTokenWriter', function () {
      const db = {
        collection: (colName) => {
          assert.equal(colName, collection, 'Incorrect collection used');
          return {findOne: findOneStub};
        }
      };
      const resumeTokenCollectionManager = new ResumeTokenCollectionManager();
      resumeTokenCollectionManager.setDatabase(db);
      resumeTokenCollectionManager.setCollectionName(collection);
      const writerStream = resumeTokenCollectionManager.getEventStoreResumeTokenWriterStream('user_context_watch');
      assert.equal(
        writerStream instanceof EventStoreResumeTokenWriter,
        true,
        'Returned stream is not an instance of ResumeTokenWriter'
      );
    });
  });

  describe('setEventStorePipelineSeedComplete()', function () {
    it('should return EventStoreResumeTokenWriter', async function () {
      const frozenTime = new Date();
      timefreeze.freeze(frozenTime);
      const pipelineId = 'user_context_watch';
      const updateOneStub = sandbox.stub((query, data) => {
        assert.deepEqual(query, {_id: pipelineId}, 'Query should update on _id');
        assert.deepEqual(
          data,
          {
            $set: {seed_complete: true},
            $currentDate: {seed_completed_at: {$type: 'date'}},
            $setOnInsert: {
              seed_meta: {
                actioned_at: frozenTime,
                source_empty: true
              },
              created_at: frozenTime
            }
          },
          'Unexpected data received'
        );
      });
      const db = {
        collection: (colName) => {
          assert.equal(colName, collection, 'Incorrect collection used');
          return {updateOne: updateOneStub};
        }
      };
      const resumeTokenCollectionManager = new ResumeTokenCollectionManager();
      resumeTokenCollectionManager.setDatabase(db);
      resumeTokenCollectionManager.setCollectionName(collection);
      return resumeTokenCollectionManager.setEventStorePipelineSeedComplete(pipelineId);
    });
  });
});
