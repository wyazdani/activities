'use strict';

const chai = require('chai');
const assert = chai.assert;
const sinon = require('sinon');
const {ACTIVITIES_DB_KEY} = require('../../../../change-streams/DatabaseConfigKeys');
const {CORE} = require('../../../../change-streams/core/enums/PipelineTypes');
const MongoClients = require('../../../../change-streams/core/MongoClients');
const ChangeStreamDeltaTransformer = require('../../../../change-streams/core/streams/ChangeStreamDeltaTransformer');
const ActivitiesPipeline = require('../../../../change-streams/Activity/pipelines/ActivitiesPipeline');
const {logger} = require('../../../../tools/TestUtils');

describe('ActivitiesPipeline test scenarios', function () {
  let logSpy;

  beforeEach(() => {
    logSpy = sinon.spy();
  });
  afterEach(() => {
    sinon.restore();
    logSpy = null;
  });

  describe('getType()', function () {

    /**
     * Test success scenario.
     *
     * @author Ruta Zala <rzdevloper@gmail.com>
     * @since  26 April 2021
     *
     * @covers change-streams/Activity/pipelines/ActivitiesEventStorePipeline.getType
     */
    it('testing success scenario when correct type is returned', function () {
      const response = ActivitiesPipeline.getType();
      assert.equal(response, CORE, 'Expected type was not returned');
    });
  });

  describe('getMongoClientConfigKeys()', function () {

    /**
     * Test success scenario.
     *
     * @author Ruta Zala <rzdevloper@gmail.com>
     * @since  26 April 2021
     *
     * @covers change-streams/Activity/pipelines/ActivitiesEventStorePipeline.getMongoClientConfigKeys
     */
    it('testing success scenario when correct config is returned', function () {
      const response = ActivitiesPipeline.getMongoClientConfigKeys();
      assert.deepEqual(response, [ACTIVITIES_DB_KEY], 'Expected config keys were not returned');
    });
  });

  describe('watch() test scenarios', function () {
    let changeStream = {
      on: function () {
      },
      pipe: function () {
        return this;
      }
    };
    let watchStream = {
      stream: function () {
        return changeStream;
      }
    };
    let dbObject = {
      collection: function () {
        return this;
      },
      watch: function () {
        return watchStream;
      }
    };
    let writerStream = {on: function () {}};
    let tokenManager = {
      getResumeTokenWriterStream: function () {
        return writerStream;
      },
      setResumeAfterWatchOptions: function () {
        return {};
      }
    };

    afterEach(function () {
      sinon.restore();
    });

    /**
     * Test success scenario.
     *
     * @author Ruta Zala <rzdevloper@gmail.com>
     * @since  26 April 2021
     *
     * @covers change-streams/Activity/pipelines/ActivityPipeline.watch
     */
    it('Assert the pipeline is configured as expected', async function () {
      let pipeSpy = sinon.spy(changeStream, 'pipe');
      const dbStub = sinon.stub(MongoClients, 'getClientDatabase');
      dbStub.resolves(dbObject);

      await ActivitiesPipeline.watch(logger.getLogger(logSpy), tokenManager);

      assert.equal(pipeSpy.callCount, 2, 'Expected 2 components to be attached to watch stream');

      // Assert that each step is attached in the correct sequence with the correct object
      let changeStreamDeltaTransformerCallArgs = pipeSpy.getCall(0).args;
      assert.instanceOf(changeStreamDeltaTransformerCallArgs[0], ChangeStreamDeltaTransformer);

      let resumeTokenWriterCallArgs = pipeSpy.getCall(1).args;
      assert.deepEqual(resumeTokenWriterCallArgs[0], tokenManager.getResumeTokenWriterStream());
    });
  });
});
