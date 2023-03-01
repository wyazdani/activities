'use strict';

const chai = require('chai');
const sinon = require('sinon');
const assert = chai.assert;
const {PassThrough} = require('stream');
const EnrichmentReadWrite = require('../../../../change-streams/core/streams/EnrichmentReadWrite');
const {UPDATE, INSERT, SEED, DELETE, SYNC, REPLACE} = require('../../../../enums/ChangeStreamEvents');
const {logger} = require('../../../../tools/TestUtils');

describe('EnrichmentReadWrite test scenarios', function () {
  let logSpy;
  beforeEach(() => {
    logSpy = sinon.spy();
  });
  afterEach(() => {
    sinon.restore();
    logSpy = null;
  });

  describe('_write(), Test data write', function () {
    it('testing error scenario when error occurs while updateOne', function (done) {
      const inputData = {
        'operationType': 'insert',
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {
          '$set': {
            'first_name': 'Ruta',
            'last_name': 'Zala',
            '__v': 2
          },
          '$unset': {
            'full_name': 1
          }
        }
      };
      const expectedOutputData = {
        'operationType': 'insert',
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {
          '$set': {
            'first_name': 'Ruta',
            'last_name': 'Zala',
            '__v': 2
          },
          '$unset': {
            'full_name': 1
          }
        }
      };
      const error = {error: 'some error'};
      const expectedQuery = {_id: inputData.documentKey._id};
      const updateOne = sinon.fake((query, data, callback) => {
        assert.deepEqual(query, expectedQuery, 'Incorrect update query passed');
        assert.deepEqual(data, expectedOutputData.updates, 'Incorrect update data was passed');
        return callback(error);
      });
      const options = {
        objectMode: true,
        highWaterMark: 2,
        version: '3.6.3',
        collection: {
          updateOne
        },
        pipeline: 'advanced_search_agency_group_candidate_asagc_seed',
        logger: logger.getLogger(logSpy)
      };

      const inputStream = new PassThrough(options);
      const outputStream = new PassThrough(options);
      const readWriteStream = new EnrichmentReadWrite(options);
      inputStream.pipe(readWriteStream).pipe(outputStream);

      readWriteStream.on('error', (err) => {
        assert.deepEqual(err, error, 'Expected error was not returned');
        updateOne.should.have.been.calledOnce;
        done();
      });

      inputStream.write(inputData);
      inputStream.end();

    });

    it('testing scenario when both $set and $unset are not set while update', function (done) {
      const inputData = {
        'operationType': 'insert',
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {}
      };
      const expectedOutputData = {
        'operationType': 'insert',
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {}
      };
      const updateOne = sinon.fake();
      const options = {
        objectMode: true,
        highWaterMark: 2,
        version: '3.6.3',
        collection: {updateOne},
        pipeline: 'advanced_search_agency_group_candidate_asagc_seed',
        logger: logger.getLogger(logSpy)
      };

      const inputStream = new PassThrough(options);
      const outputStream = new PassThrough(options);
      const readWriteStream = new EnrichmentReadWrite(options);
      inputStream.pipe(readWriteStream).pipe(outputStream);
      let outputCount = 0;

      outputStream.on('data', (data) => {
        assert.deepEqual(
          data,
          expectedOutputData,
          'output stream output problem'
        );
        outputCount++;
      });

      outputStream.on('end', () => {
        updateOne.should.have.not.been.called;
        assert.equal(outputCount, 1, 'Expected to output stream to be called at least once');
        done();
      });

      inputStream.write(inputData);
      inputStream.end();

    });

    it('Test when matchCount is 0', function (done) {
      const inputData = {
        'operationType': INSERT,
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {
          '$set': {
            'first_name': 'Ruta',
            'last_name': 'Zala',
            '__v': 2
          }
        }
      };
      const expectedOutputData = {
        'operationType': INSERT,
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {
          '$set': {
            'first_name': 'Ruta',
            'last_name': 'Zala',
            '__v': 2
          }
        }
      };
      const expectedQuery = {_id: inputData.documentKey._id};
      const updateOne = sinon.fake((query, data, callback) => {
        assert.deepEqual(query, expectedQuery, 'Incorrect update query passed');
        assert.deepEqual(data, expectedOutputData.updates, 'Incorrect update data was passed');
        return callback(null, {n: 1, nModified: 0, ok: 1, matchedCount: 0});
      });
      const options = {
        objectMode: true,
        highWaterMark: 2,
        version: '3.6.3',
        collection: {updateOne},
        pipeline: 'advanced_search_agency_group_candidate_asagc_seed',
        logger: logger.getLogger(logSpy)
      };

      const inputStream = new PassThrough(options);
      const outputStream = new PassThrough(options);
      const readWriteStream = new EnrichmentReadWrite(options);
      inputStream.pipe(readWriteStream).pipe(outputStream);
      readWriteStream.on('error', (err) => {
        assert.instanceOf(err, Error, 'Expected error to be instance of Error');
        assert.equal(
          err.message,
          'Expected update does not exist, id: 5b1828280000000000000122_5cde528175d044146dde2279\n' +
          '              pipeline: advanced_search_agency_group_candidate_asagc_seed original operation: insert'
        );
        updateOne.should.have.been.calledOnce;
        done();
      });
      inputStream.write(inputData);
      inputStream.end();

    });

    it('testing success scenario when $set is empty object', function (done) {
      const inputData = {
        'operationType': INSERT,
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {
          '$set': {},
          '$unset': {
            hi: 'ok'
          }
        }
      };
      const expectedOutputData = {
        'operationType': INSERT,
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {
          '$unset': {
            hi: 'ok'
          }
        }
      };
      const expectedQuery = {_id: inputData.documentKey._id};
      const updateOne = sinon.fake((query, data, callback) => {
        assert.deepEqual(query, expectedQuery, 'Incorrect update query passed');
        assert.deepEqual(data, expectedOutputData.updates, 'Incorrect update data was passed');
        return callback(null, {n: 1, nModified: 0, ok: 1, matchedCount: 1});
      });
      const options = {
        objectMode: true,
        highWaterMark: 2,
        version: '3.6.3',
        collection: {updateOne},
        pipeline: 'advanced_search_agency_group_candidate_asagc_seed',
        logger: logger.getLogger(logSpy)
      };

      const inputStream = new PassThrough(options);
      const outputStream = new PassThrough(options);
      const readWriteStream = new EnrichmentReadWrite(options);
      inputStream.pipe(readWriteStream).pipe(outputStream);
      let outputCount = 0;

      outputStream.on('data', (data) => {
        assert.deepEqual(
          data,
          expectedOutputData,
          'output stream output problem'
        );
        outputCount++;
      });

      outputStream.on('end', () => {
        updateOne.should.have.been.calledOnce;
        assert.equal(outputCount, 1, 'Expected to output stream to be called at least once');
        done();
      });

      inputStream.write(inputData);
      inputStream.end();

    });

    it('testing success scenario when $unset is empty object', function (done) {
      const inputData = {
        'operationType': INSERT,
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {
          '$unset': {},
          '$set': {
            hi: 'ok'
          }
        }
      };
      const expectedOutputData = {
        'operationType': INSERT,
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {
          '$set': {
            hi: 'ok'
          }
        }
      };
      const expectedQuery = {_id: inputData.documentKey._id};
      const updateOne = sinon.fake((query, data, callback) => {
        assert.deepEqual(query, expectedQuery, 'Incorrect update query passed');
        assert.deepEqual(data, expectedOutputData.updates, 'Incorrect update data was passed');
        return callback(null, {n: 1, nModified: 0, ok: 1, matchedCount: 1});
      });
      const options = {
        objectMode: true,
        highWaterMark: 2,
        version: '3.6.3',
        collection: {updateOne},
        pipeline: 'advanced_search_agency_group_candidate_asagc_seed',
        logger: logger.getLogger(logSpy)
      };

      const inputStream = new PassThrough(options);
      const outputStream = new PassThrough(options);
      const readWriteStream = new EnrichmentReadWrite(options);
      inputStream.pipe(readWriteStream).pipe(outputStream);
      let outputCount = 0;

      outputStream.on('data', (data) => {
        assert.deepEqual(
          data,
          expectedOutputData,
          'output stream output problem'
        );
        outputCount++;
      });

      outputStream.on('end', () => {
        updateOne.should.have.been.calledOnce;
        assert.equal(outputCount, 1, 'Expected to output stream to be called at least once');
        done();
      });

      inputStream.write(inputData);
      inputStream.end();

    });

    for (const operation of [UPDATE, INSERT, SEED, DELETE, SYNC, REPLACE]) {
      it(`testing ${operation} success scenario`, function (done) {
        const inputData = {
          'operationType': operation,
          'documentKey': {
            '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
          },
          'updates': {
            '$set': {
              'first_name': 'Ruta',
              'last_name': 'Zala',
              '__v': 2
            }
          }
        };
        const expectedOutputData = {
          'operationType': operation,
          'documentKey': {
            '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
          },
          'updates': {
            '$set': {
              'first_name': 'Ruta',
              'last_name': 'Zala',
              '__v': 2
            }
          }
        };
        const expectedQuery = {_id: inputData.documentKey._id};
        const updateOne = sinon.fake((query, data, callback) => {
          assert.deepEqual(query, expectedQuery, 'Incorrect update query passed');
          assert.deepEqual(data, expectedOutputData.updates, 'Incorrect update data was passed');
          return callback(null, {n: 1, nModified: 0, ok: 1, matchedCount: 1});
        });
        const options = {
          objectMode: true,
          highWaterMark: 2,
          version: '3.6.3',
          collection: {updateOne},
          pipeline: 'advanced_search_agency_group_candidate_asagc_seed',
          logger: logger.getLogger(logSpy)
        };

        const inputStream = new PassThrough(options);
        const outputStream = new PassThrough(options);
        const readWriteStream = new EnrichmentReadWrite(options);
        inputStream.pipe(readWriteStream).pipe(outputStream);
        let outputCount = 0;

        outputStream.on('data', (data) => {
          assert.deepEqual(
            data,
            expectedOutputData,
            'output stream output problem'
          );
          outputCount++;
        });

        outputStream.on('end', () => {
          updateOne.should.have.been.calledOnce;
          assert.equal(outputCount, 1, 'Expected to output stream to be called at least once');
          done();
        });

        inputStream.write(inputData);
        inputStream.end();

      });
    }
  });
});
