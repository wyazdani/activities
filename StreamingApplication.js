'use strict';

const MongoClients = require('./change-streams/core/MongoClients');
const {ACTIVITIES_DB_KEY} = require('./change-streams/DatabaseConfigKeys');
const {ResumeTokenCollectionManager} = require('./change-streams/core/ResumeTokenCollectionManager');
const StreamingApplications = require('./change-streams');
const config = require('config');
const {StreamTracker} = require('./models');
const Logger = require('a24-logzio-winston');
const arg = require('arg');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

//setup logger
Logger.setup(config.get('logger'));
let loggerContext = Logger.getContext('ChangeStream Setup');
mongoose.connect(config.mongo.database_host, config.mongo.options);
mongoose.connection.on(
  'error',
  function mongooseConnection(error) {
    let loggerContext = Logger.getContext('startup');
    loggerContext.error('MongoDB connection error', error);
    return process.exit(1);
  }
);

const args = arg({
  '--type': String,
  '--name': String
}, {
  argv: process.argv
});
let appFound = false;

// validate and store ENV
if (!args['--type']) {
  loggerContext.error('Expected --type has not been passed');
  process.exit(1);
}
if (!args['--name']) {
  loggerContext.error('Expected --name has not been passed');
  process.exit(1);
}
const CHANGE_STREAM_TYPE = args['--type'].toLowerCase();
const STREAMING_APP_NAME = args['--name'].toLowerCase();

/**
 * Gets configured resume token manager class
 *
 * @returns {Promise<ResumeTokenCollectionManager>}
 */
async function getTokenCollectionManager() {
  const manager = new ResumeTokenCollectionManager();
  const db = await MongoClients.getClientDatabase(loggerContext, ACTIVITIES_DB_KEY);
  manager.setDatabase(db);
  manager.setCollectionName(StreamTracker.collection.collectionName);
  return manager;
}

/**
 * Starts all the watchers aka change streams that have been registered
 */
async function attachWatchers() {
  if (appFound) {
    const tokenManager = await getTokenCollectionManager();
    for (const watcher of StreamingApplications) {
      if (watcher.getStreamingAppName().toLowerCase() === STREAMING_APP_NAME) {
        await watcher.watch(CHANGE_STREAM_TYPE, loggerContext, tokenManager);
      }
    }
  }
}

// Lets register streaming application connections
for (const watcher of StreamingApplications) {

  if (watcher.getStreamingAppName().toLowerCase() === STREAMING_APP_NAME) {
    appFound = true;
    MongoClients.registerClientConfigs(watcher.getMongoClientConfigKeys(CHANGE_STREAM_TYPE));
  }
}

attachWatchers().catch((err) => {
  loggerContext.error('There was an error while attaching the watchers', err);
  process.exit(1);
});
