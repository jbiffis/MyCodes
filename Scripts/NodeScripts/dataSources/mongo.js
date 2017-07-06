// app/data.js
require('../constants.js');
var _ = require('underscore');
var MongoDB = require("mongodb");
var MongoClient = MongoDB.MongoClient;
ObjectId = MongoDB.ObjectID;
var Promise = require("bluebird");
const logger = require('winston');

Promise.promisifyAll(MongoDB);
Promise.promisifyAll(MongoClient);
Promise.promisifyAll(MongoDB.Cursor.prototype);

var db;

module.exports = {

    init: function() {
      logger.debug("Entering db.init()");

      return MongoClient.connectAsync(CONFIG.server.database)
        .then(function(result) {
          logger.debug("db.init() - Connected to database");

          db = result;
        }).error(function(err) {
          logger.error("Could not connect to database [%s]", err.msg);
        });
    },

    findOne: function(col, query, opts) {
      logger.debug("Entering db.findOne() in collection %s with query %s", col, JSON.stringify(query), JSON.stringify(opts));

      var options = opts || {};
      return db.collection(col)
        .findOneAsync(query, options);
    },

    find: function(col, query, opts) {
      logger.debug("Entering db.find() in collection %s with query %s, %s", col, JSON.stringify(query), JSON.stringify(opts));

      var options = opts || {};
      return db.collection(col)
              .find(query, options.fields || {})
              .sort(options.sort || {})
              .toArrayAsync();
    },

    add: function(col, doc) {
      logger.debug("Entering db.save() with collection %s with doc %s", col, JSON.stringify(doc));

      return db.collection(col)
        .insertAsync(doc);
    },

    update: function(col, query, doc) {
      logger.debug("Entering db.update() with collection %s with query %s", col, JSON.stringify(query));

      return db.collection(col)
        .findOneAndUpdateAsync(
          query,
          doc,
          {'upsert': true, 'returnNewDocument': true}
        );
    },

    removeDocuments: function(col, query) {
      logger.debug("Entering db.removeDocuments() with collection %s with query %s", col, JSON.stringify(query));

      return db.collection(col)
        .removeAsync(
          query
        );
    },

    count: function(col, query) {
      logger.debug("Entering db.count() in collection %s with query %s", col, JSON.stringify(query));

      return db.collection(col).countAsync(query);
    }
  };
