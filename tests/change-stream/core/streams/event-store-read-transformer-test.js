'use strict';

const EventStoreReadTransformer = require('../../../../change-streams/core/streams/EventStoreReadTransformer');
const chai = require('chai');
const assert = chai.assert;
const {PassThrough} = require('stream');

describe('EventStoreReadTransformer test scenarios', function () {

  describe('_transform(), Test data transformation', function () {
    const data = [{
      input: {
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
        'created_at': '2020-10-12T06:13:37.511Z',
        'updated_at': '2020-10-12T06:15:29.169Z',
        '__v': 1
      },
      expected: {
        operationType: 'SEED',
        seed_meta: {
          event_id: '5b1a782810f31cff52fefbc2_5ebd105ae8a73a15562550d2',
          actioned_at: '2020-10-12T06:13:37.511Z'
        },
        event: {
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
          'created_at': '2020-10-12T06:13:37.511Z',
          'updated_at': '2020-10-12T06:15:29.169Z',
          '__v': 1
        }
      }
    }];

    it('testing simple success transformations', function (done) {

      const options = {
        objectMode: true,
        highWaterMark: 2
      };
      const inputStream = new PassThrough(options);
      const outputStream = new PassThrough(options);
      const transformStream = new EventStoreReadTransformer(options);
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
