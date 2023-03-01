'use strict';

const {expect, assert} = require('chai');
const {ValidationError, RuntimeError} = require('a24-node-error-utils');
const ActivityAdvancedSearchService = require('../../services/ActivityAdvancedSearchService');
const Activity = require('../../models/Activity');
const {AdvancedSearchMongoQueryHelper} = require('a24-node-advanced-query-utils');
const sinon = require('sinon');
const {RuntimeErrorAssert} = require('a24nodetestutils');

describe('ActivityAdvancedSearchService test scenarios', function () {
  let logger = {
    getLogger: function logger(logSpy, requestId) {
      return {
        'info': logSpy,
        'debug': logSpy,
        'error': logSpy,
        'logAction': logSpy,
        'requestId': requestId
      };
    }
  };
  describe('advancedSearch(): Advanced search on Activity records', function () {

    afterEach(() => {
      sinon.restore();
    });

    /**
     * This will test the success scenario when records are returned.
     *
     * @author Anil Kumar <lanill1986@gmail.com>
     * @since  5 September 2018
     *
     * @covers services/ActivityAdvancedSearchService.advancedSearch
     * @covers a24-node-advanced-query-utils/AdvancedSearchMongoQueryHelper.transformQueryObjectToMongoQuery
     * @covers services/ActivityAdvancedSearchService._getAdvancedSearchCount
     * @covers services/ActivityAdvancedSearchService._advancedGetList
     */
    it('Test the successful retrieval of data', function (done) {
      let resultObject = new Activity({
        'activity_type': 'CALL_MADE',
        'description': 'string',
        'comment': 'string',
        'activity_date': '2018-01-04T19:10:40.978+05:30',
        'created_by_entity': {
          'entity_id': '123456789012345678902222',
          'entity_type': 'user',
          'name': 'Name of the creating user'
        },
        'executing_entity': {
          'entity_id': '123456789012345678901111',
          'entity_type': 'user',
          'name': 'The executing user name1'
        },
        'subject': {
          'entity_id': '5a30f22b3170e07ea32aa45a',
          'entity_type': 'org',
          'name': 'org name'
        },
        'linked_entities': [
          {
            'entity_id': 'string',
            'entity_type': 'string',
            'name': 'string'
          }
        ]
      });
      let findResultObject = {
        skip: function (skip) {
          expect(skip).to.be.equal(skipValue);

          return findResultObject;
        },
        limit: function (limit) {
          expect(limit).to.be.equal(12);

          return findResultObject;
        },
        sort: function (arrSortParams) {
          expect(arrSortParams).to.be.deep.equal(sortParams);
          return findResultObject;
        },
        exec: function (callback) {
          setTimeout(
            function () {
              callback(null, [resultObject]);
            },
            0
          );
        }
      };
      let swaggerParams = {
        searchCriteria: {
          value: {
            'sort': ['_id'],
            'page': 2,
            'items_per_page': 12,
            'query': {
              'and': [
                {
                  'linked_entities': {
                    'contains': [
                      {
                        'name': {
                          'equal': 'The linked entity user name'
                        },
                        'entity_id': {
                          'equal': '12345678901234567890221'
                        }
                      }
                    ]
                  },
                  'executing_entity': {
                    'name': {
                      'like': 'user'
                    },
                    'entity_id': {
                      'like': '123456789012345678901111'
                    }
                  },
                  'subject': {
                    'entity_type': {
                      'equal': 'enquiry'
                    }
                  }
                }
              ]
            }
          }
        }
      };
      let sortParams = {
        _id: 1
      };

      let databaseQuery = {
        '$and': [
          {
            'linked_entities': {
              '$elemMatch': {
                '$and': [
                  {
                    'name': {
                      '$eq': 'The linked entity user name'
                    },
                    'entity_id': {
                      '$eq': '12345678901234567890221'
                    }
                  }
                ]
              }
            },
            'executing_entity.name': {
              '$regex': /user/i
            },
            'executing_entity.entity_id': {
              '$regex': /123456789012345678901111/i
            },
            'subject.entity_type': {
              '$eq': 'enquiry'
            }
          }
        ]
      };

      let skipValue = 12;

      let stubQueryHelper = sinon.stub(
        AdvancedSearchMongoQueryHelper,
        'transformQueryObjectToMongoQuery'
      ).callsFake(function (query) {
        expect(query).to.be.deep.equal(swaggerParams.searchCriteria.value.query);
        return databaseQuery;
      });

      let stubCount = sinon.stub(Activity, 'countDocuments').callsFake(function (query, callback) {
        expect(query).to.be.deep.equal(databaseQuery, 'The expected database query was not returned.');
        setTimeout(
          function () {
            callback(null, 13);
          },
          0
        );
      });

      let stubFind = sinon.stub(Activity, 'find').callsFake(function (query) {
        expect(query).to.be.deep.equal(databaseQuery);

        return findResultObject;
      });

      let resSetHeaderSpy = sinon.spy();
      let resEndSpy = sinon.spy(function (type, statusCode, searchResult) {
        assert.deepEqual(
          searchResult,
          [resultObject],
          'Expected the result to equal expected result'
        );

        expect(statusCode).to.be.equal(200);
        expect(logSpy.callCount, 'log is expected to be called at least once').to.be.at.least(1);

        stubFind.restore();
        stubCount.restore();
        stubQueryHelper.restore();
      });

      let logSpy = sinon.spy();
      let nextSpy = sinon.spy((err) => {
        expect(err, 'Did not expect and error').to.be.undefined;
        expect(nextSpy.callCount).to.equal(1);
        done();
      });
      let res = {setHeader: resSetHeaderSpy, setResponse: resEndSpy};

      let service = new ActivityAdvancedSearchService(logger.getLogger(logSpy));
      service.advancedSearch(swaggerParams, res, nextSpy);
    });

    /**
     * This will test the success scenario when no record is returned.
     *
     * @author Anil Kumar <lanill1986@gmail.com>
     * @since  5 September 2018
     *
     * @covers services/ActivityAdvancedSearchService.advancedSearch
     * @covers a24-node-advanced-query-utils/AdvancedSearchMongoQueryHelper.transformQueryObjectToMongoQuery
     * @covers services/ActivityAdvancedSearchService._getAdvancedSearchCount
     * @covers services/ActivityAdvancedSearchService._advancedGetList
     */
    it('Test the success scenario where no data is returned', function (done) {
      let findResultObject = {
        skip: function (skip) {
          expect(skip).to.be.equal(skipValue);

          return findResultObject;
        },
        limit: function (limit) {
          expect(limit).to.be.equal(12);

          return findResultObject;
        },
        sort: function (arrSortParams) {
          expect(arrSortParams).to.be.deep.equal(sortParams);
          return findResultObject;
        },
        exec: function (callback) {
          setTimeout(
            function () {
              callback(null, []);
            },
            0
          );
        }
      };
      let swaggerParams = {
        searchCriteria: {
          value: {
            'sort': ['_id'],
            'page': 2,
            'items_per_page': 12,
            'query': {
              'and': [
                {
                  'linked_entities': {
                    'contains': [
                      {
                        'name': {
                          'equal': 'The linked entity user name'
                        },
                        'entity_id': {
                          'equal': '12345678901234567890221'
                        }
                      }
                    ]
                  },
                  'executing_entity': {
                    'name': {
                      'like': 'user'
                    },
                    'entity_id': {
                      'like': '123456789012345678901111'
                    }
                  },
                  'subject': {
                    'entity_type': {
                      'equal': 'enquiry'
                    }
                  }
                }
              ]
            }
          }
        }
      };
      let sortParams = {
        _id: 1
      };

      let databaseQuery = {
        '$and': [
          {
            'linked_entities': {
              '$elemMatch': {
                '$and': [
                  {
                    'name': {
                      '$eq': 'The linked entity user name'
                    },
                    'entity_id': {
                      '$eq': '12345678901234567890221'
                    }
                  }
                ]
              }
            },
            'executing_entity.name': {
              '$regex': /user/i
            },
            'executing_entity.entity_id': {
              '$regex': /123456789012345678901111/i
            },
            'subject.entity_type': {
              '$eq': 'enquiry'
            }
          }
        ]
      };

      let skipValue = 12;

      let stubQueryHelper = sinon.stub(
        AdvancedSearchMongoQueryHelper,
        'transformQueryObjectToMongoQuery'
      ).callsFake(function (query) {
        expect(query).to.be.deep.equal(swaggerParams.searchCriteria.value.query);
        return databaseQuery;
      });

      let stubCount = sinon.stub(Activity, 'countDocuments').callsFake(function (query, callback) {
        expect(query).to.be.deep.equal(databaseQuery, 'The expected database query was not returned.');
        setTimeout(
          function () {
            callback(null, 0);
          },
          0
        );
      });

      let stubFind = sinon.stub(Activity, 'find').callsFake(function (query) {
        expect(query).to.be.deep.equal(databaseQuery);
        return findResultObject;
      });

      let resSetHeaderSpy = sinon.spy();
      let resEndSpy = sinon.spy(function (type, statusCode, searchResult) {
        expect(searchResult).to.be.undefined;

        expect(statusCode).to.be.equal(204);
        expect(logSpy.callCount, 'log is expected to be called at least once').to.be.at.least(1);

        stubFind.restore();
        stubCount.restore();
        stubQueryHelper.restore();
      });

      let logSpy = sinon.spy();
      let nextSpy = sinon.spy((err) => {
        expect(err, 'Did not expect and error').to.be.undefined;
        expect(nextSpy.callCount).to.equal(1);
        done();
      });
      let res = {setHeader: resSetHeaderSpy, setResponse: resEndSpy};

      let service = new ActivityAdvancedSearchService(logger.getLogger(logSpy));
      service.advancedSearch(swaggerParams, res, nextSpy);
    });

    /**
     * Test the scenario where the find returns an error
     *
     * @author Anil Kumar <lanill1986@gmail.com>
     * @since  6 September 2018
     *
     * @covers services/ActivityAdvancedSearchService.advancedSearch
     * @covers a24-node-advanced-query-utils/AdvancedSearchMongoQueryHelper.transformQueryObjectToMongoQuery
     * @covers services/ActivityAdvancedSearchService._getAdvancedSearchCount
     * @covers services/ActivityAdvancedSearchService._advancedGetList
     */
    it('Test the scenario where the find returns an error', function (done) {
      let errorObj = {error: 'someError'};
      let findResultObject = {
        skip: function (skip) {
          expect(skip).to.be.equal(skipValue);

          return findResultObject;
        },
        limit: function (limit) {
          expect(limit).to.be.equal(12);

          return findResultObject;
        },
        sort: function (arrSortParams) {
          expect(arrSortParams).to.be.deep.equal(sortParams);
          return findResultObject;
        },
        exec: function (callback) {
          setTimeout(
            function () {
              callback(errorObj);
            },
            0
          );
        }
      };
      let swaggerParams = {
        searchCriteria: {
          value: {
            'sort': ['_id'],
            'page': 2,
            'items_per_page': 12,
            'query': {
              'and': [
                {
                  'linked_entities': {
                    'contains': [
                      {
                        'name': {
                          'equal': 'The linked entity user name'
                        },
                        'entity_id': {
                          'equal': '12345678901234567890221'
                        }
                      }
                    ]
                  },
                  'executing_entity': {
                    'name': {
                      'like': 'user'
                    },
                    'entity_id': {
                      'like': '123456789012345678901111'
                    }
                  },
                  'subject': {
                    'entity_type': {
                      'equal': 'enquiry'
                    }
                  }
                }
              ]
            }
          }
        }
      };
      let sortParams = {
        _id: 1
      };

      let databaseQuery = {
        '$and': [
          {
            'linked_entities': {
              '$elemMatch': {
                '$and': [
                  {
                    'name': {
                      '$eq': 'The linked entity user name'
                    },
                    'entity_id': {
                      '$eq': '12345678901234567890221'
                    }
                  }
                ]
              }
            },
            'executing_entity.name': {
              '$regex': /user/i
            },
            'executing_entity.entity_id': {
              '$regex': /123456789012345678901111/i
            },
            'subject.entity_type': {
              '$eq': 'enquiry'
            }
          }
        ]
      };

      let skipValue = 12;

      let stubQueryHelper = sinon.stub(
        AdvancedSearchMongoQueryHelper,
        'transformQueryObjectToMongoQuery'
      ).callsFake(function (query) {
        expect(query).to.be.deep.equal(swaggerParams.searchCriteria.value.query);
        return databaseQuery;
      });

      let stubCount = sinon.stub(Activity, 'countDocuments').callsFake(function (query, callback) {
        expect(query).to.be.deep.equal(databaseQuery, 'The expected database query was not returned.');
        setTimeout(
          function () {
            callback(null, 0);
          },
          0
        );
      });

      let stubFind = sinon.stub(Activity, 'find').callsFake(function (query) {
        expect(query).to.be.deep.equal(databaseQuery);
        return findResultObject;
      });

      let resSetHeaderSpy = sinon.spy();
      let resEndSpy = sinon.spy();

      let expectedError = new RuntimeError(
        'An error occurred while retrieving the activity records for advanced search',
        errorObj
      );
      let logSpy = sinon.spy();
      let nextSpy = sinon.spy((error) => {
        RuntimeErrorAssert.deepEqual(
          error,
          expectedError,
          'Expected the error to equal expected error'
        );

        expect(nextSpy.callCount).to.be.equal(1);
        assert.equal(logSpy.callCount, 0);
        expect(resEndSpy.callCount).to.be.equal(0);

        done();
        stubFind.restore();
        stubCount.restore();
        stubQueryHelper.restore();
      });
      let res = {setHeader: resSetHeaderSpy, setResponse: resEndSpy};

      let service = new ActivityAdvancedSearchService(logger.getLogger(logSpy));
      service.advancedSearch(swaggerParams, res, nextSpy);
    });

    /**
     * This will test the case when count returns an error
     *
     * @author Anil Kumar <lanill1986@gmail.com>
     * @since  06 September 2018
     *
     * @covers services/ActivityAdvancedSearchService.advancedSearch
     * @covers a24-node-advanced-query-utils/AdvancedSearchMongoQueryHelper.transformQueryObjectToMongoQuery
     * @covers services/ActivityAdvancedSearchService._getAdvancedSearchCount
     * @covers services/ActivityAdvancedSearchService._advancedGetList
     */
    it('Test the scenario when count returns error', function (done) {
      let swaggerParams = {
        searchCriteria: {
          value: {
            'sort': [
              '_id'
            ],
            'page': 1,
            'items_per_page': 10,
            'query': {
              'activity_type': {
                'like': 'string'
              }
            }
          }
        }
      };
      let expectedQuery = {activity_type: {'$regex': /string/i}};
      let sortParams = {
        _id: 1
      };
      let skipValue = 0;
      let findResult = [
        {
          '_id': '5b84dc480c54e52c62efbd37',
          'updated_at': '2018-08-28T05:23:20Z',
          'created_at': '2018-08-28T05:23:20Z',
          'activity_type': 'string',
          'description': 'string',
          'comment': 'string',
          'activity_date': '2018-08-28T05:01:33Z',
          '__v': 0,
          'created_by_entity': {
            'entity_id': 'string',
            'entity_type': 'string',
            'name': 'string'
          },
          'executing_entity': {
            'entity_id': 'string',
            'entity_type': 'string',
            'name': 'string'
          },
          'subject': {
            'entity_id': 'string',
            'entity_type': 'string',
            'name': 'string'
          },
          'linked_entities': [
            {
              'entity_id': 'string',
              'entity_type': 'string',
              'name': 'string',
              '_id': '5b84dc480c54e52c62efbd38'
            }
          ]
        },
        {
          '_id': '5b84dd2e0c54e52c62efbd39',
          'updated_at': '2018-08-28T05:27:10Z',
          'created_at': '2018-08-28T05:27:10Z',
          'activity_type': 'Astring',
          'description': 'Astring',
          'comment': 'Astring',
          'activity_date': '2018-08-28T05:01:33Z',
          '__v': 0,
          'created_by_entity': {
            'entity_id': 'Astring',
            'entity_type': 'Astring',
            'name': 'Astring'
          },
          'executing_entity': {
            'entity_id': 'Astring',
            'entity_type': 'astring',
            'name': 'Astring'
          },
          'subject': {
            'entity_id': 'Astring',
            'entity_type': 'Astring',
            'name': 'Astring'
          },
          'linked_entities': [
            {
              'entity_id': 'Astring',
              'entity_type': 'Astring',
              'name': 'Astring',
              '_id': '5b84dd2e0c54e52c62efbd3a'
            }
          ]
        }
      ];

      let findResultObject = {
        skip: function (skip) {
          assert.equal(skip, skipValue);

          return findResultObject;
        },
        limit: function (limit) {
          assert.equal(limit, 10);

          return findResultObject;
        },
        sort: function (arrSortParams) {
          assert.deepEqual(arrSortParams, sortParams);
          return findResultObject;
        },
        exec: function (callback) {
          setTimeout(
            function () {
              callback(null, findResult);
            },
            0
          );
        }
      };

      let errorObject = {'error': 'someError'};
      let expectedRunTimeError = new RuntimeError(
        'An error occurred while counting the activity records for advanced search',
        errorObject
      );

      let queryHelperStub = sinon.stub(AdvancedSearchMongoQueryHelper, 'transformQueryObjectToMongoQuery').callsFake(
        function (query) {
          assert.deepEqual(query, swaggerParams.searchCriteria.value.query);
          return expectedQuery;
        }
      );

      let activityCountStub = sinon.stub(Activity, 'countDocuments').callsFake(function (query, callback) {
        assert.deepEqual(query, expectedQuery, 'Invalid query was passed.');
        setTimeout(
          function () {
            callback(errorObject);
          },
          0
        );
      });

      let activityFindStub = sinon.stub(Activity, 'find').callsFake(function (query) {
        assert.deepEqual(query, expectedQuery, 'Invalid query was passed.');
        return findResultObject;
      });

      let logSpy = sinon.spy();
      let responseHeader = sinon.spy();
      let responseEnd = sinon.spy();

      let res = {setHeader: responseHeader, setResponse: responseEnd};

      let nextSpy = sinon.spy((err) => {
        RuntimeErrorAssert.deepEqual(err, expectedRunTimeError, 'The error did not match expected error.');
        assert.equal(nextSpy.callCount, 1);
        assert.equal(logSpy.callCount, 0);
        activityCountStub.restore();
        activityFindStub.restore();
        queryHelperStub.restore();
        done();
      });

      let advanceSearchService = new ActivityAdvancedSearchService(logger.getLogger(logSpy));
      advanceSearchService.advancedSearch(swaggerParams, res, nextSpy);
    });

    /**
     * This will test the case when AdvancedSearchMongoQueryHelper throws validation error
     *
     * @author Anil Kumar <lanill1986@gmail.com>
     * @since  06 September 2018
     *
     * @covers services/ActivityAdvancedSearchService.advancedSearch
     * @covers a24-node-advanced-query-utils/AdvancedSearchMongoQueryHelper.transformQueryObjectToMongoQuery
     */
    it('Test the case when AdvancedSearchMongoQueryHelper throws validation error', function (done) {
      let swaggerParams = {
        searchCriteria: {
          value: {
            'sort': [
              '_id'
            ],
            'page': 1,
            'items_per_page': 10,
            'query': {
              'activity_type': {
                equal: 1
              }
            }
          }
        }
      };

      let expectedError = new ValidationError(
        'Expected the value of the operator to be of type "string" when querying field "activity_type"',
        [
          {
            code: 'INVALID_TYPE',
            message: 'Expected the value of the operator to be of type "string" when querying field "activity_type"'
          }
        ]
      );
      let logSpy = sinon.spy();
      let responseHeader = sinon.spy();
      let responseEnd = sinon.spy();

      let queryHelperStub = sinon.stub(AdvancedSearchMongoQueryHelper, 'transformQueryObjectToMongoQuery');
      queryHelperStub.throws(expectedError);

      let res = {setHeader: responseHeader, setResponse: responseEnd};

      let nextSpy = sinon.spy((err) => {
        assert.deepEqual(err, expectedError, 'Did not expect an error');
        assert.equal(nextSpy.callCount, 1);
        assert.equal(logSpy.callCount, 1);
        queryHelperStub.restore();
        done();
      });

      let advanceSearchService = new ActivityAdvancedSearchService(logger.getLogger(logSpy));
      advanceSearchService.advancedSearch(swaggerParams, res, nextSpy);
    });

    /**
     * This will test the case when AdvancedSearchMongoQueryHelper throws an error
     *
     * @author Anil Kumar <lanill1986@gmail.com>
     * @since  06 September 2018
     *
     * @covers services/ActivityAdvancedSearchService.advancedSearch
     * @covers a24-node-advanced-query-utils/AdvancedSearchMongoQueryHelper.transformQueryObjectToMongoQuery
     */
    it('Test the case when AdvancedSearchMongoQueryHelper throws an error', function (done) {
      let swaggerParams = {
        searchCriteria: {
          value: {
            'sort': [
              '_id'
            ],
            'page': 1,
            'items_per_page': 10,
            'query': {
              'activity_type': {
                equals: 'string'
              }
            }
          }
        }
      };
      let expectedError = 'The advanced search threw an error';

      let queryHelperStub = sinon.stub(AdvancedSearchMongoQueryHelper, 'transformQueryObjectToMongoQuery');
      queryHelperStub.throws(expectedError);

      let logSpy = sinon.spy();
      let responseHeader = sinon.spy();
      let responseEnd = sinon.spy();

      let res = {setHeader: responseHeader, setResponse: responseEnd};

      let nextSpy = sinon.spy((err) => {
        assert.deepEqual(err.message, expectedError, 'Did not expect an error');
        assert.equal(nextSpy.callCount, 1);
        assert.equal(logSpy.callCount, 1);
        queryHelperStub.restore();
        done();
      });

      let advanceSearchService = new ActivityAdvancedSearchService(logger.getLogger(logSpy));
      advanceSearchService.advancedSearch(swaggerParams, res, nextSpy);
    });

  });
// NEW GENERATOR FUNCTIONS LOCATION
});
