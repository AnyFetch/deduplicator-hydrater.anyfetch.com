'use strict';

var async = require('async');
var crypto = require('crypto');
var Anyfetch = require('anyfetch');

/**
 * HYDRATING FUNCTION
 *
 * @param {string} path Path of the specified file
 * @param {string} original document
 * @param {object} changes object provided by anyFetch's API. Update this object to send document's modification to anyFetch's API.
 * @param {function} cb Callback, first parameter is the error if any, then the processed data
 */
module.exports = function(path, document, changes, cb) {
  var anyfetch = new Anyfetch(document.access_token);
  anyfetch.setApiUrl(cb.apiUrl);

  async.waterfall([
    function generateHash(cb) {
      var shasum = crypto.createHash('sha1');
      shasum.update(JSON.stringify(document.metadata));
      cb(null, shasum.digest('hex'));
    },
    function getDocumentsWithSameHash(hash, cb) {
      changes.hash = hash;

      anyfetch.getDocuments({hash: hash}, cb);
    },
    function deleteOldDocuments(res, cb) {
      var documents = res.body.data;

      async.each(documents, function(deletedDocument, cb) {
        if (deletedDocument.id !== document.id) {
          console.log("DELETE", deletedDocument.identifier);
          anyfetch.deleteDocumentById(deletedDocument.id, cb);
        }
      }, cb);
    }
  ], function(err) {
    cb(err, changes);
  });
};
