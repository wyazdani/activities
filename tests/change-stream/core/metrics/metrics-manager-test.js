'use strict';
const {MetricsManager} = require('../../../../change-streams/core/metrics/MetricsManager');
const sinon = require('sinon');
const config = require('config');
const TestUtils = require('../../../../tools/TestUtils');

describe('MetricsManager', function () {
  afterEach(() => {
    sinon.restore();
  });
  describe('received()', function () {
    it('Test when enabled', function () {
      const logSpy = sinon.spy();
      const logger = TestUtils.logger.getLogger(logSpy);
      const pipelineName = 'sample name';
      const appName = 'app name';
      const highWaterMark = 5;
      sinon.stub(config, 'get').returns(true);
      const metricsManager = new MetricsManager({
        logger,
        pipelineName,
        appName,
        highWaterMark
      });
      metricsManager.received();
      metricsManager._counter.should.equal(1);
    });

    it('Test when disabled', function () {
      const logSpy = sinon.spy();
      const logger = TestUtils.logger.getLogger(logSpy);
      const pipelineName = 'sample name';
      const appName = 'app name';
      const highWaterMark = 5;
      sinon.stub(config, 'get').returns(false);
      const metricsManager = new MetricsManager({
        logger,
        pipelineName,
        appName,
        highWaterMark
      });
      metricsManager._counter.should.equal(0);
    });
  });

  describe('processed()', function () {
    it('Test when enabled', function () {
      const logSpy = sinon.spy();
      const logger = TestUtils.logger.getLogger(logSpy);
      const memory = {sample: 'ok'};
      sinon.stub(process, 'memoryUsage').returns(memory);
      sinon.stub(config, 'get').returns(true);
      const pipelineName = 'sample name';
      const appName = 'app name';
      const highWaterMark = 5;
      const metricsManager = new MetricsManager({
        logger,
        pipelineName,
        appName,
        highWaterMark
      });
      metricsManager.processed();
      logSpy.should.have.been.calledWith('ChangeStream process metric', {
        pipeline_name: pipelineName,
        app_name: appName,
        counter: -1,
        processed_count: 1,
        memory,
        highWaterMark
      });
    });
    it('Test when disabled', function () {
      const logSpy = sinon.spy();
      const logger = TestUtils.logger.getLogger(logSpy);
      const memory = {sample: 'ok'};
      sinon.stub(process, 'memoryUsage').returns(memory);
      sinon.stub(config, 'get').returns(false);
      const pipelineName = 'sample name';
      const appName = 'app name';
      const highWaterMark = 5;
      const metricsManager = new MetricsManager({
        logger,
        pipelineName,
        appName,
        highWaterMark
      });
      metricsManager.processed();
      logSpy.should.not.have.been.called;
    });
  });
});
