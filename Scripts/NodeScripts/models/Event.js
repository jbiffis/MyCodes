// app/models/Event.js
require('../constants.js');
var _ = require('underscore');
//var format = require('../format');
var Promise = require("bluebird");

module.exports = function(db, logger) {

  var Event = function(data) {
    logger.debug("Entered Event() with data: %s", JSON.stringify(data));

    var schema = {
        module:         null,
        operation:      null,
        event:          null,
        data:           null,
        message:        null,
        eventTime:      new Date(),
        execTime:       null
    };

    this.data = _.extend({}, schema, data);
  };

  Event.findById = function(id) {
    logger.debug("Entered Event.findById() looking for Event with id: %s", id);

    return this.find({"_id": id})
      .then(function(data) {
        if (data.length >= 1) {
          return data[0];
        }
        return;
      });
  };

  Event.findByName = function(name) {
    logger.debug("Entered Event.findByName() looking for Event with name: %s", name);

    return this.find({"name": name})
      .then(function(data) {
        if (data.length >= 1) {
          return data[0];
        }
        return;
      });
  };

  Event.find = function(query) {
    logger.debug("Entered Event.find() looking for Events with query: %s", JSON.stringify(query));

    return Promise.try(() => {
            return db.find(TABLES.EVENTS, query);
        })
        .map(function(item) {
            return new Event(item);
        });
  };

/*
  Event.prototype.expand = function(req) {
    var _data = JSON.parse(JSON.stringify(this.data));  

    return db.find("products",
              {"name" : {$in: this.data.products}},
              {fields : {similar_products: false}})

      .then(function() {
        return format.expand_Event(req, _data);
      });
  };
*/
  Event.prototype.save = function() {
    var self = this;
    logger.debug("Entered Event.save() save data for Event: %s", this.data._id || this.data.path);

    if (self.data._id) {
      return db.update(self.data, TABLES.EVENTS)
        .then(function(result) {
          return self;
        });
    } else {
      return db.save(self.data, TABLES.EVENTS)
        .then(function(result) {
          _.extend(self.data, result.ops[0]);    // Make sure the Event instance has the _id and the token.
          return self;
        });
    }
  };

  Event.prototype.getProp = function(prop) {
    logger.debug("Entered Event.getProp() property %s", prop);

    return this.data[prop];
  };

  return Event;

};


