'use strict';
const chai = require('chai');
const ZSchema = require('z-schema');
const validator = new ZSchema({});
const supertest = require('supertest');
const api = supertest('http://localhost:3100'); // supertest init;
const TestData = require('../data/AgencyAdvancedSearch');
const Activity = require('../../models/Activity');
const asyncLib = require('async');

chai.should();

describe('/activities/search', function () {
  describe('post', function () {

    before(function (done) {
      this.timeout(10000);
      asyncLib.each(TestData, (record, callback) => {
        let newRecord = new Activity(record);
        newRecord.save(callback);
      }, (err) => {
        if (err) {
          return done(err);
        }

        done();
      });

    });
    /*eslint-disable*/
    var schema = {
      'type': 'array',
      'items': {
        'allOf': [
          {
            'type': 'object',
            'required': [
              '_id'
            ],
            'properties': {
              '_id': {
                'type': 'string'
              }
            }
          },
          {
            'type': 'object',
            'required': [
              'activity_type',
              'activity_date'
            ],
            'properties': {
              'activity_type': {
                'type': 'string'
              },
              'description': {
                'type': 'string'
              },
              'comment': {
                'type': 'string'
              },
              'linked_entities': {
                'type': 'array',
                'items': {
                  'type': 'object',
                  'description': 'Represents a dynamic link to an entity that exists in other services',
                  'required': [
                    'entity_id',
                    'entity_type'
                  ],
                  'properties': {
                    'entity_id': {
                      'type': 'string',
                      'description': 'The id of the entity, note this doesn\'t have pattern matching as user don\'t have mongo object ids as ids'
                    },
                    'entity_type': {
                      'type': 'string',
                      'description': 'The type of the entity this object represents'
                    },
                    'name': {
                      'type': 'string',
                      'description': 'The name of the entity'
                    }
                  }
                }
              },
              'activity_date': {
                'type': 'string',
                'format': 'date-time'
              },
              'subject': {
                'type': 'object',
                'description': 'Represents a dynamic link to an entity that exists in other services',
                'required': [
                  'entity_id',
                  'entity_type'
                ],
                'properties': {
                  'entity_id': {
                    'type': 'string',
                    'description': 'The id of the entity, note this doesn\'t have pattern matching as user don\'t have mongo object ids as ids'
                  },
                  'entity_type': {
                    'type': 'string',
                    'description': 'The type of the entity this object represents'
                  },
                  'name': {
                    'type': 'string',
                    'description': 'The name of the entity'
                  }
                }
              },
              'executing_entity': {
                'type': 'object',
                'description': 'Represents a dynamic link to an entity that exists in other services',
                'required': [
                  'entity_id',
                  'entity_type'
                ],
                'properties': {
                  'entity_id': {
                    'type': 'string',
                    'description': 'The id of the entity, note this doesn\'t have pattern matching as user don\'t have mongo object ids as ids'
                  },
                  'entity_type': {
                    'type': 'string',
                    'description': 'The type of the entity this object represents'
                  },
                  'name': {
                    'type': 'string',
                    'description': 'The name of the entity'
                  },
                  'context_id': {
                    'type': 'string'
                  },
                  'context_type': {
                    'type': 'string'
                  }
                }
              },
              'created_by_entity': {
                'type': 'object',
                'description': 'Represents a dynamic link to an entity that exists in other services',
                'required': [
                  'entity_id',
                  'entity_type'
                ],
                'properties': {
                  'entity_id': {
                    'type': 'string',
                    'description': 'The id of the entity, note this doesn\'t have pattern matching as user don\'t have mongo object ids as ids'
                  },
                  'entity_type': {
                    'type': 'string',
                    'description': 'The type of the entity this object represents'
                  },
                  'name': {
                    'type': 'string',
                    'description': 'The name of the entity'
                  },
                  'context_id': {
                    'type': 'string'
                  },
                  'context_type': {
                    'type': 'string'
                  }
                }
              }
            }
          },
          {
            'type': 'object',
            'required': [
              'created_at',
              'updated_at'
            ],
            'properties': {
              'created_at': {
                'type': 'string',
                'format': 'date-time'
              },
              'updated_at': {
                'type': 'string',
                'format': 'date-time'
              }
            }
          }
        ]
      }
    };
    /*eslint-enable*/
    var successScenarios = {
      'case query with equal operation': {
        'sort': [
          '_id'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          and: [
            {
              activity_type: {
                equal: 'string'
              }
            }
          ]
        }
      },
      'case query with like operation': {
        'sort': [
          '_id'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          and: [
            {
              activity_type: {
                like: '*tr*'
              }
            }
          ]
        }
      },
      'case query with and, and equal operation on various field': {
        'sort': [
          '_id'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          and: [
            {
              activity_type: {
                equal: 'string'
              }
            },
            {
              subject: {
                name: {
                  equal: 'string'
                }
              }
            }
          ]
        }
      },
      'case query with and, and like operation on various field': {
        'sort': [
          '_id'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          and: [
            {
              activity_type: {
                like: '*tr*'
              }
            },
            {
              subject: {
                name: {
                  like: 's*'
                }
              }
            }
          ]
        }
      },
      'case query with or, and like, equal operation on various field': {
        'sort': [
          '_id'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          or: [
            {
              activity_type: {
                like: '*tr*'
              }
            },
            {
              subject: {
                name: {
                  equal: 'string1'
                }
              }
            }
          ]
        }
      },
      'case query with Operation contains on embedded array property': {
        'sort': [
          '_id'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          and: [
            {
              activity_type: {
                like: '*tr*'
              }
            },
            {
              linked_entities: {
                contains: [
                  {
                    'name': {
                      'equal': 'string'
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      'case query with sorting and filter on activity_type': {
        'sort': [
          'activity_type'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          and:
          [
            {
              'activity_type': {
                'like': 'string'
              }
            }
          ]
        }
      },
      'case query with sorting on created_by_entity.entity_id': {
        'sort': [
          'created_by_entity.entity_id'
        ],
        'page': 1,
        'items_per_page': 10
      }
    };

    var testSuccessScenarios = function (payload) {
      return function (done) {
        api.post('/v3/activities/search')
          .set('Accept', 'application/json')
          .send(payload)
          .expect(200)
          .end(function (err, res) {
            if (err) {return done(err);}

            validator.validate(res.body, schema).should.be.true;
            done();
          });
      };
    };

    for (var successScenario in successScenarios) {

      /**
       * This will test the 200 success scenarios for various query values
       *
       * @author Anil Kumar <lanill1986@gmail.com>
       * @since  06 September 2018
       */
      it(
        'Success test for 200 ' + successScenario,
        testSuccessScenarios(successScenarios[successScenario])
      );
    }

    var successNoContentScenarios = {
      'case query with equal operation': {
        'sort': [
          '_id'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          and: [
            {
              activity_type: {
                equal: 'string123'
              }
            }
          ]
        }
      },
      'case query with like operation': {
        'sort': [
          '_id'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          and: [
            {
              activity_type: {
                like: '*wer*'
              }
            }
          ]
        }
      },
      'case query with and, and equal operation on various field': {
        'sort': [
          '_id'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          and: [
            {
              activity_type: {
                equal: 'stringB'
              }
            },
            {
              subject: {
                name: {
                  equal: 'string1'
                }
              }
            }
          ]
        }
      },
      'case query with and, and like operation on various field': {
        'sort': [
          '_id'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          and: [
            {
              activity_type: {
                like: '*wer*'
              }
            },
            {
              subject: {
                name: {
                  like: '*1'
                }
              }
            }
          ]
        }
      },
      'case query with or, and like, equal operation on various field': {
        'sort': [
          '_id'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          or: [
            {
              activity_type: {
                like: '*trw*'
              }
            },
            {
              subject: {
                name: {
                  equal: 'string1'
                }
              }
            },
            {
              created_by_entity: {
                context_id: {
                  equal: 'string'
                },
                context_type: {
                  equal: 'string'
                }
              }
            },
            {
              executing_entity: {
                context_id: {
                  equal: 'string'
                },
                context_type: {
                  equal: 'string'
                }
              }
            }
          ]
        }
      },
      'case query with Operation contains on embedded array property': {
        'sort': [
          '_id'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          and: [
            {
              activity_type: {
                like: '*trw*'
              }
            },
            {
              linked_entities: {
                contains: [
                  {
                    'name': {
                      'equal': 'string'
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      'case query with sorting and filter on activity_type': {
        'sort': [
          'activity_type'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          and: [
            {
              'activity_type': {
                'like': 'stringW'
              }
            }
          ]
        }
      }
    };

    var testSuccessNoContentScenarios = function (payload) {
      return function (done) {
        api.post('/v3/activities/search')
          .set('Accept', 'application/json')
          .send(payload)
          .expect(204)
          .end(function (err, res) {
            if (err) {return done(err);}

            res.body.should.equal(''); // non-json response or no schema
            done();
          });
      };
    };

    for (var successNoContentScenario in successNoContentScenarios) {

      /**
       * This will test the 204 success scenarios for various query values
       *
       * @author Anil Kumar <lanill1986@gmail.com>
       * @since  06 September 2018
       */
      it(
        'Success test for 204 ' + successNoContentScenario,
        testSuccessNoContentScenarios(successNoContentScenarios[successNoContentScenario])
      );
    }

    it('should respond with 400 A validation error...', function (done) {
      /*eslint-disable*/
      var schema = {
        'allOf': [
          {
            "type": "object",
            "required": [
              "code",
              "message"
            ],
            "properties": {
              "code": {
                "type": "string"
              },
              "message": {
                "type": "string"
              }
            }
          },
          {
            "type": "object",
            "properties": {
              "errors": {
                "type": "array",
                "items": {
                  "allOf": [
                    {
                      "type": "object",
                      "required": [
                        "message",
                        "path"
                      ],
                      "properties": {
                        "message": {
                          "type": "string"
                        },
                        "path": {
                          "type": "array",
                          "items": {
                            "type": "string"
                          }
                        },
                        "description": {
                          "type": "string"
                        }
                      }
                    },
                    {
                      "type": "object",
                      "properties": {
                        "code": {
                          "type": "string",
                          "enum": [
                            "INVALID_ACTIVITY_DATE",
                            "INVALID_TYPE",
                            "ENUM_MISMATCH",
                            "OBJECT_ADDITIONAL_PROPERTIES"
                          ]
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        ]
      };
      let searchCriteria = {
        'sort': [
          '_id'
        ],
        'page': 1,
        'items_per_page': 10,
        'query': {
          or: [
            {
              activity_type: {
                like: '*tr*'
              }
            },
            {
              description: {
                equal: 'string1'
              }
            }
          ]
        }
      };
      /*eslint-enable*/
      api.post('/v3/activities/search')
        .set('Accept', 'application/json')
        .send(searchCriteria)
        .expect(400)
        .end(function (err, res) {
          if (err) {return done(err);}

          validator.validate(res.body, schema).should.be.true;
          done();
        });
    });

  });

});
