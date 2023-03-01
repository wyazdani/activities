'use strict';
var chai = require('chai');
var ZSchema = require('z-schema');
var validator = new ZSchema({});
var supertest = require('supertest');
var api = supertest('http://localhost:3100'); // supertest init;

chai.should();

describe('/status', function () {
  describe('get', function () {
    it('should respond with 200 The server status will be...', function (done) {
      /*eslint-disable*/
      var schema = {
        "type": "object",
        "required": [
          "up_time"
        ],
        "properties": {
          "up_time": {
            "type": "integer"
          }
        }
      };

      /*eslint-enable*/
      api.get('/v3/status')
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) {return done(err);}

          validator.validate(res.body, schema).should.be.true;
          done();
        });
    });

  });

});
