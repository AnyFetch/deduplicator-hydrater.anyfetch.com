'use strict';

require('should');

var Anyfetch = require('anyfetch');
var hydratingFunction = require('../lib');

describe('Test deduplicator hydrater', function() {
  it('should start without error', function(done) {
    var config = require("../config/configuration.js");
    var server = require('../app.js');

    // Start the server
    server.listen(config.port, function() {
      console.log("Server listening on " + server.url);
      server.close(done);
    });
  });

  var server = null;
  before(function(done) {
    server = Anyfetch.createMockServer();
    server.listen(1337, function() {
      console.log('Server listen on port 1337');
      done();
    });
  });

  it('should works', function(done) {
    var docs = [
      {
        id: '4af9f23d8ead0e1d32000001',
        identifier: 'doc1-identifier',
        hash: 'a5e744d0164540d33b1d7ea616c28f2fa97e754a',
        metadata: {
          foo: 'bar'
        }
      },
      {
        id: '4af9f23d8ead0e1d32000002',
        identifier: 'doc2-identifier',
        hash: 'a5e744d0164540d33b1d7ea616c28f2fa97e754a',
        metadata: {
          foo: 'bar'
        }
      },
      {
        id: '4af9f23d8ead0e1d32000003',
        identifier: 'doc3-identifier',
        metadata: {
          foo: 'bar'
        }
      }
    ];

    var deleted = [];

    server.override('get', '/documents', function(req, res, next) {
      res.send({
        data: docs.filter(function(doc) {
          return doc.hash === req.params.hash;
        }),
      });

      return next;
    });

    server.override('delete', '/documents/:id', function(req, res, next) {
      deleted.push(req.params.id);
      res.send(204);
      return next;
    });

    var changes = {};
    var endHydrating = function(err, changes) {
      server.restore();
      
      changes.should.have.property('hash', 'a5e744d0164540d33b1d7ea616c28f2fa97e754a');
      deleted.should.have.lengthOf(2);
      done(err);
    };

    endHydrating.apiUrl = 'http://localhost:1337';

    hydratingFunction('', docs[2], changes, endHydrating);
  });
});
