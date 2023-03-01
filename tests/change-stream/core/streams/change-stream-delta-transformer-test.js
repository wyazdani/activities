'use strict';

const ChangeStreamDeltaTransformer = require('../../../../change-streams/core/streams/ChangeStreamDeltaTransformer');
const chai = require('chai');
const assert = chai.assert;
const {PassThrough} = require('stream');

describe('ChangeStreamDeltaTransformer test scenarios', function () {

  describe('_transform(), Test data transformation', function () {

    const data = [{
      input: {
        '_id': 'someid',
        'operationType': 'delete',
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'ns': {
          'db': {},
          'coll': {}
        }
      },
      expected: {
        '_id': 'someid',
        'operationType': 'delete',
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        }
      }
    }, {
      input: {
        '_id': 'updateid1',
        'operationType': 'update',
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'ns': {
          'db': {},
          'coll': {}
        },
        'updateDescription': {
          'updatedFields': {
            'rule': [
              {
                'rule_id': '602657813230c147a73797e5',
                'rule_output': -1
              },
              {
                'rule_id': '604f3272dbee866d4b35fecb',
                'rule_output': -1
              }
            ],
            'contract': [
              {
                'contract_id': '60126eb559f35a4f3c34ff07',
                'agency_id': '5b1a7a31e8a73a73374d3fa2',
                'contract_output': -1
              }
            ]
          },
          'removedFields': ['condition']
        },
        'fullDocument': {
          '_id': '5b1a782810f31cff52fefbc2_5ebd105ae8a73a15562550d2',
          'first_name': 'Ruta',
          'last_name': 'Zala',
          'condition': [
            {
              'condition_id': '603638006e9e79081eb3d4dd',
              'condition_output': -1,
              'condition_dump_created_date': '2021-03-03T09:34:33.945Z',
              'rule_id': '602657813230c147a73797e5'
            },
            {
              'condition_id': '604f3272dbee866d4b35fecc',
              'condition_output': -1,
              'condition_dump_created_date': '2021-03-15T12:32:23.214Z',
              'rule_id': '604f3272dbee866d4b35fecb'
            }
          ],
          'rule': [
            {
              'rule_id': '602657813230c147a73797e5',
              'rule_output': -1
            },
            {
              'rule_id': '604f3272dbee866d4b35fecb',
              'rule_output': -1
            }
          ],
          'contract': [
            {
              'contract_id': '60126eb559f35a4f3c34ff07',
              'agency_id': '5b1a7a31e8a73a73374d3fa2',
              'contract_output': -1
            }
          ],
          'created_at': new Date('2020-10-12T06:13:37.511Z'),
          'updated_at': new Date('2020-10-12T06:15:29.169Z'),
          '__v': 1
        }
      },
      expected: {
        '_id': 'updateid1',
        'operationType': 'update',
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {
          '$set': {
            'rule': [
              {
                'rule_id': '602657813230c147a73797e5',
                'rule_output': -1
              },
              {
                'rule_id': '604f3272dbee866d4b35fecb',
                'rule_output': -1
              }
            ],
            'contract': [
              {
                'contract_id': '60126eb559f35a4f3c34ff07',
                'agency_id': '5b1a7a31e8a73a73374d3fa2',
                'contract_output': -1
              }
            ]
          },
          '$unset': {
            'condition': 1
          }
        }
      }
    }, {
      input: {
        '_id': 'insertid1',
        'operationType': 'insert',
        'ns': {
          'db': {},
          'coll': {}
        },
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'fullDocument': {
          '_id': '5b1a782810f31cff52fefbc2_5ebd105ae8a73a15562550d2',
          'first_name': 'Ruta',
          'last_name': 'Zala',
          'condition': [
            {
              'condition_id': '603638006e9e79081eb3d4dd',
              'condition_output': -1,
              'condition_dump_created_date': '2021-03-03T09:34:33.945Z',
              'rule_id': '602657813230c147a73797e5'
            },
            {
              'condition_id': '604f3272dbee866d4b35fecc',
              'condition_output': -1,
              'condition_dump_created_date': '2021-03-15T12:32:23.214Z',
              'rule_id': '604f3272dbee866d4b35fecb'
            }
          ],
          'rule': [
            {
              'rule_id': '602657813230c147a73797e5',
              'rule_output': -1
            },
            {
              'rule_id': '604f3272dbee866d4b35fecb',
              'rule_output': -1
            }
          ],
          'contract': [
            {
              'contract_id': '60126eb559f35a4f3c34ff07',
              'agency_id': '5b1a7a31e8a73a73374d3fa2',
              'contract_output': -1
            }
          ],
          'created_at': new Date('2020-10-12T06:13:37.511Z'),
          'updated_at': new Date('2020-10-12T06:15:29.169Z'),
          '__v': 1
        }
      },
      expected: {
        '_id': 'insertid1',
        'operationType': 'insert',
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {
          '$set': {
            '_id': '5b1a782810f31cff52fefbc2_5ebd105ae8a73a15562550d2',
            'first_name': 'Ruta',
            'last_name': 'Zala',
            'condition': [
              {
                'condition_id': '603638006e9e79081eb3d4dd',
                'condition_output': -1,
                'condition_dump_created_date': '2021-03-03T09:34:33.945Z',
                'rule_id': '602657813230c147a73797e5'
              },
              {
                'condition_id': '604f3272dbee866d4b35fecc',
                'condition_output': -1,
                'condition_dump_created_date': '2021-03-15T12:32:23.214Z',
                'rule_id': '604f3272dbee866d4b35fecb'
              }
            ],
            'rule': [
              {
                'rule_id': '602657813230c147a73797e5',
                'rule_output': -1
              },
              {
                'rule_id': '604f3272dbee866d4b35fecb',
                'rule_output': -1
              }
            ],
            'contract': [
              {
                'contract_id': '60126eb559f35a4f3c34ff07',
                'agency_id': '5b1a7a31e8a73a73374d3fa2',
                'contract_output': -1
              }
            ],
            'created_at': new Date('2020-10-12T06:13:37.511Z'),
            'updated_at': new Date('2020-10-12T06:15:29.169Z'),
            '__v': 1
          }
        }
      }
    }, {
      input: {
        '_id': 'replaceid1',
        'operationType': 'replace',
        'ns': {
          'db': {},
          'coll': {}
        },
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'fullDocument': {
          '_id': '5b1a782810f31cff52fefbc2_5ebd105ae8a73a15562550d2',
          'first_name': 'Ruta',
          'last_name': 'Zala',
          'condition': [
            {
              'condition_id': '603638006e9e79081eb3d4dd',
              'condition_output': -1,
              'condition_dump_created_date': '2021-03-03T09:34:33.945Z',
              'rule_id': '602657813230c147a73797e5'
            },
            {
              'condition_id': '604f3272dbee866d4b35fecc',
              'condition_output': -1,
              'condition_dump_created_date': '2021-03-15T12:32:23.214Z',
              'rule_id': '604f3272dbee866d4b35fecb'
            }
          ],
          'rule': [
            {
              'rule_id': '602657813230c147a73797e5',
              'rule_output': -1
            },
            {
              'rule_id': '604f3272dbee866d4b35fecb',
              'rule_output': -1
            }
          ],
          'contract': [
            {
              'contract_id': '60126eb559f35a4f3c34ff07',
              'agency_id': '5b1a7a31e8a73a73374d3fa2',
              'contract_output': -1
            }
          ],
          'created_at': new Date('2020-10-12T06:13:37.511Z'),
          'updated_at': new Date('2020-10-12T06:15:29.169Z'),
          '__v': 1
        }
      },
      expected: {
        '_id': 'replaceid1',
        'operationType': 'replace',
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {
          '$set': {
            '_id': '5b1a782810f31cff52fefbc2_5ebd105ae8a73a15562550d2',
            'first_name': 'Ruta',
            'last_name': 'Zala',
            'condition': [
              {
                'condition_id': '603638006e9e79081eb3d4dd',
                'condition_output': -1,
                'condition_dump_created_date': '2021-03-03T09:34:33.945Z',
                'rule_id': '602657813230c147a73797e5'
              },
              {
                'condition_id': '604f3272dbee866d4b35fecc',
                'condition_output': -1,
                'condition_dump_created_date': '2021-03-15T12:32:23.214Z',
                'rule_id': '604f3272dbee866d4b35fecb'
              }
            ],
            'rule': [
              {
                'rule_id': '602657813230c147a73797e5',
                'rule_output': -1
              },
              {
                'rule_id': '604f3272dbee866d4b35fecb',
                'rule_output': -1
              }
            ],
            'contract': [
              {
                'contract_id': '60126eb559f35a4f3c34ff07',
                'agency_id': '5b1a7a31e8a73a73374d3fa2',
                'contract_output': -1
              }
            ],
            'created_at': new Date('2020-10-12T06:13:37.511Z'),
            'updated_at': new Date('2020-10-12T06:15:29.169Z'),
            '__v': 1
          }
        }
      }
    }, {
      input: {
        '_id': 'seed1',
        'operationType': 'seed',
        'ns': {
          'db': {},
          'coll': {}
        },
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {
          '$set': {
            'condition': [
              {
                'condition_id': '603638006e9e79081eb3d4dd',
                'condition_output': -1,
                'condition_dump_created_date': '2021-03-03T09:34:33.945Z',
                'rule_id': '602657813230c147a73797e5'
              },
              {
                'condition_id': '604f3272dbee866d4b35fecc',
                'condition_output': -1,
                'condition_dump_created_date': '2021-03-15T12:32:23.214Z',
                'rule_id': '604f3272dbee866d4b35fecb'
              }
            ],
            'rule': [
              {
                'rule_id': '602657813230c147a73797e5',
                'rule_output': -1
              },
              {
                'rule_id': '604f3272dbee866d4b35fecb',
                'rule_output': -1
              }
            ],
            'contract': [
              {
                'contract_id': '60126eb559f35a4f3c34ff07',
                'agency_id': '5b1a7a31e8a73a73374d3fa2',
                'contract_output': -1
              }
            ]
          }
        }
      },
      expected: {
        '_id': 'seed1',
        'operationType': 'seed',
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {
          '$set': {}
        }
      }
    }, {
      input: {
        '_id': 'someid1',
        'operationType': 'someOperation',
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'ns': {
          'db': {},
          'coll': {}
        },
        'updateDescription': {
          'updatedFields': {
            'rule': [
              {
                'rule_id': '602657813230c147a73797e5',
                'rule_output': -1
              },
              {
                'rule_id': '604f3272dbee866d4b35fecb',
                'rule_output': -1
              }
            ],
            'contract': [
              {
                'contract_id': '60126eb559f35a4f3c34ff07',
                'agency_id': '5b1a7a31e8a73a73374d3fa2',
                'contract_output': -1
              }
            ]
          },
          'removedFields': ['condition']
        },
        'fullDocument': {
          '_id': '5b1a782810f31cff52fefbc2_5ebd105ae8a73a15562550d2',
          'first_name': 'Ruta',
          'last_name': 'Zala',
          'condition': [
            {
              'condition_id': '603638006e9e79081eb3d4dd',
              'condition_output': -1,
              'condition_dump_created_date': '2021-03-03T09:34:33.945Z',
              'rule_id': '602657813230c147a73797e5'
            },
            {
              'condition_id': '604f3272dbee866d4b35fecc',
              'condition_output': -1,
              'condition_dump_created_date': '2021-03-15T12:32:23.214Z',
              'rule_id': '604f3272dbee866d4b35fecb'
            }
          ],
          'rule': [
            {
              'rule_id': '602657813230c147a73797e5',
              'rule_output': -1
            },
            {
              'rule_id': '604f3272dbee866d4b35fecb',
              'rule_output': -1
            }
          ],
          'contract': [
            {
              'contract_id': '60126eb559f35a4f3c34ff07',
              'agency_id': '5b1a7a31e8a73a73374d3fa2',
              'contract_output': -1
            }
          ],
          'created_at': new Date('2020-10-12T06:13:37.511Z'),
          'updated_at': new Date('2020-10-12T06:15:29.169Z'),
          '__v': 1
        }
      },
      expected: {
        '_id': 'someid1',
        'operationType': 'someOperation',
        'documentKey': {
          '_id': '5b1828280000000000000122_5cde528175d044146dde2279'
        },
        'updates': {
          '$set': {},
          '$unset': {}
        }
      }
    }];

    /**
     * Test transformation of all the operations.
     *
     * @author Ruta Zala <rzdevloper@gmail.com>
     * @since  16 April 2021
     *
     * @covers change-streams/core/stream/ChangeStreamDeltaTransformer._transform
     * @covers change-streams/core/stream/ChangeStreamDeltaTransformer.getSetFields
     * @covers change-streams/core/stream/ChangeStreamDeltaTransformer.getUnsetFields
     *
     */
    it('testing simple success transformations', function (done) {

      const options = {
        objectMode: true,
        highWaterMark: 2,
        version: '3.6.3'
      };
      const inputStream = new PassThrough(options);
      const outputStream = new PassThrough(options);
      const transformStream = new ChangeStreamDeltaTransformer(options);
      inputStream.pipe(transformStream).pipe(outputStream);
      let outputCount = 0;

      outputStream.on('data', (outputStreamData) => {
        assert.deepEqual(
          outputStreamData,
          data[outputCount].expected,
          'output stream output problem, on index: ' + outputCount
        );
        outputCount++;
      });

      outputStream.on('end', () => {
        assert.equal(outputCount, data.length, 'Expected to loop over all expected output');
        done();
      });

      data.forEach((object) => {
        inputStream.write(object.input);
      });

      inputStream.end();

    });

  });
});
