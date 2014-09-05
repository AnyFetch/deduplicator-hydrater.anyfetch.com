'use strict';

require('should');

describe('Test starting', function() {
  it('should start without error', function(done) {
    var config = require("../config/configuration.js");
    var server = require('../app.js');

    // Start the server
    server.listen(config.port, function() {
      console.log("Server listening on " + server.url);
      server.close(done);
    });
  });
});
