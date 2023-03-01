'use strict';
var chai = require('chai');
var expect = chai.expect;
var ZSchema = require('z-schema');
var validator = new ZSchema({});
var supertest = require('supertest');
var api = supertest('http://localhost:3100'); // supertest init;
var async = require('async');
var assert = require('chai').assert;

chai.should();

describe('/activity', function () {
  describe('post', function () {
    it('should respond with 201 The created activity', function (done) {
      this.timeout(3000);
      /*eslint-disable*/
      const schema = {
        "type": "object",
        "allOf": [
          {
            "type": "object",
            "required": [
              "_id"
            ],
            "properties": {
              "_id": {
                "type": "string"
              }
            }
          },
          {
            "type": "object",
            "required": [
              "activity_type"
            ],
            "properties": {
              "activity_type": {
                "type": "string"
              },
              "description": {
                "type": "string"
              },
              "comment": {
                "type": "string"
              },
              "executing_contact": {
                "type": "string",
                "pattern": "^[0-9a-fA-F]{24}$"
              },
              "executing_contact_name": {
                "type": "string"
              },
              "linked_contact": {
                "type": "string",
                "pattern": "^[0-9a-fA-F]{24}$"
              },
              "linked_contact_name": {
                "type": "string"
              },
              "subject": {
                "type": "object",
                "required": [
                  "entity_id",
                  "entity_type"
                ],
                "properties": {
                  "entity_id": {
                    "type": "string"
                  },
                  "entity_type": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  }
                }
              },
              "created_by_entity": {
                "type": "object",
                "required": [
                  "entity_id",
                  "entity_type"
                ],
                "properties": {
                  "entity_id": {
                    "type": "string"
                  },
                  "entity_type": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "context_id": {
                    "type": "string"
                  },
                  "context_type": {
                    "type": "string"
                  }
                }
              },
              "executing_entity": {
                "type": "object",
                "required": [
                  "entity_id",
                  "entity_type"
                ],
                "properties": {
                  "entity_id": {
                    "type": "string"
                  },
                  "entity_type": {
                    "type": "string"
                  },
                  "name": {
                    "type": "string"
                  },
                  "context_id": {
                    "type": "string"
                  },
                  "context_type": {
                    "type": "string"
                  }
                }
              },
              "linked_entities": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "entity_id": {
                      "type": "string"
                    },
                    "entity_type": {
                      "type": "string"
                    }
                  }
                }
              },
              "activity_date": {
                "type": "string",
                "format": "date-time"
              },
              "created_by": {
                "type": "string",
                "pattern": "^[0-9a-fA-F]{24}$"
              },
              "created_by_name": {
                "type": "string"
              }
            }
          },
          {
            "type": "object",
            "required": [
              "created_at",
              "updated_at"
            ],
            "properties": {
              "created_at": {
                "type": "string",
                "format": "date-time"
              },
              "updated_at": {
                "type": "string",
                "format": "date-time"
              }
            }
          }
        ]
      };

      let subjectObject = {
        entity_id: '591c3f705f6089509b3f7c78',
        entity_type: 'string',
        name: 'string'
      };

      const executingEntity = {
        entity_id: '591c3f705f6089509b3f7c78',
        entity_type: 'string',
        name: 'string',
        context_id: '591c3f705f6089509b3f7c77',
        context_type: 'string'
      };

      const createdEntity = {
        entity_id: '591c3f705f6089509b3f7c78',
        entity_type: 'string',
        name: 'string',
        context_id: '591c3f705f6089509b3f7c77',
        context_type: 'string'
      };

      /*eslint-enable*/
      api.post('/v3/activity')
        .set('Accept', 'application/json')
        .set('X-Accept-Timezone', 'Africa/Johannesburg')
        .send({
          activity_type: 'string',
          description: 'string',
          comment: 'string',
          subject: subjectObject,
          executing_entity: executingEntity,
          activity_date: '2017-07-12T10:21:44.586Z',
          created_by_entity: createdEntity,
          linked_entities: [
            {
              entity_id: '591c3f705f6089509b3f7c78',
              name: 'string',
              entity_type: 'string'
            }
          ]
        })
        .expect(201)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          expect(res.body.linked_entities.length).to.be.at.least(1);
          validator.validate(res.body, schema).should.be.true;

          expect(res.body.subject).to.be.deep.equal(subjectObject, 'The incorrect subject object was returned.');
          expect(res.body.executing_entity).to.be.deep.equal(
            executingEntity,
            'The incorrect executing entity object was returned.'
          );
          expect(res.body.created_by_entity).to.be.deep.equal(
            createdEntity,
            'The incorrect created by entity object was returned.'
          );
          done();
        });
    });

    it('should respond with 400 A validation error...', function (done) {
      /*eslint-disable*/
      var schema = {
        "allOf": [
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
                            "INVALID_TYPE",
                            "ENUM_MISMATCH",
                            "INVALID_ACTIVITY_DATE",
                            "MISSING_PROPERTY"
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

      /*eslint-enable*/
      api.post('/v3/activity')
        .set('Accept', 'application/json')
        .send({
          activity_type: 'Some Activity Type',
          description: 'Some Activity Description',
          comment: 'Some activity comment',
          activity_date: '5017-07-12T10:21:44.586Z',
          linked_entities: [
            {
              entity_id: '591c3f705f6089509b3f7c78',
              entity_type: 'string'
            }
          ]
        })
        .expect(400)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }

          validator.validate(res.body, schema).should.be.true;
          done();
        });
    });
  });

  describe('get', function () {
    let message1 = {
      activity_type: 'Astring',
      description: 'Astring',
      comment: 'Astring',
      activity_date: '2017-07-12T10:21:44.586Z',
      linked_entities: [
        {
          entity_id: '191c3f705f6089509b3f7c78',
          entity_type: 'string'
        }
      ],
      subject: {
        entity_id: '191c3f705f6089509b3f7r57',
        entity_type: 'SomeType1',
        name: 'SomeName4'
      },
      executing_entity: {
        entity_id: '191c3f705f6089509b3f7f46',
        entity_type: 'SomeType2',
        name: 'SomeName5',
        context_id: '591c3f705f6089509b3f7c77',
        context_type: 'string'
      },
      created_by_entity: {
        entity_id: '191c3f705f6089509b3fh97j',
        entity_type: 'SomeType3',
        name: 'SomeName6',
        context_id: '591c3f705f6089509b3f7c77',
        context_type: 'string'
      }
    };
    let message2 = {
      activity_type: 'Bstring',
      description: 'Bstring',
      comment: 'Bstring',
      activity_date: '2017-07-12T10:21:44.586Z',
      linked_entities: [
        {
          entity_id: '191c3f705f6089509b3f7c78',
          entity_type: 'string'
        }
      ],
      subject: {
        entity_id: '191c3f705f6089509b3f7r57',
        entity_type: 'SomeType1',
        name: 'SomeName4'
      },
      executing_entity: {
        entity_id: '191c3f705f6089509b3f7f46',
        entity_type: 'SomeType2',
        name: 'SomeName5'
      },
      created_by_entity: {
        entity_id: '191c3f705f6089509b3fh97j',
        entity_type: 'SomeType3',
        name: 'SomeName6'
      }
    };

    it('should respond with 200 List of activities', function (done) {
      /*eslint-disable*/
      var schema = {
        "type": "array",
        "items": {
          "type": "object",
          "allOf": [
            {
              "type": "object",
              "required": [
                "_id"
              ],
              "properties": {
                "_id": {
                  "type": "string"
                }
              }
            },
            {
              "type": "object",
              "required": [
                "activity_type"
              ],
              "properties": {
                "activity_type": {
                  "type": "string"
                },
                "description": {
                  "type": "string"
                },
                "comment": {
                  "type": "string"
                },
                "executing_contact": {
                  "type": "string",
                  "pattern": "^[0-9a-fA-F]{24}$"
                },
                "executing_contact_name": {
                  "type": "string"
                },
                "linked_contact": {
                  "type": "string",
                  "pattern": "^[0-9a-fA-F]{24}$"
                },
                "linked_contact_name": {
                  "type": "string"
                },
                "subject": {
                  "type": "object",
                  "required": [
                    "entity_id",
                    "entity_type"
                  ],
                  "properties": {
                    "entity_id": {
                      "type": "string"
                    },
                    "entity_type": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    }
                  }
                },
                "created_by_entity": {
                  "type": "object",
                  "required": [
                    "entity_id",
                    "entity_type"
                  ],
                  "properties": {
                    "entity_id": {
                      "type": "string"
                    },
                    "entity_type": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    },
                    "context_id": {
                      "type": "string"
                    },
                    "context_type": {
                      "type": "string"
                    }
                  }
                },
                "executing_entity": {
                  "type": "object",
                  "required": [
                    "entity_id",
                    "entity_type"
                  ],
                  "properties": {
                    "entity_id": {
                      "type": "string"
                    },
                    "entity_type": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    },
                    "context_id": {
                      "type": "string"
                    },
                    "context_type": {
                      "type": "string"
                    }
                  }
                },
                "linked_entities": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "entity_id": {
                        "type": "string"
                      },
                      "entity": {
                        "type": "string"
                      }
                    }
                  }
                },
                "activity_date": {
                  "type": "string",
                  "format": "date-time"
                },
                "created_by": {
                  "type": "string",
                  "pattern": "^[0-9a-fA-F]{24}$"
                },
                "created_by_name": {
                  "type": "string"
                }
              }
            },
            {
              "type": "object",
              "required": [
                "created_at",
                "updated_at"
              ],
              "properties": {
                "created_at": {
                  "type": "string",
                  "format": "date-time"
                },
                "updated_at": {
                  "type": "string",
                  "format": "date-time"
                }
              }
            }
          ]
        }
      };
      /*eslint-enable*/
      // Create sample data
      async.parallel(
        {
          'setup_one': function setupOne(callback) {
            api.post('/v3/activity')
              .set('Content-Type', 'application/json')
              .set('X-Accept-Timezone', 'Africa/Johannesburg')
              .set('X-Request-Id', '12345')
              .send(message1)
              .expect(201)
              .end(function (err) {
                if (err) {
                  return done(err);
                }
                callback(null, message1);
              });
          },
          'setup_two': function setupTwo(callback) {
            api.post('/v3/activity')
              .set('Content-Type', 'application/json')
              .set('X-Accept-Timezone', 'Africa/Johannesburg')
              .set('X-Request-Id', '12345')
              .send(message2)
              .expect(201)
              .end(function (err) {
                if (err) {
                  return done(err);
                }
                callback(null, message2);
              });
          }
        },
        function finalCallback() {
          /*eslint-enable*/
          api.get('/v3/activity')
            .query({'activity_type': '*string', 'sortBy': '_id'})
            .set('X-Accept-Timezone', 'Africa/Johannesburg')
            .set('Content-Type', 'application/json')
            .set('X-Request-Id', '12345')
            .expect(200)
            .end(function (err, res) {
              if (err) {
                return done(err);
              }
              validator.validate(res.body, schema).should.be.true;
              done();
            });
        }
      );
    }).timeout(5000);

    it('should respond with 200 List of activities with updated Query Param', function (done) {
      /*eslint-disable*/
      var schema = {
        "type": "array",
        "items": {
          "type": "object",
          "allOf": [
            {
              "type": "object",
              "required": [
                "_id"
              ],
              "properties": {
                "_id": {
                  "type": "string"
                }
              }
            },
            {
              "type": "object",
              "required": [
                "activity_type"
              ],
              "properties": {
                "activity_type": {
                  "type": "string"
                },
                "description": {
                  "type": "string"
                },
                "comment": {
                  "type": "string"
                },
                "executing_contact": {
                  "type": "string",
                  "pattern": "^[0-9a-fA-F]{24}$"
                },
                "executing_contact_name": {
                  "type": "string"
                },
                "linked_contact": {
                  "type": "string",
                  "pattern": "^[0-9a-fA-F]{24}$"
                },
                "linked_contact_name": {
                  "type": "string"
                },
                "subject": {
                  "type": "object",
                  "required": [
                    "entity_id",
                    "entity_type"
                  ],
                  "properties": {
                    "entity_id": {
                      "type": "string"
                    },
                    "entity_type": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    }
                  }
                },
                "created_by_entity": {
                  "type": "object",
                  "required": [
                    "entity_id",
                    "entity_type"
                  ],
                  "properties": {
                    "entity_id": {
                      "type": "string"
                    },
                    "entity_type": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    },
                    "context_id": {
                      "type": "string"
                    },
                    "context_type": {
                      "type": "string"
                    }
                  }
                },
                "executing_entity": {
                  "type": "object",
                  "required": [
                    "entity_id",
                    "entity_type"
                  ],
                  "properties": {
                    "entity_id": {
                      "type": "string"
                    },
                    "entity_type": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    },
                    "context_id": {
                      "type": "string"
                    },
                    "context_type": {
                      "type": "string"
                    }
                  }
                },
                "linked_entities": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "entity_id": {
                        "type": "string"
                      },
                      "entity": {
                        "type": "string"
                      }
                    }
                  }
                },
                "activity_date": {
                  "type": "string",
                  "format": "date-time"
                },
                "created_by": {
                  "type": "string",
                  "pattern": "^[0-9a-fA-F]{24}$"
                },
                "created_by_name": {
                  "type": "string"
                }
              }
            },
            {
              "type": "object",
              "required": [
                "created_at",
                "updated_at"
              ],
              "properties": {
                "created_at": {
                  "type": "string",
                  "format": "date-time"
                },
                "updated_at": {
                  "type": "string",
                  "format": "date-time"
                }
              }
            }
          ]
        }
      };
      /*eslint-enable*/
      const payload = {
        'executing_contact_name': 'SomeAnotherName1',
        'linked_contact_name': 'SomeAnotherName2',
        'created_by_name': 'SomeAnotherName3'
      };
      // Create sample data
      async.parallel(
        {
          'setup_one': function setupOne(callback) {
            api.post('/v3/activity')
              .set('Content-Type', 'application/json')
              .set('X-Accept-Timezone', 'Africa/Johannesburg')
              .set('X-Request-Id', '12345')
              .send(message1)
              .expect(201)
              .end(function (err) {
                if (err) {
                  return done(err);
                }
                callback(null, message1);
              });
          },
          'setup_two': function setupTwo(callback) {
            api.post('/v3/activity')
              .set('Content-Type', 'application/json')
              .set('X-Accept-Timezone', 'Africa/Johannesburg')
              .set('X-Request-Id', '12345')
              .send(message2)
              .expect(201)
              .end(function (err) {
                if (err) {
                  return done(err);
                }
                callback(null, message2);
              });
          }
        },
        function finalCallback() {
                /*eslint-enable*/
          api.get('/v3/activity')
            .query(payload)
            .set('Content-Type', 'application/json')
            .set('X-Accept-Timezone', 'Africa/Johannesburg')
            .set('X-Request-Id', '12345')
            .expect(200)
            .end(function (err, res) {
              if (err) {
                return done(err);
              }
              validator.validate(res.body, schema).should.be.true;
              done();
            });
        }
      );
    });

    it(
      'should respond with 200 List of activities with sortBy on create_by_entity_name, ' +
      'executing_entity_type, subject_name, subject_entity_type',
      function (done) {
        /*eslint-disable*/
        var schema = {
          "type": "array",
          "items": {
            "type": "object",
            "allOf": [
              {
                "type": "object",
                "required": [
                  "_id"
                ],
                "properties": {
                  "_id": {
                    "type": "string"
                  }
                }
              },
              {
                "type": "object",
                "required": [
                  "activity_type"
                ],
                "properties": {
                  "activity_type": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  },
                  "comment": {
                    "type": "string"
                  },
                  "executing_contact": {
                    "type": "string",
                    "pattern": "^[0-9a-fA-F]{24}$"
                  },
                  "executing_contact_name": {
                    "type": "string"
                  },
                  "linked_contact": {
                    "type": "string",
                    "pattern": "^[0-9a-fA-F]{24}$"
                  },
                  "linked_contact_name": {
                    "type": "string"
                  },
                  "subject": {
                    "type": "object",
                    "required": [
                      "entity_id",
                      "entity_type"
                    ],
                    "properties": {
                      "entity_id": {
                        "type": "string"
                      },
                      "entity_type": {
                        "type": "string"
                      },
                      "name": {
                        "type": "string"
                      }
                    }
                  },
                  "created_by_entity": {
                    "type": "object",
                    "required": [
                      "entity_id",
                      "entity_type"
                    ],
                    "properties": {
                      "entity_id": {
                        "type": "string"
                      },
                      "entity_type": {
                        "type": "string"
                      },
                      "name": {
                        "type": "string"
                      },
                      "context_id": {
                        "type": "string"
                      },
                      "context_type": {
                        "type": "string"
                      }
                    }
                  },
                  "executing_entity": {
                    "type": "object",
                    "required": [
                      "entity_id",
                      "entity_type"
                    ],
                    "properties": {
                      "entity_id": {
                        "type": "string"
                      },
                      "entity_type": {
                        "type": "string"
                      },
                      "name": {
                        "type": "string"
                      },
                      "context_id": {
                        "type": "string"
                      },
                      "context_type": {
                        "type": "string"
                      }
                    }
                  },
                  "linked_entities": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "entity_id": {
                          "type": "string"
                        },
                        "entity": {
                          "type": "string"
                        }
                      }
                    }
                  },
                  "activity_date": {
                    "type": "string",
                    "format": "date-time"
                  },
                  "created_by": {
                    "type": "string",
                    "pattern": "^[0-9a-fA-F]{24}$"
                  },
                  "created_by_name": {
                    "type": "string"
                  }
                }
              },
              {
                "type": "object",
                "required": [
                  "created_at",
                  "updated_at"
                ],
                "properties": {
                  "created_at": {
                    "type": "string",
                    "format": "date-time"
                  },
                  "updated_at": {
                    "type": "string",
                    "format": "date-time"
                  }
                }
              }
            ]
          }
        };
        /*eslint-enable*/
        const sortParam = {
          'sortBy': 'created_by_entity_name,executing_entity_type,subject_name,subject_entity_type'
        };
        // Create sample data
        async.parallel(
          {
            'setup_one': function setupOne(callback) {
              api.post('/v3/activity')
                .set('Content-Type', 'application/json')
                .set('X-Accept-Timezone', 'Africa/Johannesburg')
                .set('X-Request-Id', '12345')
                .send(message1)
                .expect(201)
                .end(function (err) {
                  if (err) {
                    return done(err);
                  }
                  callback(null, message1);
                });
            },
            'setup_two': function setupTwo(callback) {
              api.post('/v3/activity')
                .set('Content-Type', 'application/json')
                .set('X-Request-Id', '12345')
                .send(message2)
                .expect(201)
                .end(function (err) {
                  if (err) {
                    return done(err);
                  }
                  callback(null, message2);
                });
            }
          },
          function finalCallback() {
            /*eslint-enable*/
            api.get('/v3/activity')
              .query(sortParam)
              .set('Content-Type', 'application/json')
              .set('X-Request-Id', '12345')
              .expect(200)
              .end(function (err, res) {
                if (err) {
                  return done(err);
                }
                validator.validate(res.body, schema).should.be.true;
                done();
              });
          }
        );
      }
    ).timeout(5000);

    it('should respond with 200 List of activities and pagination', function (done) {
      /*eslint-disable*/
      var schema = {
        "type": "array",
        "items": {
          "type": "object",
          "allOf": [
            {
              "type": "object",
              "required": [
                "_id"
              ],
              "properties": {
                "_id": {
                  "type": "string"
                }
              }
            },
            {
              "type": "object",
              "required": [
                "activity_type"
              ],
              "properties": {
                "activity_type": {
                  "type": "string"
                },
                "description": {
                  "type": "string"
                },
                "comment": {
                  "type": "string"
                },
                "executing_contact": {
                  "type": "string",
                  "pattern": "^[0-9a-fA-F]{24}$"
                },
                "executing_contact_name": {
                  "type": "string"
                },
                "linked_contact": {
                  "type": "string",
                  "pattern": "^[0-9a-fA-F]{24}$"
                },
                "linked_contact_name": {
                  "type": "string"
                },
                "subject": {
                  "type": "object",
                  "required": [
                    "entity_id",
                    "entity_type"
                  ],
                  "properties": {
                    "entity_id": {
                      "type": "string"
                    },
                    "entity_type": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    }
                  }
                },
                "created_by_entity": {
                  "type": "object",
                  "required": [
                    "entity_id",
                    "entity_type"
                  ],
                  "properties": {
                    "entity_id": {
                      "type": "string"
                    },
                    "entity_type": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    },
                    "context_id": {
                      "type": "string"
                    },
                    "context_type": {
                      "type": "string"
                    }
                  }
                },
                "executing_entity": {
                  "type": "object",
                  "required": [
                    "entity_id",
                    "entity_type"
                  ],
                  "properties": {
                    "entity_id": {
                      "type": "string"
                    },
                    "entity_type": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    },
                    "context_id": {
                      "type": "string"
                    },
                    "context_type": {
                      "type": "string"
                    }
                  }
                },
                "linked_entities": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "entity_id": {
                        "type": "string"
                      },
                      "entity": {
                        "type": "string"
                      }
                    }
                  }
                },
                "activity_date": {
                  "type": "string",
                  "format": "date-time"
                },
                "created_by": {
                  "type": "string",
                  "pattern": "^[0-9a-fA-F]{24}$"
                },
                "created_by_name": {
                  "type": "string"
                }
              }
            },
            {
              "type": "object",
              "required": [
                "created_at",
                "updated_at"
              ],
              "properties": {
                "created_at": {
                  "type": "string",
                  "format": "date-time"
                },
                "updated_at": {
                  "type": "string",
                  "format": "date-time"
                }
              }
            }
          ]
        }
      };

      /*eslint-enable*/
      async.parallel(
        {
          'setup_one': function setupOne(callback) {
            api.post('/v3/activity')
              .set('Content-Type', 'application/json')
              .set('X-Request-Id', '12345')
              .send(message1)
              .expect(201)
              .end(function (err) {
                if (err) {
                  return done(err);
                }
                callback(null, message1);
              });
          },
          'setup_two': function setupTwo(callback) {
            api.post('/v3/activity')
              .set('Content-Type', 'application/json')
              .set('X-Accept-Timezone', 'Africa/Johannesburg')
              .set('X-Request-Id', '12345')
              .send(message1)
              .expect(201)
              .end(function (err) {
                if (err) {
                  return done(err);
                }
                callback(null, message1);
              });
          }
        },
        function finalCallback() {
          /*eslint-enable*/
          api.get('/v3/activity')
            .set('Content-Type', 'application/json')
            .set('X-Accept-Timezone', 'Africa/Johannesburg')
            .set('X-Request-Id', '12345')
            .query({'activity_type': 'Astring', 'sortBy': '_id', 'items_per_page': 1, 'page': 2})
            .expect(200)
            .end(function (err, res) {
              if (err) {
                return done(err);
              }
              validator.validate(res.body, schema).should.be.true;
              assert.deepEqual(
                res.body[0].activity_type,
                'Astring',
                'The incorrect activity was returned for the query'
              );
              done();
            });
        }
      );
    }).timeout(5000);

    it('should respond with 204 with no activities', function (done) {
      api.get('/v3/activity')
        .query({
          sortBy: '_id',
          activity_type: 'Xstring',
          _id: '5968b2f36dd0c4758f4acf07',
          created_by_entity_context_id: 'string',
          created_by_entity_context_type: 'string',
          executing_entity_context_id: 'string',
          executing_entity_context_type: 'string'
        })
        .set('Accept', 'application/json')
        .set('X-Accept-Timezone', 'Africa/Johannesburg')
        .expect(204)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }

          res.body.should.equal(''); // non-json response or no schema
          done();
        });
    });

    it('should respond with 405 Method not supported Error...', function (done) {
      /*eslint-disable*/
      var schema = {
        "type": "object",
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "type": "string"
          },
          "exception": {
            "type": "object"
          }
        }
      };

      /*eslint-enable*/
      api.put('/v3/activity')
        .set('Content-Type', 'application/json')
        .set('X-Accept-Timezone', 'Africa/Johannesburg')
        .set('X-Request-Id', '12345')
        .expect(405)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }

          validator.validate(res.body, schema).should.be.true;
          done();
        });
    });
  });
});
