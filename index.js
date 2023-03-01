'use strict';

const app = require('connect')();
const http = require('http');
const swaggerTools = require('swagger-tools');
const jsyaml = require('js-yaml');
const fs = require('fs');
const config = require('config');
const {ErrorHandler} = require('a24-node-error-utils');
const Logger = require('a24-logzio-winston');
const _ = require('lodash');
const serverPort = (config.has('server.port')) ? config.get('server.port') : 3100;
const mongoose = require('mongoose');
const a24SwaggerTools = require('a24-swagger-tools');
const a24AdvancedQueryUtil = require('a24-node-advanced-query-utils');

mongoose.Promise = global.Promise;
const {mongooseTimezone, timezoneMiddleware} = require('a24-node-timezone-utils');
mongoose.plugin(mongooseTimezone);

Logger.setup(config.logger);

// swaggerRouter configuration
const options = {
  swaggerUi: '/swagger.json',
  controllers: './controllers',
  useStubs: process.env.NODE_ENV === 'development' // Conditionally turn on stubs (mock mode)
};

const errorHandlerConfig = {
  client_errors: config.get('client_errors')
};

mongoose.connect(config.mongo.database_host, config.mongo.options);
mongoose.connection.on(
  'error',
  function mongooseConnection(error) {
    let loggerContext = Logger.getContext('startup');
    loggerContext.crit('MongoDB connection error', error);
    process.exit(1);
  }
);

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
// eslint-disable-next-line no-sync
const spec = fs.readFileSync('./api/swagger.yaml', 'utf8');
const swaggerDoc = jsyaml.safeLoad(spec);

// eslint-disable-next-line no-sync
const baseSpec = fs.readFileSync(a24AdvancedQueryUtil.swagger_api_path);
const baseSwaggerDoc = jsyaml.safeLoad(baseSpec);
const finalSwaggerDoc = a24SwaggerTools.mergeSwaggerFiles([baseSwaggerDoc, swaggerDoc]);

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(finalSwaggerDoc, function middleWareFunc(middleware) {

  app.use(function initUse(req, res, next) {
    let loggerContext = null;
    if (!_.isEmpty(req.headers) && !_.isEmpty(req.headers['x-request-id'])) {
      loggerContext = Logger.getContext(req.headers['x-request-id']);
    } else {
      loggerContext = Logger.getContext();
    }
    // Strip off the query params to keep log message to minimum
    let hookLocation = req.url.indexOf('?');
    let logMessage = req.method + ' request started for: ';
    logMessage += (hookLocation == -1) ? req.url : req.url.substring(0, hookLocation);

    loggerContext.info(logMessage, {
      method: req.method,
      url: req.url
    });
    req.Logger = loggerContext;
    next();
  });

  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  // Timezone serialization middleware
  app.use(timezoneMiddleware());

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi(config.get('swagger_ui_config')));

  app.use(function errorHandler(err, req, res, next) {
    ErrorHandler.onError(err, req, res, next, errorHandlerConfig);
  });

  // Start the server
  http.createServer(app).listen(serverPort, function createFunc() {
    // eslint-disable-next-line no-console
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    // eslint-disable-next-line no-console
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
  });
});
