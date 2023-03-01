'use strict';

const config = require('config');
const {MongoClient} = require('mongodb');
const _ = require('lodash');
const sinon = require('sinon');
const chai = require('chai');
const assert = chai.assert;
const MongoClients = require('../../../change-streams/core/MongoClients');
const {logger} = require('../../../tools/TestUtils');
const {ACTIVITIES_DB_KEY} = require('../../../change-streams/DatabaseConfigKeys');

describe('MongoClients test scenarios', function () {
  let logSpy;

  beforeEach(() => {
    logSpy = sinon.spy();
  });
  afterEach(() => {
    sinon.restore();
  });

  describe('getClient() test scenarios', function () {
    let connectStub;
    let commandSpy;
    let dbStub;
    const expectedOptions = {
      maxPoolSize: 5
    };

    beforeEach(() => {
      connectStub = sinon.stub(MongoClient.prototype, 'connect');
      commandSpy = sinon.spy((command) => {
        assert.deepEqual(command, {ping: 1}, 'Expected command was not passed');
      });
      dbStub = sinon.stub(MongoClient.prototype, 'db').callsFake((dbName) => {
        assert.equal(dbName, 'admin', 'Expected db name was not passed');
        return {
          command: commandSpy
        };
      });
    });

    /**
     * Testing simple success scenario of mongo client instance
     * (poolsize will use default value)
     *
     * @author Deon De Wet <deon.dewet@gmail.com>
     * @since  15 Sept 2022
     *
     * @covers change-streams/core/MongoClients.getClient
     */
    it('testing simple success scenario of mongo client instance', async function () {
      connectStub.resolves();

      const response = await MongoClients.getClient(logger.getLogger(logSpy), ACTIVITIES_DB_KEY);
      assert.instanceOf(response, MongoClient, 'Expected response was not returned');
      assert.equal(response.s.namespace.db, 'admin', 'Expected database name was not set');
      assert.deepEqual(
        _.pick(response.s.options, Object.keys(expectedOptions)),
        expectedOptions,
        'Expected options were not returned'
      );
      assert.equal(commandSpy.callCount, 1, 'Expected command function to be called once');
      connectStub.should.have.been.called;
      dbStub.should.have.been.called;
    });

    /**
     * Testing that the same client instance is returned for multiple calls on same key
     *
     * @author Deon De Wet <deon.dewet@gmail.com>
     * @since  15 Sept 2022
     *
     * @covers change-streams/core/MongoClients.getClient
     */
    it('Test that the same client instance is returned for multiple calls on same key', async function () {
      const response = await MongoClients.getClient(logger.getLogger(logSpy), ACTIVITIES_DB_KEY);
      const response1 = await MongoClients.getClient(logger.getLogger(logSpy), ACTIVITIES_DB_KEY);

      assert.instanceOf(response, MongoClient, 'Expected response was not returned');
      assert.deepEqual(response1, response, 'Expected response does not match');
    });

    it('Test success scenario when poolsize bigger than default', async function () {
      const expectedOptions = {
        maxPoolSize: 6
      };
      connectStub.resolves();

      // Calling registerClientConfigs different times(Since registerClientConfigs will add data to configKeys)
      // In order to not use the default we need more than 5 calls
      MongoClients.registerClientConfigs('faked');
      MongoClients.registerClientConfigs('faked');
      MongoClients.registerClientConfigs('faked');
      MongoClients.registerClientConfigs('faked');
      MongoClients.registerClientConfigs('faked');
      MongoClients.registerClientConfigs('faked');

      const response = await MongoClients.getClient(logger.getLogger(logSpy), 'faked');
      assert.instanceOf(response, MongoClient, 'Expected response was not returned');
      assert.equal(response.s.namespace.db, 'admin', 'Expected database name was not set');
      assert.deepEqual(
        _.pick(response.s.options, Object.keys(expectedOptions)),
        expectedOptions,
        'Expected options were not returned'
      );
      assert.equal(commandSpy.callCount, 1, 'Expected command function to be called once');
      connectStub.should.have.been.called;
      dbStub.should.have.been.called;
    });

    /**
     * Testing that the different client instance is returned for different keys
     *
     * @author Deon De Wet <deon.dewet@gmail.com>
     * @since  15 Sept 2022
     *
     * @covers change-streams/core/MongoClients.getClient
     */
    it('Test that the different client instance is returned for different keys', async function () {
      const response = await MongoClients.getClient(logger.getLogger(logSpy), ACTIVITIES_DB_KEY);
      const response1 = await MongoClients.getClient(logger.getLogger(logSpy), 'faked');

      assert.instanceOf(response, MongoClient, 'Expected response was not returned');
      assert.isFalse(response1 === response, 'Expected response does match');
    });

  });

  describe('getClientDatabase() test scenarios', function () {
    /**
     * Testing success scenario of mongo client database instance
     *
     * @author Deon De Wet <deon.dewet@gmail.com>
     * @since  15 Sept 2022
     *
     * @covers change-streams/core/MongoClients.getClientDatabase
     */
    it('testing simple success scenario of mongo client database instance', async function () {
      const dbConfig = config.get(`${ACTIVITIES_DB_KEY}.database_host`);
      const dbName = dbConfig.split(/[/]+/).pop();
      const client = {
        db: () => {
          return {
            databaseName: dbName
          };
        }
      };

      let getClientStub = sinon.stub(MongoClients, 'getClient').resolves(client);

      const db = await MongoClients.getClientDatabase(logger.getLogger(logSpy), ACTIVITIES_DB_KEY);
      assert.equal(db.databaseName, dbName, 'Expected database name was not set');
      getClientStub.should.have.been.calledOnce;
    });

  });

});
