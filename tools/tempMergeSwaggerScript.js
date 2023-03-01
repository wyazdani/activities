'use strict';

const jsyaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const a24SwaggerTools = require('a24-swagger-tools');
const a24AdvancedQueryUtil = require('a24-node-advanced-query-utils');

// eslint-disable-next-line
const spec = fs.readFileSync(path.join(__dirname, '../api/swagger.yaml'), 'utf8');
const swaggerDoc = jsyaml.safeLoad(spec);

// eslint-disable-next-line
const baseSpec = fs.readFileSync(a24AdvancedQueryUtil.temp_fix_swagger_api_path);
const baseSwaggerDoc = jsyaml.safeLoad(baseSpec);
const finalSwaggerDoc = a24SwaggerTools.mergeSwaggerFiles([baseSwaggerDoc, swaggerDoc]);
// eslint-disable-next-line
fs.writeFileSync(path.join(__dirname, 'finalSwaggerDocs.yaml'), jsyaml.safeDump(finalSwaggerDoc));