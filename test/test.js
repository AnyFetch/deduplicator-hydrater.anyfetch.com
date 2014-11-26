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
      server.close(function(err) {
        console.log("DEBUG");
        done(err);
      });
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

  after(function(done) {
    server.close(done);
  });

  var docs = [
    {
      id: '4af9f23d8ead0e1d32000001',
      identifier: 'doc1-identifier',
      hash: 'a5e744d0164540d33b1d7ea616c28f2fa97e754a',
      metadata: {
        foo: 'bar'
      },
      modification_date: "2014-11-06T10:05:15.969Z"
    },
    {
      id: '4af9f23d8ead0e1d32000002',
      identifier: 'doc2-identifier',
      hash: 'a5e744d0164540d33b1d7ea616c28f2fa97e754a',
      metadata: {
        foo: 'bar'
      },
      modification_date: "2014-11-07T10:05:15.969Z"
    },
    {
      id: '4af9f23d8ead0e1d32000003',
      identifier: 'doc3-identifier',
      hash: 'a5e744d0164540d33b1d7ea616c28f2fa97e754a',
      metadata: {
        foo: 'bar'
      },
      modification_date: "2014-11-08T10:05:15.969Z"
    }
  ];

  var deleted = [];

  before(function mockServer(done) {
    server.override('get', '/documents', function(req, res, next) {
      res.send({
        data: docs.filter(function(doc) {
          return doc.hash === req.params['@hash'];
        }),
      });

      return next;
    });

    server.override('delete', '/documents/:id', function(req, res, next) {
      deleted.push(req.params.id);
      res.send(204);
      return next;
    });

    done();
  });

  it('should work and update hash', function(done) {
    var changes = {};
    var endHydrating = function(err, changes) {
      changes.metadata.should.have.property('hash', 'a5e744d0164540d33b1d7ea616c28f2fa97e754a');
      deleted.should.have.lengthOf(2);

      deleted.should.containEql(docs[0].id);
      deleted.should.containEql(docs[1].id);

      done(err);
    };

    endHydrating.apiUrl = 'http://localhost:1337';

    hydratingFunction('', docs[2], changes, endHydrating);
  });

  it('should work and keep recent document', function(done) {
    deleted = [];
    docs[2].modification_date = "2014-11-05T10:05:15.969Z";

    var changes = {};
    var endHydrating = function(err, changes) {
      if(changes !== null) {
        return done(new Error("Changes should be null"));
      }

      deleted.should.have.lengthOf(2);

      deleted.should.containEql(docs[0].id);
      deleted.should.containEql(docs[2].id);

      done(err);
    };

    endHydrating.apiUrl = 'http://localhost:1337';

    hydratingFunction('', docs[2], changes, endHydrating);
  });
});
