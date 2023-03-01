'use strict';

const sinon = require('sinon');
const chai = require('chai');
const {PassThrough, Writable} = require('stream');
const assert = chai.assert;
const StreamEventHandlers = require('../../../change-streams/core/StreamEventHandlers');
const {logger} = require('../../../tools/TestUtils');
const ResumeTokenWriter = require('../../../change-streams/core/streams/ResumeTokenWriter');
const EventStoreResumeTokenWriter = require('../../../change-streams/core/streams/EventStoreResumeTokenWriter');

describe('StreamEventHandlers test scenarios', function () {
  const ERROR_EXIT_CODE = 1;
  let logSpy;

  beforeEach(() => {
    logSpy = sinon.spy();
  });
  afterEach(() => {
    sinon.restore();
    logSpy = null;
  });

  describe('attachEventHandlers() test scenarios', function () {

    /**
     * Test success scenario for readable stream
     *
     * @author Deon De Wet <deon.dewet@gmail.com>
     * @since  15 Sept 2022
     *
     * @covers change-streams/core/StreamEventHandlers.attachEventHandlers
     */
    it('testing success scenario for readable stream', async function () {
      const options = {
        objectMode: true,
        highWaterMark: 2,
        version: '3.6.3'
      };
      const stream = new PassThrough(options);

      const response = await StreamEventHandlers.attachEventHandlers(logger.getLogger(logSpy), stream);
      const eventKeys = Object.keys(response._events);
      const expectedEvents = ['prefinish', 'end', 'close', 'error'];
      response.resume();
      response.end();
      response.destroy();
      assert.equal(response._eventsCount, 4, 'Expected number of events were not set');
      assert.deepEqual(eventKeys, expectedEvents, 'Expected events listeners were not set');
      response.on('close', () => {
        assert.equal(logSpy.callCount, 2, 'Expected logger to be called twice');
      });
    });

    /**
     * Test success scenario for writable stream
     *
     * @author Deon De Wet <deon.dewet@gmail.com>
     * @since  15 Sept 2022
     *
     * @covers change-streams/core/StreamEventHandlers.attachEventHandlers
     */
    it('testing success scenario for writable stream', async function () {
      const options = {
        objectMode: true,
        highWaterMark: 2,
        version: '3.6.3'
      };
      const stream = new Writable(options);

      const response = await StreamEventHandlers.attachEventHandlers(logger.getLogger(logSpy), stream);
      const eventKeys = Object.keys(response._events);
      const expectedEvents = ['close', 'error'];
      response.destroy();
      assert.equal(response._eventsCount, 2, 'Expected number of events were not set');
      assert.deepEqual(eventKeys, expectedEvents, 'Expected events listeners were not set');
      response.on('close', () => {
        assert.equal(logSpy.callCount, 1, 'Expected logger to be called twice');
      });
    });

    /**
     * Test Error scenario
     *
     * @author Deon De Wet <deon.dewet@gmail.com>
     * @since  15 Sept 2022
     *
     * @covers change-streams/core/StreamEventHandlers.attachEventHandlers
     */
    it('testing Error scenario', async function () {
      const options = {
        objectMode: true,
        highWaterMark: 2,
        version: '3.6.3'
      };
      const stream = new PassThrough(options);
      const error = new Error('Something went wrong!');

      sinon.stub(process, 'exit').callsFake((code) => {
        assert.isAtLeast(logSpy.callCount, 1, 'Expected logger have to be called at least once');
        assert.equal(code, ERROR_EXIT_CODE, 'Expected exit code does not match');
      });

      const response = await StreamEventHandlers.attachEventHandlers(logger.getLogger(logSpy), stream);

      response.destroy([error]);

      const eventKeys = Object.keys(response._events);
      const expectedEvents = ['prefinish', 'end', 'close', 'error'];
      assert.equal(response._eventsCount, 4, 'Expected number of events were not set');
      assert.deepEqual(eventKeys, expectedEvents, 'Expected events listeners were not set');
    });
  });

  describe('attachEventHandlers() test scenarios for ResumeTokenWriter', function () {
    it('success scenario', async function () {
      const options = {
        objectMode: true,
        highWaterMark: 2,
        version: '3.6.3'
      };
      const stream = new ResumeTokenWriter(options);

      const response = await StreamEventHandlers.attachEventHandlers(logger.getLogger(logSpy), stream);
      const eventKeys = Object.keys(response._events);
      const expectedEvents = ['finish', 'close', 'error'];
      response.destroy();
      assert.equal(response._eventsCount, 3, 'Expected number of events were not set');
      assert.deepEqual(eventKeys, expectedEvents, 'Expected events listeners were not set');
      response.on('close', () => {
        assert.equal(logSpy.callCount, 1, 'Expected logger to be called twice');
      });
    });

    it('success scenario for input stream end', async function (done) {
      const options = {
        objectMode: true
      };
      const stream = new ResumeTokenWriter(options);
      const inputStream = new PassThrough(options);
      inputStream.pipe(stream);
      const exitStub = sinon.stub(process, 'exit');
      const response = await StreamEventHandlers.attachEventHandlers(logger.getLogger(logSpy), stream);
      // lets end the stream
      inputStream.end();

      const eventKeys = Object.keys(response._events);
      const expectedEvents = ['unpipe', 'error', 'close', 'finish'];
      assert.equal(response._eventsCount, 4, 'Expected number of events were not set');
      assert.deepEqual(eventKeys, expectedEvents, 'Expected events listeners were not set');
      response.on('close', () => {
        assert.fail('close event not meant to be triggered');
      });
      response.on('finish', () => {
        assert.equal(logSpy.callCount, 1, 'Expected logger to be called once');
        assert.isTrue(exitStub.calledOnce);
        exitStub.restore();
        done();
      });
    });
  });

  describe('attachEventHandlers() test scenarios for EventStoreResumeTokenWriter', function () {
    it('success scenario', async function () {
      const options = {
        objectMode: true,
        highWaterMark: 2,
        version: '3.6.3'
      };
      const stream = new EventStoreResumeTokenWriter(options);

      const response = await StreamEventHandlers.attachEventHandlers(logger.getLogger(logSpy), stream);
      const eventKeys = Object.keys(response._events);
      const expectedEvents = ['finish', 'close', 'error'];
      response.destroy();
      assert.equal(response._eventsCount, 3, 'Expected number of events were not set');
      assert.deepEqual(eventKeys, expectedEvents, 'Expected events listeners were not set');
      response.on('close', () => {
        assert.equal(logSpy.callCount, 1, 'Expected logger to be called twice');
      });
    });

    it('success scenario for input stream end', async function (done) {
      const options = {
        objectMode: true
      };
      const stream = new EventStoreResumeTokenWriter(options);
      const inputStream = new PassThrough(options);
      inputStream.pipe(stream);
      const exitStub = sinon.stub(process, 'exit');
      const response = await StreamEventHandlers.attachEventHandlers(logger.getLogger(logSpy), stream);
      // lets end the stream
      inputStream.end();

      const eventKeys = Object.keys(response._events);
      const expectedEvents = ['unpipe', 'error', 'close', 'finish'];
      assert.equal(response._eventsCount, 4, 'Expected number of events were not set');
      assert.deepEqual(eventKeys, expectedEvents, 'Expected events listeners were not set');
      response.on('close', () => {
        assert.fail('close event not meant to be triggered');
      });
      response.on('finish', () => {
        assert.equal(logSpy.callCount, 1, 'Expected logger to be called once');
        assert.isTrue(exitStub.calledOnce);
        exitStub.restore();
        done();
      });
    });
  });
});
