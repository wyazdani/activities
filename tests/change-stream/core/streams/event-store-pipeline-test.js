'use strict';
const {Timestamp} = require('mongodb');
const MongoClients = require('../../../../change-streams/core/MongoClients');
const EventStoreTransformer = require('../../../../change-streams/core/streams/EventStoreTransformer');
const EventStoreReadTransformer = require('../../../../change-streams/core/streams/EventStoreReadTransformer');
const {WATCH} = require('../../../../change-streams/core/enums/StreamTypes');
const sinon = require('sinon');
const EventStorePipeline = require('../../../../change-streams/core/streams/EventStorePipeline');
const {assert} = require('chai');
const Logger = require('../../../../tools/TestUtils').logger;

describe('EventStorePipeline class', function () {
  describe('constructor()', function () {
    const requiredFields = ['logger', 'tokenManager', 'pipelineId', 'watchId', 'highWaterMark',
      'sourceCollection', 'sourceDBKey', 'transformers'];
    for (const missingField of requiredFields) {
      it(`Test validate required property ${missingField}`, function () {
        const obj = {};
        for (const field of requiredFields) {
          if (field !== missingField) {
            obj[field] = 'sample';
          }
        }
        assert.throws(
          () => EventStorePipeline.createInstance(obj),
          Error,
          `Field ${missingField} is required in event log pipeline`
        );
      });
    }
  });

  describe('start() test scenarios', async function () {
    const pipelineId = 'sample pipeline id';
    const watchId = 'sample watch id';
    const highWaterMark = 2;
    const sourceCollection = 'source collection';
    const sourceDBKey = 'db key';

    afterEach(function () {
      sinon.restore();
    });

    it('Test SEED flow configured pipeline', async function () {
      const stream = {
        on: function () {
        },
        pipe: sinon.stub().returnsThis()
      };
      const cursor = {
        on: function () {
        },
        hasNext: sinon.stub().returns(true),
        stream: sinon.stub().returns(stream)
      };
      const dbObject = {
        collection: sinon.stub().returnsThis(),
        find: sinon.stub().returnsThis(),
        sort: sinon.stub().returnsThis(),
        skip: sinon.stub().returns(cursor)
      };
      const writerStream = {on: function () {}};
      const tokenManager = {
        getResumeTokenWriterStream: function () {
          return writerStream;
        },
        setResumeAfterWatchOptions: () => {},
        getEventStoreResumeTokenWriterStream: () => {
          return writerStream;
        }
      };
      const logger = Logger.getLogger(sinon.spy());
      const setResumeAfterWatchOptions = sinon.stub(tokenManager, 'setResumeAfterWatchOptions');
      const watchOptions = {
        total: 20
      };
      setResumeAfterWatchOptions.returns(watchOptions);
      const dbStub = sinon.stub(MongoClients, 'getClientDatabase');
      dbStub.resolves(dbObject);
      class SampleTransform {
        on() {}
      }
      const pipeline = EventStorePipeline.createInstance({
        logger,
        tokenManager,
        pipelineId,
        watchId,
        highWaterMark,
        sourceCollection,
        sourceDBKey,
        transformers: [{
          class: SampleTransform,
          opts: {}
        }]
      });
      await pipeline.start();
      setResumeAfterWatchOptions.should.have.been.calledWith(pipelineId, WATCH);
      dbStub.should.have.been.calledWith(logger, sourceDBKey);
      dbObject.collection.should.have.been.calledWith(sourceCollection);
      dbObject.find.should.have.been.calledWith({});
      dbObject.sort.should.have.been.calledWith({created_at: 1});
      dbObject.skip.should.have.been.calledWith(watchOptions.total);

      assert.equal(stream.pipe.callCount, 3, 'Expected 3 components to be attached to cursor read stream');
      stream.pipe.getCall(0).args[0].should.be.instanceOf(EventStoreReadTransformer);
      stream.pipe.getCall(1).args[0].should.be.instanceOf(SampleTransform);
      stream.pipe.getCall(2).args[0].should.equal(writerStream);
    });

    it('Test Watch flow', async function () {
      let changeStream = {
        on: function () {
        },
        pipe: sinon.stub().returnsThis()
      };
      let watchStream = {
        stream: sinon.stub().returns(changeStream)
      };
      const dbObject = {
        collection: sinon.stub().returnsThis(),
        watch: sinon.stub().returns(watchStream)
      };
      const writerStream = {on: function () {}};
      const tokenManager = {
        getResumeTokenWriterStream: function () {
          return writerStream;
        },
        setResumeAfterWatchOptions: () => {},
        getEventStoreResumeTokenWriterStream: () => {
          return writerStream;
        }
      };
      const logger = Logger.getLogger(sinon.spy());
      const setResumeAfterWatchOptions = sinon.stub(tokenManager, 'setResumeAfterWatchOptions');
      const watchOptions = {
        seed_complete: true,
        resumeAfter: 'sample'
      };
      setResumeAfterWatchOptions.returns(watchOptions);
      const dbStub = sinon.stub(MongoClients, 'getClientDatabase');
      dbStub.resolves(dbObject);
      class SampleTransform {
        on() {}
      }
      const pipeline = EventStorePipeline.createInstance({
        logger,
        tokenManager,
        pipelineId,
        watchId,
        highWaterMark,
        sourceCollection,
        sourceDBKey,
        transformers: [{
          class: SampleTransform,
          opts: {}
        }]
      });
      await pipeline.start();
      setResumeAfterWatchOptions.should.have.been.calledWith(pipelineId, WATCH);
      dbStub.should.have.been.calledWith(logger, sourceDBKey);
      dbObject.collection.should.have.been.calledWith(sourceCollection);
      dbObject.watch.should.have.been.calledWith([], watchOptions);

      assert.equal(changeStream.pipe.callCount, 3, 'Expected 3 components to be attached to cursor read stream');
      changeStream.pipe.getCall(0).args[0].should.be.instanceOf(EventStoreTransformer);
      changeStream.pipe.getCall(1).args[0].should.be.instanceOf(SampleTransform);
      changeStream.pipe.getCall(2).args[0].should.equal(writerStream);
    });

    it('Test Watch flow with startAtOperationTime', async function () {
      let changeStream = {
        on: function () {
        },
        pipe: sinon.stub().returnsThis()
      };
      let watchStream = {
        stream: sinon.stub().returns(changeStream)
      };
      const dbObject = {
        collection: sinon.stub().returnsThis(),
        watch: sinon.stub().returns(watchStream)
      };
      const writerStream = {on: function () {}};
      const tokenManager = {
        getResumeTokenWriterStream: function () {
          return writerStream;
        },
        setResumeAfterWatchOptions: () => {},
        getEventStoreResumeTokenWriterStream: () => {
          return writerStream;
        }
      };
      const logger = Logger.getLogger(sinon.spy());
      const setResumeAfterWatchOptions = sinon.stub(tokenManager, 'setResumeAfterWatchOptions');
      const watchOptions = {
        seed_complete: true,
        seed_meta: {
          actioned_at: new Date()
        }
      };
      setResumeAfterWatchOptions.returns(watchOptions);
      const dbStub = sinon.stub(MongoClients, 'getClientDatabase');
      dbStub.resolves(dbObject);
      class SampleTransform {
        on() {}
      }
      const pipeline = EventStorePipeline.createInstance({
        logger,
        tokenManager,
        pipelineId,
        watchId,
        highWaterMark,
        sourceCollection,
        sourceDBKey,
        transformers: [{
          class: SampleTransform,
          opts: {}
        }]
      });
      await pipeline.start();
      setResumeAfterWatchOptions.should.have.been.calledWith(pipelineId, WATCH);
      dbStub.should.have.been.calledWith(logger, sourceDBKey);
      dbObject.collection.should.have.been.calledWith(sourceCollection);
      dbObject.watch.should.have.been.calledWith([], watchOptions);
      watchOptions.startAtOperationTime.should.deep.equal(
        new Timestamp(1, watchOptions.seed_meta.actioned_at.valueOf() / 1000)
      );

      assert.equal(changeStream.pipe.callCount, 3, 'Expected 3 components to be attached to cursor read stream');
      changeStream.pipe.getCall(0).args[0].should.be.instanceOf(EventStoreTransformer);
      changeStream.pipe.getCall(1).args[0].should.be.instanceOf(SampleTransform);
      changeStream.pipe.getCall(2).args[0].should.equal(writerStream);
    });

    it('Test pipeline throws the expected error when seed complete not configured correctly', async function () {
      const logger = Logger.getLogger(sinon.spy());
      const tokenManager = {
        setResumeAfterWatchOptions: () => {}
      };
      const setResumeAfterWatchOptions = sinon.stub(tokenManager, 'setResumeAfterWatchOptions');
      const watchOptions = {
        seed_complete: true,
        resumeAfter: undefined
      };
      setResumeAfterWatchOptions.returns(watchOptions);
      const exit = sinon.stub(process, 'exit');
      const pipeline = EventStorePipeline.createInstance({
        logger,
        tokenManager,
        pipelineId,
        watchId,
        highWaterMark,
        sourceCollection,
        sourceDBKey,
        transformers: []
      });
      await pipeline.start();
      setResumeAfterWatchOptions.should.have.been.calledWith(pipelineId, WATCH);
      exit.should.have.been.calledOnce;
    });
  });
});
