'use strict';
var chai = require('chai');
var ZSchema = require('z-schema');
var validator = new ZSchema({});
var supertest = require('supertest');
var api = supertest('http://localhost:3100'); // supertest init;

chai.should();

describe('/activity/{id}', function () {
  describe('get', function () {
    let payload = {
      activity_type: 'Astring',
      description: 'Astring',
      comment: 'Astring',
      activity_date: '2017-07-12T10:21:44.586Z',
      linked_entities: [
        {
          entity_id: '191c3f705f6089509b3f7c78',
          entity_type: 'string'
        }
      ]
    };

    it('should respond with 200 The retrieved activity', function (done) {
      /*eslint-disable*/
      var schema = {
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
      };

      /*eslint-enable*/
      api.post('/v3/activity')
        .set('Content-Type', 'application/json')
        .set('X-Accept-Timezone', 'Africa/Johannesburg')
        .set('X-Request-Id', '12345')
        .send(payload)
        .expect(201)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }

          api.get('/v3/activity/'+res.body._id)
            .set('Accept', 'application/json')
            .set('X-Accept-Timezone', 'Africa/Johannesburg')
            .expect(200)
            .end(function (err, res) {
              if (err) {
                return done(err);
              }
              validator.validate(res.body, schema).should.be.true;
              done();
            });
        });
    }).timeout(5000);

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
                            "PATTERN"
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
      api.get('/v3/activity/SOME_ID_THAT_WILL_FAIL')
        .set('Accept', 'application/json')
        .set('X-Accept-Timezone', 'Africa/Johannesburg')
        .expect(400)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }

          validator.validate(res.body, schema).should.be.true;
          done();
        });
    });

    it('should respond with 404 No resource found for ID', function (done) {
      /*eslint-disable*/
      var schema = {
        "type": "object",
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "type": "string"
          }
        }
      };

      /*eslint-enable*/
      api.get('/v3/activity/111112222233333444445555')
        .set('Accept', 'application/json')
        .set('X-Accept-Timezone', 'Africa/Johannesburg')
        .expect(404)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }

          validator.validate(res.body, schema).should.be.true;
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
      api.options('/v3/activity/58e77e4bd442bb548dea7398')
        .set('Accept', 'application/json')
        .set('X-Accept-Timezone', 'Africa/Johannesburg')
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
