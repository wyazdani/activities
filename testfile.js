'use strict';

const A24NodeTestUtils = require('a24nodetestutils');
const MBService = A24NodeTestUtils.MbService;
const Mocha = require('mocha');
const fs = require('fs');
const _ = require('lodash');
/*eslint-disable*/
const app = require('./');
/*eslint-enable*/
const config = require('config');
const mbService = new MBService(config);
const asyncLib = require('async');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.should();

const excludedEnv = ['beta', 'production', 'sandbox', 'default'];
if (process.env.NODE_ENV === undefined || excludedEnv.indexOf(process.env.NODE_ENV) !== -1) {
  // eslint-disable-next-line no-console
  console.log('Cannot run test cases from environment ' + process.env.NODE_ENV);
  return process.exit(1);
}

var options = {
  'reporter': config.mocha.reporter
};

// Instantiate a Mocha instance.
var mocha = new Mocha(options);
var testDir = './tests/';
// List of directories that will run at the end
var excludedDir = ['endpoint'];
// To run only specific unit tests add your class here in as
// 'handlers/amqp/message-notification-handler-test.js'
var customDir = [
];

// Add excluded directories that need to run last
var addEndPointTests = function addEndpoints(callback) {
  asyncLib.each(excludedDir, (file, callback) => {
    readTestDir(testDir + file + '/');
    callback();
  }, () => {
    return callback();
  });
};

var runner = null;

// Execute all tests added to mocha runlist
var runMocha = function runMocha() {
  runner = mocha.run(function run(failures) {
    process.on('exit', function onExit() {
      process.exit(failures);  // exit with non-zero status if there were failures
    });
  });
  // Listen to the end event to kill the current process
  runner.on('end', function endProcess() {
    process.exit(0);
  });
};

// Load the files into mocha run list if the file ends with JS
// This means the test directories can only have test and NO code files
var loadFiles = function loadTestFiles(file, path) {
  // eslint-disable-next-line no-sync
  var pathStat = fs.statSync(path);
  if (pathStat && pathStat.isDirectory() && excludedDir.indexOf(file) === -1) {
    // If current file is actually a dir we call readTestDir. This will make the function
    // recursive until the last tier
    readTestDir(path + '/');
  } else if (file.substr(-3) === '.js') {
    mocha.addFile(path);
  }
};

// Read all files/dirs recursively from the specified testing directory
var readTestDir = function readTestDirectory(path) {
  // Project is still small so can do it synchronous
  // eslint-disable-next-line no-sync
  fs.readdirSync(path).forEach(
    function forEach(file) {
      loadFiles(file, path +  file);
    }
  );
};

if (_.isEmpty(customDir) || customDir.length === 0) {
  // Read all files/dirs recursively from the specified testing directory
  readTestDir(testDir);
  // Adding exclusions(end point are part of this as we need time for the node server to start). Exclusion dirs
  // will be added to run last
  addEndPointTests(function addEndPointTests() {
    // Execute the mocha tests
    runMocha();
  });
} else {
  mbService.isRunning(function isRunning() {});
  // Allow devs to run only specific unit test classes
  customDir.forEach(
    function forEach(path) {
      loadFiles(path, testDir + path);
    }
  );
  // Execute the mocha tests
  runMocha();
}
