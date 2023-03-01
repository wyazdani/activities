'use strict';
const {assert} = require('chai');
const {renameObjectProperties, remapUpdateFields, OPERATION} = require(
  '../../../../change-streams/core/helpers/ChangeStreamUpdatesHelper'
);

describe('ChangeStreamUpdatesHelper', function () {

  describe('renameObjectProperties()', function () {
    const fieldMap = {
      external_documents: 'docs',
      external_portfolios: 'portfolios',
      external_verifications: 'verifications',
      external_days_to_expiry: 'external_days_to_expiry',
      userName: 'name'
    };
    const testData = [
      {
        description: 'Test that only mapped fields are returned',
        input: {
          external_documents: ['a'],
          external_portfolios: ['b'],
          candidate_id: '123'
        },
        output: {
          docs: ['a'],
          portfolios: ['b']
        }
      },
      {
        description: 'Test that empty object is returned if data does not contain any mapped fields',
        input: {
          userEmail: 'email@domail.com',
          candidate_id: '123'
        },
        output: {}
      },
      {
        description: 'Test that all mapped fields are returned when they are found in data',
        input: {
          external_documents: [1, 2],
          external_portfolios: [3, 4],
          external_verifications: [5, 6],
          external_days_to_expiry: [7, 8],
          userName: 'guy'
        },
        output: {
          docs: [1, 2],
          portfolios: [3, 4],
          verifications: [5, 6],
          external_days_to_expiry: [7, 8],
          name: 'guy'
        }
      }
    ];

    for (const item of testData) {
      it(item.description, function () {
        const results = renameObjectProperties(item.input, fieldMap);
        assert.deepEqual(results, item.output, 'Expected output not returned');
      });
    }
  });

  describe('remapUpdateFields()', function () {
    const fieldsConfig = [
      {
        from: '_id',
        to: '_id'
      },
      {
        from: 'sOperationId',
        to: 'operation'
      },
      {
        from: 'sNme.real',
        to: 'name'
      },
      {
        from: 'objPerm',
        to: 'perms'
      },
      {
        from: 'objPmsnVO',
        to: 'permission',
        'properties': [
          {
            'from': 'bCreate',
            'to': 'create'
          },
          {
            'from': 'bRead',
            'to': 'read'
          },
          {
            'from': 'bUpdt',
            'to': 'update'
          },
          {
            'from': 'bDlt',
            'to': 'delete'
          }
        ]
      },
      {
        from: 'first_name',
        to: 'first_name',
        plugins: ['real_low']
      },
      {
        from: 'details',
        to: 'details',
        'properties': [
          {
            'from': 'first_name',
            'to': 'first_name',
            plugins: ['real_low']
          }
        ]
      }
    ];
    const testData = [
      {
        config: fieldsConfig,
        description: 'Test that full object updates gets remapped correctly',
        operation: OPERATION.SET,
        updates: {
          sOperationId: 'new op id',
          objPmsnVO: {
            bCreate: true,
            bRead: true,
            bUpdt: false,
            bDlt: false
          }
        },
        output: {
          operation: 'new op id',
          permission: {
            create: true,
            read: true,
            update: false,
            delete: false
          }
        }
      },
      {
        config: fieldsConfig,
        description: 'Test that partial object updates gets remapped correctly',
        operation: OPERATION.SET,
        updates: {
          objPmsnVO: {
            bCreate: true,
            bDlt: false
          }
        },
        output: {
          permission: {
            create: true,
            delete: false
          }
        }
      },
      {
        config: fieldsConfig,
        description: 'Test that nested object properties used on top level remap works correctly',
        operation: OPERATION.SET,
        updates: {
          sNme: {
            real: 'some real name',
            low: 'some low name'
          }
        },
        output: {
          'name': 'some real name'
        }
      },
      {
        config: fieldsConfig,
        description: 'Test that nested object properties used on top level remap works correctly',
        operation: OPERATION.SET,
        updates: {
          'sNme.real': 'new real name'
        },
        output: {
          'name': 'new real name'
        }
      },
      {
        config: fieldsConfig,
        description: 'Test that no fields gets remapped when all fields in updated are not mapped',
        operation: OPERATION.SET,
        updates: {
          field1: 30,
          objPmsnVO: {
            bUpsert: true
          }
        },
        output: {}
      },
      {
        config: fieldsConfig,
        description: 'Test that dot notation updates get remapped correctly',
        operation: OPERATION.SET,
        updates: {
          field1: 30,
          'objPmsnVO.bUpsert': false,
          'objPmsnVO.bCreate': false,
          'objPmsnVO.bDlt': false
        },
        output: {
          'permission.create': false,
          'permission.delete': false
        }
      },
      {
        config: fieldsConfig,
        description: 'Test that dot notation unset updates get remapped correctly',
        operation: OPERATION.SET,
        updates: {
          'objPmsnVO.bUpsert': 1,
          'objPmsnVO.bCreate': 1,
          'objPmsnVO.bDlt': false
        },
        output: {
          'permission.create': 1,
          'permission.delete': false
        }
      },
      {
        config: fieldsConfig,
        description: 'Test that dot notation updates get remapped correctly when only the top level is mapped',
        operation: OPERATION.SET,
        updates: {
          field1: 30,
          'objPerm.bCreate': true,
          'objPerm.bDlt': false
        },
        output: {
          'perms.bCreate': true,
          'perms.bDlt': false
        }
      },
      {
        config: fieldsConfig,
        description: 'Test that updates get remapped correctly when only the top level is mapped',
        operation: OPERATION.SET,
        updates: {
          'objPerm': 1
        },
        output: {
          'perms': 1
        }
      },
      {
        config: fieldsConfig,
        description: 'Test the plugin for real low is applied correctly',
        operation: OPERATION.SET,
        updates: {
          first_name: 'This is first NAME'
        },
        output: {
          first_name: 'This is first NAME',
          first_name_low: 'this is first name'
        }
      },
      {
        config: fieldsConfig,
        description: 'Test the plugin for real low is applied correctly in nested objects',
        operation: OPERATION.SET,
        updates: {
          'details.first_name': 'This is first NAME'
        },
        output: {
          'details.first_name': 'This is first NAME',
          'details.first_name_low': 'this is first name'
        }
      },
      {
        config: fieldsConfig,
        description: 'Test the plugin for real low is applied correctly in nested objects when full object is passed',
        operation: OPERATION.SET,
        updates: {
          details: {first_name: 'This is first NAME'}
        },
        output: {
          details: {first_name: 'This is first NAME', first_name_low: 'this is first name'}
        }
      },
      {
        config: fieldsConfig,
        description: 'Test the plugin for real low is applied correctly when the operation is UNSET',
        operation: OPERATION.UNSET,
        updates: {
          'details.first_name': 1
        },
        output: {
          'details.first_name': 1,
          'details.first_name_low': 1
        }
      }
    ];

    for (let item of testData) {
      it(item.description, async function () {
        const results = remapUpdateFields(item.config, item.updates, item.operation);
        assert.deepEqual(results, item.output, 'Mapped fields does not match expected output');
      });
    }
    it('Test to throw error if value of real_low plugin is not string', function () {
      const config = [{
        from: 'first_name',
        to: 'first_name',
        plugins: ['real_low']
      }];
      assert.throws(() => remapUpdateFields(config, {first_name: 2}, OPERATION.SET),
        'This field should be string, but it\'s not: first_name, schema:' +
         ' {"from":"first_name","to":"first_name","plugins":["real_low"]}'
      );
    });
    it('Test to throw error unknown plugin if invalid plugin name is passed', function () {
      const config = [{
        from: 'first_name',
        to: 'first_name',
        plugins: ['unknown-random-plugin']
      }];
      assert.throws(
        () => remapUpdateFields(
          config,
          {first_name: 2},
          OPERATION.SET
        ),
        'plugin in ChangeStreamUpdateHelper not supported.plugin: unknown-random-plugin field: first_name'
      );
    });
  });
});
