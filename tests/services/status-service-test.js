'use strict';

const {expect, assert} = require('chai');
const sinon = require('sinon');
const StatusService = require('../../services/StatusService');

describe('StatusService test scenarios', function () {

  describe('getSystemStatus(): Gets the status of the messaging service', function () {

    /**
     * This will test the response from the status service.
     *
     * @author Johannes Gryffenberg <johannes.gryffenberg@a24group.com>
     * @since  7 July 2017
     *
     * @covers services/StatusService.getSystemStatus
     */
    it('200 response test', function (done) {
      let args = {};
      let statusService = new StatusService({});

      let nextSpy = sinon.spy();
      let resSetHeaderSpy = sinon.spy();

      let resEndSpy = sinon.spy(function (response) {
        assert.equal(isNaN(JSON.parse(response).up_time), false, 'Up time was expected to be a number');
        expect(nextSpy.callCount).to.equal(0);
        expect(resEndSpy.callCount).to.equal(1);
        done();
      });
      let res = {statusCode: '', setHeader: resSetHeaderSpy, end: resEndSpy};
      statusService.getSystemStatus(args, res, nextSpy);
    });
  });
// NEW GENERATOR FUNCTIONS LOCATION
});