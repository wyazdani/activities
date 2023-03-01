'use strict';

const {expect, assert} = require('chai');
const sinon = require('sinon');
const {Activity} = require('../../models');
const ActivityService = require ('../../services/ActivityService');
const {ObjectId} = require('mongoose').Types;
const {ValidationError, RuntimeError, ResourceNotFoundError} = require('a24-node-error-utils');
const {RuntimeErrorAssert} = require('a24nodetestutils');
const moment = require('moment');

describe('ActivityService test scenarios', function () {
  let logger = {
    getLogger: function logger(logSpy, requestId) {
      return {
        'info': logSpy,
        'error': logSpy,
        'logAction': logSpy,
        'requestId': requestId
      };
    }
  };

  describe('createActivity(): Creates a new activity', function () {

    afterEach(() => {
      sinon.restore();
    });

    //data that is consistent between tests
    let id = '5b84dc480c54e52c62efbd37';
    let activityType = 'Some Activity Type';
    let description = 'Some Activity Description';
    let comment = 'Some activity comment';
    let linkedEntities = [
      {
        entity_id: new ObjectId().toString(),
        entity: 'string',
        entity_type: 'SomeType'
      }
    ];
    let subject= {
      entity_id: new ObjectId().toString(),
      entity_type: 'somesubjectType',
      name: 'someSubjectName'
    };
    let createdByEntity = {
      entity_id: new ObjectId().toString(),
      entity_type: 'SomeType',
      name: 'SomeName'
    };
    let executingEntity = {
      entity_id: new ObjectId().toString(),
      entity_type: 'SomeType',
      name: 'SomeName'
    };

    /**
     * Test that is used for a success clause
     *  Test that the model is saved to the database correctly
     *  Test that the message producer sends a successful message
     *  Make sure that the response code is 200
     *
     * @author Tyler Dean Smith <tyler.smith@a24group.com>
     * @since  12 July 2017
     *
     * @covers services/ActivityService.createActivity
     * @covers services/ActivityService._validateActivityObject
     * @covers services/ActivityService._validateEntity
     */
    it('201 response test', function (done) {
      let logSpy = sinon.spy();
      //Instantiate a date in the past
      let activityDate = moment().format();
      let payload = {
        _id: id,
        activity_type: activityType,
        description: description,
        comment: comment,
        activity_date: activityDate,
        linked_entities: linkedEntities,
        subject: subject,
        created_by_entity: createdByEntity,
        executing_entity: executingEntity

      };

      let savedResponse = new Activity(payload);

      let nextSpy = sinon.spy((err) => {
        expect(err, 'Did not expect and error').to.be.undefined;
        expect(nextSpy.callCount).to.equal(1);
        done();
      });

      let args = {
        activity: {
          value: {
            _id: id,
            activity_type: activityType,
            description: description,
            comment: comment,
            activity_date: activityDate,
            linked_entities: linkedEntities,
            subject: subject,
            created_by_entity: createdByEntity,
            executing_entity: executingEntity
          }
        }
      };

      let resEndSpy = sinon.spy(function (type, statusCode, response) {
        assert.equal(response._id, payload._id, 'Check Expected Output');
        expect(nextSpy.callCount).to.equal(0);
        expect(resEndSpy.callCount).to.equal(1);
        stubSaveActivity.restore();
      });

      //Successfull call back
      let stubSaveActivity = sinon.stub(Activity.prototype, 'save').callsFake(function (callback) {
        callback(null, savedResponse);
      });
      let res = {setResponse: resEndSpy};
      let activityService = new ActivityService(logger.getLogger(logSpy, 'createANewActivity'));
      activityService.createActivity(args, res, nextSpy);
    });

    /**
     * Testing success scenario when entity id is missing
     *
     * @author Abhay Dubey <abhayd1984@gmail.com>
     * @since  18 September 2018
     *
     * @covers services/ActivityService.createActivity
     * @covers services/ActivityService._validateActivityObject
     * @covers services/ActivityService._validateEntity
     */
    it('201 response test when entity id is missing', function (done) {
      let logSpy = sinon.spy();
      //Instantiate a date in the past
      let activityDate = moment().format();
      let payload = {
        _id: id,
        activity_type: activityType,
        description: description,
        comment: comment,
        activity_date: activityDate,
        linked_entities: linkedEntities,
        subject: {
          entity_type: 'somesubjectType',
          name: 'someSubjectName'
        },
        created_by_entity: createdByEntity,
        executing_entity: executingEntity

      };

      let savedResponse = new Activity(payload);

      let nextSpy = sinon.spy((err) => {
        expect(err, 'Did not expect and error').to.be.undefined;
        expect(nextSpy.callCount).to.equal(1);
        done();
      });

      let args = {
        activity: {
          value: {
            _id: id,
            activity_type: activityType,
            description: description,
            comment: comment,
            activity_date: activityDate,
            linked_entities: linkedEntities,
            subject: {
              entity_type: 'somesubjectType',
              name: 'someSubjectName'
            },
            created_by_entity: createdByEntity,
            executing_entity: executingEntity
          }
        }
      };

      let resEndSpy = sinon.spy(function (type, statusCode, response) {
        assert.equal(response._id, payload._id, 'Check Expected Output');
        expect(nextSpy.callCount).to.equal(0);
        expect(resEndSpy.callCount).to.equal(1);
        stubSaveActivity.restore();
      });

      //Successfull call back
      let stubSaveActivity = sinon.stub(Activity.prototype, 'save').callsFake(function (callback) {
        callback(null, savedResponse);
      });
      let res = {setResponse: resEndSpy};
      let activityService = new ActivityService(logger.getLogger(logSpy, 'createANewActivity'));
      activityService.createActivity(args, res, nextSpy);
    });

    /**
     * Testing success scenario when activity time is within 3 minutes in the future
     *
     * @author Hadi Shayesteh <hadi.shayesteh@a24group.com>
     * @since  21 Dec 2018
     *
     * @covers services/ActivityService.createActivity
     * @covers services/ActivityService._validateActivityObject
     * @covers services/ActivityService._validateEntity
     */
    it('201 response test when  activity time is within 3 minutes in the future', function (done) {
      let logSpy = sinon.spy();
      //Instantiate a date in with 2 minutes extra
      let activityDate = moment().add(2, 'm');
      let payload = {
        _id: id,
        activity_type: activityType,
        description: description,
        comment: comment,
        activity_date: activityDate,
        linked_entities: linkedEntities,
        subject: {
          entity_type: 'somesubjectType',
          name: 'someSubjectName'
        },
        created_by_entity: createdByEntity,
        executing_entity: executingEntity

      };

      let savedResponse = new Activity(payload);

      let nextSpy = sinon.spy((err) => {
        expect(err, 'Did not expect and error').to.be.undefined;
        expect(nextSpy.callCount).to.equal(1);
        done();
      });

      let args = {
        activity: {
          value: {
            _id: id,
            activity_type: activityType,
            description: description,
            comment: comment,
            activity_date: activityDate,
            linked_entities: linkedEntities,
            subject: {
              entity_type: 'somesubjectType',
              name: 'someSubjectName'
            },
            created_by_entity: createdByEntity,
            executing_entity: executingEntity
          }
        }
      };

      let resEndSpy = sinon.spy(function (type, statusCode, response) {
        assert.equal(response._id, payload._id, 'Check Expected Output');
        expect(nextSpy.callCount).to.equal(0);
        expect(resEndSpy.callCount).to.equal(1);
        stubSaveActivity.restore();
      });

      //Successfull call back
      let stubSaveActivity = sinon.stub(Activity.prototype, 'save').callsFake(function (callback) {
        callback(null, savedResponse);
      });
      let res = {setResponse: resEndSpy};
      let activityService = new ActivityService(logger.getLogger(logSpy, 'createANewActivity'));
      activityService.createActivity(args, res, nextSpy);
    });

    /**
     * Testing success scenario when name is missing
     *
     * @author Abhay Dubey <abhayd1984@gmail.com>
     * @since  18 September 2018
     *
     * @covers services/ActivityService.createActivity
     * @covers services/ActivityService._validateActivityObject
     * @covers services/ActivityService._validateEntity
     */
    it('201 response test when name is missing', function (done) {
      let logSpy = sinon.spy();
      //Instantiate a date in the past
      let activityDate = moment().format();
      let payload = {
        _id: id,
        activity_type: activityType,
        description: description,
        comment: comment,
        activity_date: activityDate,
        linked_entities: linkedEntities,
        subject: {
          entity_id: new ObjectId().toString(),
          entity_type: 'somesubjectType'
        },
        created_by_entity: createdByEntity,
        executing_entity: executingEntity

      };

      let savedResponse = new Activity(payload);

      let nextSpy = sinon.spy((err) => {
        expect(err, 'Did not expect and error').to.be.undefined;
        expect(nextSpy.callCount).to.equal(1);
        done();
      });

      let args = {
        activity: {
          value: {
            _id: id,
            activity_type: activityType,
            description: description,
            comment: comment,
            activity_date: activityDate,
            linked_entities: linkedEntities,
            subject: {
              entity_id: new ObjectId().toString(),
              entity_type: 'somesubjectType'
            },
            created_by_entity: createdByEntity,
            executing_entity: executingEntity
          }
        }
      };

      let resEndSpy = sinon.spy(function (type, statusCode, response) {
        assert.equal(response._id, payload._id, 'Check Expected Output');
        expect(nextSpy.callCount).to.equal(0);
        expect(resEndSpy.callCount).to.equal(1);
        stubSaveActivity.restore();
      });

      //Successfull call back
      let stubSaveActivity = sinon.stub(Activity.prototype, 'save').callsFake(function (callback) {
        callback(null, savedResponse);
      });
      let res = {setResponse: resEndSpy};
      let activityService = new ActivityService(logger.getLogger(logSpy, 'createANewActivity'));
      activityService.createActivity(args, res, nextSpy);
    });

    /**
     * Test to cause a validation error when using an activity date in the future.
     *
     * @author Tyler Dean Smith <tyler.smith@a24group.com>
     * @since  12 July 2017
     *
     * @covers services/ActivityService.createActivity
     */
    it('400 response test', function (done) {
      let logSpy = sinon.spy();
      let res;

      //instantiate a date in the future.
      let activityDate = moment().add(10, 'years').format();

      let args = {
        activity: {
          value: {
            _id: id,
            activity_type: activityType,
            description: description,
            comment: comment,
            activity_date: activityDate,
            linked_entities: linkedEntities,
            subject: subject,
            created_by_entity: createdByEntity,
            executing_entity: executingEntity
          }
        }
      };

      var validationError = new ValidationError(
        'Invalid activity date, activity date can not be in the future.',
        [
          {
            code: 'INVALID_ACTIVITY_DATE',
            message: 'Invalid activity date, activity date can not be in the future.',
            path: ['activity_date']
          }
        ]
      );
      let resSetHeaderSpy = sinon.spy();
      let nextSpy = sinon.spy(function (content) {
        assert.deepEqual(
          content,
          validationError,
          'Runtime error, activity date is in the future'
        );
        expect(validationError.status).to.equal(400);
        done();
      });
      res = {statusCode: '400', setHeader: resSetHeaderSpy};
      let activityService = new ActivityService(logger.getLogger(logSpy, 'createANewActivity'));
      activityService.createActivity(args, res, nextSpy);
    });

    /**
     * Test to cause a validation error when entity id and name both are missing
     *
     * @author Abhay Dubey <abhayd1984@gmail.com>
     * @since  18 September 2018
     *
     * @covers services/ActivityService.createActivity
     * @covers services/ActivityService._validateActivityObject
     * @covers services/ActivityService._validateEntity
     */
    it('400 response test when entity id and name both are missing', function (done) {
      let logSpy = sinon.spy();
      let res;

      let activityDate = moment().format();

      let args = {
        activity: {
          value: {
            _id: id,
            activity_type: activityType,
            description: description,
            comment: comment,
            activity_date: activityDate,
            linked_entities: linkedEntities,
            subject: subject,
            created_by_entity: createdByEntity,
            executing_entity: {
              entity_type: 'SomeType'
            }
          }
        }
      };

      var validationError = new ValidationError(
        'Missing properties in payload entity object',
        [
          {
            code: 'MISSING_PROPERTY',
            message: 'Expected entity id or entity name to be set',
            path: ['executing_entity']
          }
        ]
      );
      let resSetHeaderSpy = sinon.spy();
      let nextSpy = sinon.spy(function (content) {
        assert.deepEqual(
          content,
          validationError,
          'Runtime error, activity date is in the future'
        );
        expect(validationError.status).to.equal(400);
        done();
      });
      res = {statusCode: '400', setHeader: resSetHeaderSpy};
      let activityService = new ActivityService(logger.getLogger(logSpy, 'createANewActivity'));
      activityService.createActivity(args, res, nextSpy);
    });

    /**
     * Test that an error is thrown if the save to mongo fails
     *
     * @author Tyler Dean Smith <tyler.smith@a24group.com>
     * @since  12 July 2017
     *
     * @covers services/ActivityService.createActivity
     * @covers services/ActivityService._validateActivityObject
     * @covers services/ActivityService._validateEntity
     */
    it('500 response test', function (done) {
      let logSpy = sinon.spy();
      let res;
      let activityDate = moment().format();
      let nextSpy;

      let errorObject = {error: 'someRuntimeError'};
      let runTimeError = new RuntimeError(
        'An error occurred when saving the activity.',
        errorObject
      );

      let args = {
        activity: {
          value: {
            _id: id,
            activity_type: activityType,
            description: description,
            comment: comment,
            activity_date: activityDate,
            linked_entities: linkedEntities,
            subject: subject,
            created_by_entity: createdByEntity,
            executing_entity: executingEntity
          }
        }
      };

      let stubSave = sinon.stub(Activity.prototype, 'save').callsFake(function (callback) {
        setTimeout(
          function () {
            callback(errorObject, null);
          },
          0
        );
      });

      nextSpy = sinon.spy(function (content) {
        RuntimeErrorAssert.deepEqual(
          content,
          runTimeError,
          'Save runtime Error, failure to assert runtime error.'
        );
        expect(runTimeError.status).to.equal(500);
        done();
        stubSave.restore();
      });

      let resSetHeaderSpy = sinon.spy();
      let resEndSpy = sinon.spy();
      res = {statusCode: '', setHeader: resSetHeaderSpy, end: resEndSpy};

      let activityService = new ActivityService(logger.getLogger(logSpy, 'TheCreateRequest'));
      activityService.createActivity(args, res, nextSpy);
    });
  });

  describe('getActivities(): Retrieves a list of activities', function () {

    afterEach(() => {
      sinon.restore();
    });

    /**
     * Test for 200 response with default request
     *
     * @author Tyler Dean Smith <tyler.smith@a24group.com>
     * @since  13 July 2017
     *
     * @covers services/ActivityService.getActivities
     * @covers services/ActivityService._getActivityCount
     * @covers services/ActivityService._getActivityList
     * @covers services/ActivityService._getRelLinkOptions
     * @covers ServiceHelper.getRelLink
     * @covers QueryHelper.getQueryAndSortingString
     * @covers QueryHelper.getQuery
     * @covers QueryHelper.getItemsPerPage
     * @covers QueryHelper.getPage
     * @covers QueryHelper.getSkipValue
     * @covers QueryHelper.getSortParams
     */
    it('204 response no data to show', function (done) {
      let expectedHeaders = [
        {'X-Result-Count': 1},
        {'Link': '<http://localhost:3100/v3/activity?name=website&page=1&items_per_page=1>; rel="first"'
          + ',<http://localhost:3100/v3/activity?name=website&page=1&items_per_page=1>; rel="last"'
          + ',<http://localhost:3100/v3/activity?name=website&page=4&items_per_page=1>; rel="prev"'
        }
      ];
      let actualHeaders = [];
      let args = {
        page: {
          schema: {
            name: 'page',
            in: 'query'
          },
          value: 5
        },
        items_per_page: {
          schema: {
            name: 'items_per_page',
            in: 'query'
          },
          value: 1
        },
        name: {
          schema: {
            name: 'name',
            in: 'query'
          },
          value: 'website'
        }
      };

      let ActivityCount = sinon.stub(Activity, 'countDocuments').callsFake(function (localQuery, callback) {
        assert.deepEqual(
          localQuery,
          {name: args.name.value},
          'Expected the query to only contain the name condition'
        );
        setTimeout(
          function () {
            callback(null, 1);
          },
          0
        );
      });

      let arrResultsObject = {
        skip: function skip(skip) {
          assert.equal(
            skip,
            4,
            'Expected 4 item to be skipped'
          );
          return arrResultsObject;
        },
        limit: function limit(limit) {
          assert.equal(
            limit,
            1,
            'Expected the limit to match the limit passed in via request args'
          );
          return arrResultsObject;
        },
        sort: function sort() {
          return arrResultsObject;
        },
        lean: function lean() {
          return arrResultsObject;
        },
        exec: function exec(callback) {
          setTimeout(
            function () {
              callback(null, []);
            },
            0
          );
        }
      };
      let ActivityFind = sinon.stub(Activity, 'find').callsFake(function (query) {
        assert.deepEqual(
          query,
          {name: args.name.value},
          'Expected the query to only contain the name condition'
        );
        return arrResultsObject;
      });

      let logSpy = sinon.spy(function (message, logObject) {
        expect(message).to.equal('The activities get list call has been completed successfully.');
        expect(logObject).to.deep.equal({'status_code': 204});
      });
      let responseHeader = sinon.spy(
        function (header, value) {
          let obj = {};
          obj[header] = value;
          actualHeaders.push(obj);
        }
      );

      let responseEnd = sinon.spy(
        function (type, statusCode, content) {
          assert.deepEqual(
            content,
            undefined
          );
          assert.deepEqual(
            actualHeaders,
            expectedHeaders,
            'The incorrect headers where set for the response'
          );
          assert.equal(
            statusCode,
            204,
            'The incorrect status code is set when there is no content'
          );
          expect(logSpy.callCount).to.equal(1);
          ActivityCount.restore();
          ActivityFind.restore();
          // done();
        }
      );
      let res = {setHeader: responseHeader, setResponse: responseEnd};

      let next = sinon.spy((err) => {
        expect(err, 'Did not expect an error').to.be.undefined;
        expect(next.callCount).to.equal(1);
        ActivityCount.restore();
        ActivityFind.restore();
        done();
      });

      let activityService = new ActivityService(logger.getLogger(logSpy));
      activityService.getActivities(args, res, next);
    });

    /**
     * Test that a 200 response code is returned with data
     *
     * @author Tyler Dean Smith <tyler.smith@a24group.com>
     * @since  13 July 2017
     *
     * @covers services/ActivityService.getActivityService
     * @covers services/ActivityService._getActivityServiceCount
     * @covers services/ActivityService._getActivityServiceList
     * @covers services/ActivityService._getRelLinkOptions
     * @covers ServiceHelper.getRelLink
     * @covers QueryHelper.getQueryAndSortingString
     * @covers QueryHelper.getQuery
     * @covers QueryHelper.getItemsPerPage
     * @covers QueryHelper.getPage
     * @covers QueryHelper.getSkipValue
     * @covers QueryHelper.getSortParams
     */
    it('200 response test, with sorting ', function (done) {
      let expectedHeaders = [
        {'X-Result-Count': 1},
        {'Link': '<http://localhost:3100/v3/activity?sortBy=name&page=1&items_per_page=2>; rel="first"'
          + ',<http://localhost:3100/v3/activity?sortBy=name&page=1&items_per_page=2>; rel="last"'
        }
      ];
      let actualHeaders = [];
      let getListResult = [
        new Activity({name: 'another_place'}),
        new Activity({name: 'website'})
      ];
      let args = {
        page: {
          schema: {
            name: 'page',
            in: 'query'
          },
          value: 1
        },
        items_per_page: {
          schema: {
            name: 'items_per_page',
            in: 'query'
          },
          value: 2
        },
        sortBy: {
          schema: {
            name: 'sortBy',
            in: 'query'
          },
          value: 'name'
        }
      };

      let activityCount = sinon.stub(Activity, 'countDocuments').callsFake(function (localQuery, callback) {
        assert.deepEqual(
          localQuery,
          {},
          'Expected the query to be empty'
        );
        setTimeout(
          function () {
            callback(null, 1);
          },
          0
        );
      });

      let arrResultsObject = {
        skip: function skip(skip) {
          assert.equal(
            skip,
            0,
            'Expected 0 item to be skipped'
          );
          return arrResultsObject;
        },
        limit: function limit(limit) {
          assert.equal(
            limit,
            2,
            'Expected the limit to match the limit passed in via request args'
          );
          return arrResultsObject;
        },
        sort: function sort() {
          return arrResultsObject;
        },
        exec: function exec(callback) {
          setTimeout(
            function () {
              callback(null, getListResult);
            },
            0
          );
        }
      };
      let activityFind = sinon.stub(Activity, 'find').callsFake(function (query) {
        assert.deepEqual(
          query,
          {},
          'Expected the query to be empty'
        );
        return arrResultsObject;
      });

      let logSpy = sinon.spy(function (message, logObject) {
        expect(message).to.equal('The activities get list call has been completed successfully.');
        expect(logObject).to.deep.equal(
          {'status_code': 200, 'response': getListResult.map((item) => item.toJSON({minimize: false}))}
        );
      });
      let responseHeader = sinon.spy(
        function (header, value) {
          let obj = {};
          obj[header] = value;
          actualHeaders.push(obj);
        }
      );

      let responseEnd = sinon.spy(
        function (type, statusCode, content) {
          assert.deepEqual(
            content,
            getListResult
          );
          assert.deepEqual(
            actualHeaders,
            expectedHeaders,
            'The incorrect headers where set for the response'
          );
          assert.equal(
            statusCode,
            200,
            'The incorrect status code is set when there is no content'
          );
          expect(logSpy.callCount).to.equal(1);
          activityCount.restore();
          activityFind.restore();
        }
      );
      let res = {setHeader: responseHeader, setResponse: responseEnd};

      let nextSpy = sinon.spy((err) => {
        expect(err, 'Did not expect and error').to.be.undefined;
        expect(nextSpy.callCount).to.equal(1);
        done();
      });

      let activityService = new ActivityService(logger.getLogger(logSpy));
      activityService.getActivities(args, res, nextSpy);

    });

    /**
     * Test that an error is thrown if the Activity count failed
     *
     * @author Tyler Dean Smith <tyler.smith@a24group.com>
     * @since  13 July 2017
     *
     * @covers services/ActivityService.getActivity
     * @covers services/ActivityService._getActivityCount
     * @covers services/ActivityService._getActivityList
     */
    it('500 error scenario when the Activity.count cannot complete', function (done) {

      let args = {
        page: {
          schema: {
            name: 'page',
            in: 'query'
          },
          value: 2
        },
        items_per_page: {
          schema: {
            name: 'items_per_page',
            in: 'query'
          },
          value: 1
        }
      };
      let error = {message: 'Socket time out'};
      let runTimeError = new RuntimeError(
        'An error occurred while retrieving activity list',
        error
      );
      let activityCount = sinon.stub(Activity, 'countDocuments').callsFake(function (localQuery, callback) {
        assert.deepEqual(
          localQuery,
          {},
          'Expected the query to be empty, as pagination should not be taken into account for the overall count'
        );
        // Wrap the callback in a setTimeout so that the other async.parallel tasks can execute
        setTimeout(
          function () {
            callback(null, 2);
          },
          0
        );
      });

      let arrResultsObject = {
        skip: function skip(skip) {
          assert.equal(
            skip,
            1,
            'Expected 1 item to be skipped'
          );
          return arrResultsObject;
        },
        limit: function limit(limit) {
          assert.equal(
            limit,
            1,
            'Expected the limit to match the limit passed in via request args'
          );
          return arrResultsObject;
        },
        sort: function sort() {
          return arrResultsObject;
        },
        exec: function exec(callback) {
          setTimeout(
            function () {
              callback(error, null);
            },
            0
          );
        }
      };
      let activityFind = sinon.stub(Activity, 'find').callsFake(function (query) {
        assert.deepEqual(
          query,
          {},
          'Expected the query to be empty as there is no query'
        );
        return arrResultsObject;
      });

      let logSpy = sinon.spy();
      let res = sinon.spy();
      let next = sinon.spy(function (localError) {
        RuntimeErrorAssert.deepEqual(
          localError,
          runTimeError,
          'Expected the socket error to be passed to callback'
        );
        done();
      });

      let activityService = new ActivityService(logger.getLogger(logSpy));
      activityService.getActivities(args, res, next);
      activityCount.restore();
      activityFind.restore();
    });

    /**
     * Test that an error is thrown if the Activity find failed
     *
     * @author Tyler Dean Smith <tyler.smith@a24group.com>
     * @since  13 July 2017
     *
     * @covers services/ActivityService.getActivity
     * @covers services/ActivityService._getActivityCount
     * @covers services/ActivityService._getActivityList
     */
    it('500 error scenario when the Activity.find cannot complete', function (done) {
      let args = {
        page: {
          schema: {
            name: 'page',
            in: 'query'
          },
          value: 2
        },
        items_per_page: {
          schema: {
            name: 'items_per_page',
            in: 'query'
          },
          value: 1
        }
      };
      let error = {message: 'Socket time out'};
      let runTimeError = new RuntimeError(
        'An error occurred while retrieving activity list',
        error
      );
      let activityCount = sinon.stub(Activity, 'countDocuments').callsFake(function (localQuery, callback) {
        assert.deepEqual(
          localQuery,
          {},
          'Expected the query to be empty, as pagination should not be taken into account for the overall count'
        );
        // Wrap the callback in a setTimeout so that the other async.parallel tasks can execute
        setTimeout(
          function () {
            callback(error, 2);
          },
          0
        );
      });

      let arrResultsObject = {
        skip: function skip(skip) {
          assert.equal(
            skip,
            1,
            'Expected 1 item to be skipped'
          );
          return arrResultsObject;
        },
        limit: function limit(limit) {
          assert.equal(
            limit,
            1,
            'Expected the limit to match the limit passed in via request args'
          );
          return arrResultsObject;
        },
        sort: function sort() {
          return arrResultsObject;
        },
        exec: function exec(callback) {
          setTimeout(
            function () {
              callback(error, null);
            },
            0
          );
        }
      };
      let activityFind = sinon.stub(Activity, 'find').callsFake(function (query) {
        assert.deepEqual(
          query,
          {},
          'Expected the query to be empty as there is no query'
        );
        return arrResultsObject;
      });

      let logSpy = sinon.spy();
      let res = sinon.spy();
      let next = sinon.spy(function (localError) {
        RuntimeErrorAssert.deepEqual(
          localError,
          runTimeError,
          'Expected the socket error to be passed to callback'
        );

        done();

      });

      let activityService = new ActivityService(logger.getLogger(logSpy));
      activityService.getActivities(args, res, next);
      activityCount.restore();
      activityFind.restore();
    });

    /**
     * Test that a 200 response code is returned with data
     *
     * @author Naresh Tapatia <naresh.tap@gmail.com>
     * @since  10 January 2018
     *
     * @covers services/ActivityService.getActivityService
     * @covers services/ActivityService._getActivityServiceCount
     * @covers services/ActivityService._getActivityServiceList
     * @covers services/ActivityService._getRelLinkOptions
     * @covers ServiceHelper.getRelLink
     * @covers QueryHelper.getQueryAndSortingString
     * @covers QueryHelper.getQuery
     * @covers QueryHelper.getItemsPerPage
     * @covers QueryHelper.getPage
     * @covers QueryHelper.getSkipValue
     * @covers QueryHelper.getSortParams
     */
    it('200 response test, with sorting on embedded objects ', function (done) {
      let sortByHeaderParam = 'subject_entity_id,subject_entity_type,subject_name,executing_entity_id,' +
        'executing_entity_type,executing_entity_name,created_by_entity_id,' +
        'created_by_entity_type,-created_by_entity_name';

      let expectedHeaders = [
        {'X-Result-Count': 1},
        {
          'Link': '<http://localhost:3100/v3/activity?sortBy='+ sortByHeaderParam +'&page=1&items_per_page=2>; ' +
          'rel="first",<http://localhost:3100/v3/activity?sortBy='+ sortByHeaderParam +'&page=1&items_per_page=2>; ' +
          'rel="last"'
        }
      ];
      let actualHeaders = [];
      let getListResult = [
        new Activity({name: 'another_place'}),
        new Activity({name: 'website'})
      ];

      let sortParameter = ['subject_entity_id', 'subject_entity_type', 'subject_name', 'executing_entity_id',
        'executing_entity_type', 'executing_entity_name', 'created_by_entity_id', 'created_by_entity_type',
        '-created_by_entity_name'];

      let expectedSortParam = {
        'subject.entity_id': 1,
        'subject.entity_type': 1,
        'subject.name': 1,
        'executing_entity.entity_id': 1,
        'executing_entity.entity_type': 1,
        'executing_entity.name': 1,
        'created_by_entity.entity_id': 1,
        'created_by_entity.entity_type': 1,
        'created_by_entity.name': -1
      };

      let args = {
        page: {
          schema: {
            name: 'page',
            in: 'query'
          },
          value: 1
        },
        items_per_page: {
          schema: {
            name: 'items_per_page',
            in: 'query'
          },
          value: 2
        },
        sortBy: {
          schema: {
            name: 'sortBy',
            in: 'query'
          },
          value: sortParameter
        }
      };

      let activityCount = sinon.stub(Activity, 'countDocuments').callsFake(function (localQuery, callback) {
        assert.deepEqual(
          localQuery,
          {},
          'Expected the query to be empty'
        );
        setTimeout(
          function () {
            callback(null, 1);
          },
          0
        );
      });

      let arrResultsObject = {
        skip: function skip(skip) {
          assert.equal(
            skip,
            0,
            'Expected 0 item to be skipped'
          );
          return arrResultsObject;
        },
        limit: function limit(limit) {
          assert.equal(
            limit,
            2,
            'Expected the limit to match the limit passed in via request args'
          );
          return arrResultsObject;
        },
        sort: function sort(sortParams) {
          assert.deepEqual(
            sortParams,
            expectedSortParam,
            'Expected the Sorting Param to match the sort param passed in via request args'
          );
          return arrResultsObject;
        },
        exec: function exec(callback) {
          setTimeout(
            function () {
              callback(null, getListResult);
            },
            0
          );
        }
      };
      let activityFind = sinon.stub(Activity, 'find').callsFake(function (query) {
        assert.deepEqual(
          query,
          {},
          'Expected the query to be empty'
        );
        return arrResultsObject;
      });

      let logSpy = sinon.spy(function (message, logObject) {
        expect(message).to.equal('The activities get list call has been completed successfully.');
        expect(logObject).to.deep.equal(
          {'status_code': 200, 'response': getListResult.map((item) => item.toJSON({minimize: false}))}
        );
      });
      let responseHeader = sinon.spy(
        function (header, value) {
          let obj = {};
          obj[header] = value;
          actualHeaders.push(obj);
        }
      );

      let responseEnd = sinon.spy(
        function (type, statusCode, content) {
          assert.deepEqual(
            content,
            getListResult
          );
          assert.deepEqual(
            actualHeaders,
            expectedHeaders,
            'The incorrect headers where set for the response'
          );
          assert.equal(
            statusCode,
            200,
            'The incorrect status code is set when there is no content'
          );
          expect(logSpy.callCount).to.equal(1);
          activityCount.restore();
          activityFind.restore();
        }
      );
      let res = {setHeader: responseHeader, setResponse: responseEnd};

      let nextSpy = sinon.spy((err) => {
        expect(err, 'Did not expect and error').to.be.undefined;
        expect(nextSpy.callCount).to.equal(1);
        done();
      });

      let activityService = new ActivityService(logger.getLogger(logSpy));
      activityService.getActivities(args, res, nextSpy);

    });
  });

  describe('getActivity(): Retrieves the activity for the provided id', function () {

    afterEach(() => {
      sinon.restore();
    });

    /**
     * Test that the activity is returned in perfect world scenario
     *
     * @author Tyler Dean Smith <tyler.smith@a24group.com>
     * @since  13 July 2017
     *
     * @covers services/ActivityService.getActivity
     */
    it('200 response test', function (done) {
      let id = 'no_match';
      let args = {
        id: {
          schema: {
            name: 'id',
            in: 'path'
          },
          value: id
        }
      };
      let activity = {
        '_id': id,
        toJSON: function toJSON() {
          return activity;
        }
      };

      let activityFind = sinon.stub(Activity, 'findById').callsFake(function (localId, callback) {
        assert.equal(
          localId,
          id,
          'Incorrect id is used to retrieve activity data'
        );
        setTimeout(
          function () {
            callback(null, activity);
          },
          0
        );
      });

      let logSpy = sinon.spy(function (message, logObject) {
        expect(message).to.equal('The activity get call has been completed successfully.');
        expect(logObject).deep.equal({'status_code': 200, 'response': activity});
      });
      let headerSpy = sinon.spy(function (header, value) {
        assert.equal(
          header,
          'Content-Type',
          'Expected the activity header to be set'
        );
        assert.equal(
          value,
          'application/json',
          'Expected the activity to be set to application/json'
        );
      });
      let res = {
        'setHeader': headerSpy,
        'statusCode': ''
      };

      let endHeader = sinon.spy(function (type, statusCode, content) {
        assert.deepEqual(
          content,
          activity,
          'Incorrect data was returned for activity id'
        );
        assert.equal(
          statusCode,
          200,
          'Expected the status code to be set to 200'
        );
        expect(logSpy.callCount).to.equal(1);
        activityFind.restore();
      });
      res['setResponse'] = endHeader;
      let nextSpy = sinon.spy((err) => {
        expect(err, 'Did not expect and error').to.be.undefined;
        expect(nextSpy.callCount).to.equal(1);
        done();
      });

      let activityService = new ActivityService(logger.getLogger(logSpy));
      activityService.getActivity(args, res, nextSpy);
    });

    /**
     * Test that an error is thrown if no result is found for given id
     *
     * @author Tyler Dean Smith <tyler.smith@a24group.com>
     * @since  13 July 2017
     *
     * @covers services/ActivityService.getActivity
     */
    it('404 response test', function (done) {
      let id = 'no_match';
      let args = {
        id: {
          schema: {
            name: 'id',
            in: 'path'
          },
          value: id
        }
      };
      let resourceNotFound = new ResourceNotFoundError(
        'Activity with id [' + id + '] was not found'
      );

      let activityFind = sinon.stub(Activity, 'findById').callsFake(function (localId, callback) {
        assert.equal(
          localId,
          id,
          'Incorrect id is used to retrieve activity data'
        );
        setTimeout(
          function () {
            callback(null, null);
          },
          0
        );
      });

      let logSpy = sinon.spy();
      let headerSpy = sinon.spy(function (header, value) {
        assert.equal(
          header,
          'Content-Type',
          'Expected the content type header to be set'
        );
        assert.equal(
          value,
          'application/json',
          'Expected the content type to be set to application/json'
        );
      });
      let res = {
        'setHeader': headerSpy,
        'statusCode': ''
      };
      let next = sinon.spy(function (localError) {
        assert.deepEqual(
          localError,
          resourceNotFound,
          'Expected the resource not found error'
        );
        expect(logSpy.callCount).to.equal(1);
        done();
      });

      let activityService = new ActivityService(logger.getLogger(logSpy));
      activityService.getActivity(args, res, next);
      activityFind.restore();
    });

    /**
     * Test that an error is thrown if the findById has an error
     *
     * @author Tyler Dean Smith <tyler.smith@a24group.com>
     * @since  13 July 2017
     *
     * @covers services/ActivityService.getActivity
     */
    it('500 error scenario when the findById cannot complete', function (done) {
      let id = '1234';
      let args = {
        id: {
          schema: {
            name: 'id',
            in: 'path'
          },
          value: id
        }
      };
      let error = {message: 'Socket time out'};
      let runTimeError = new RuntimeError(
        'An error occurred while retrieving activity [' + id + ']',
        error
      );

      let activityFind = sinon.stub(Activity, 'findById').callsFake(function (localId, callback) {
        assert.equal(
          localId,
          id,
          'Incorrect id is used to retrieve activity data'
        );
        setTimeout(
          function () {
            callback(error, null);
          },
          0
        );
      });

      let logSpy = sinon.spy();
      let res = sinon.spy();
      let next = sinon.spy(function (localError) {
        RuntimeErrorAssert.deepEqual(
          localError,
          runTimeError,
          'Expected the socket error to be passed to callback'
        );
        done();
      });

      let activityService = new ActivityService(logger.getLogger(logSpy));
      activityService.getActivity(args, res, next);
      activityFind.restore();
    });

  });
// NEW GENERATOR FUNCTIONS LOCATION
});
