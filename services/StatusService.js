'use strict';

class StatusService {

  constructor(logger) {
    this.logger = logger;
  }

  getSystemStatus(swaggerParams, res) {
    let example = {
      up_time: Math.floor(process.uptime())
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(example));

  }

  // NEW GENERATOR FUNCTIONS LOCATION
}

module.exports = StatusService;
