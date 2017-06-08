// app/models/Job.js
require('../constants.js');
var _ = require('underscore');
//var format = require('../format');
var Promise = require("bluebird");

module.exports = function(db, logger) {

  var Job = function(data) {
    logger.debug("Entered Job() with data: %s", JSON.stringify(data));

    var schema = {
        operation:      null,
        data:           null,
        dateCreated:    new Date(),
        dateCompleted:  null,
        execTime:       null
    };

    this.data = _.extend({}, schema, data);
  };

  Job.findById = function(id) {
    logger.debug("Entered Job.findById() looking for Job with id: %s", id);

    return this.find({"_id": id})
      .then(function(data) {
        if (data.length >= 1) {
          return data[0];
        }
        return;
      });
  };

  Job.findByName = function(name) {
    logger.debug("Entered Job.findByName() looking for Job with name: %s", name);

    return this.find({"name": name})
      .then(function(data) {
        if (data.length >= 1) {
          return data[0];
        }
        return;
      });
  };

  Job.find = function(query, options) {
    logger.debug("Entered Job.find() looking for Jobs with query: %s", JSON.stringify(query));

    return Promise.try(() => {
            return db.find(TABLES.JOBS, query, options);
        })
        .map(function(item) {
            return new Job(item);
        });
  };

  Job.findOne = function(query, options) {
    logger.debug("Entered Job.findOne() looking for Job with query: %s", JSON.stringify(query));

    return Promise.try(() => {
            return db.findOne(TABLES.JOBS, query, options);
        })
        .then(function(item) {
            if (item)
              return new Job(item);
            return item;
        });
  };

  Job.findNext = function() {
    logger.debug("Entered Job.findNext()");
    
    return Promise.try(() => {
      return this.findOne({dateCompleted: null},
                    {'sort': {'dateCreated': 1}}
              )
    });
  };

/*
  Job.prototype.expand = function(req) {
    var _data = JSON.parse(JSON.stringify(this.data));  

    return db.find("products",
              {"name" : {$in: this.data.products}},
              {fields : {similar_products: false}})

      .then(function() {
        return format.expand_Job(req, _data);
      });
  };
*/
  Job.prototype.save = function() {
    var self = this;
    logger.debug("Entered Job.save() save data for Job: %s", this.data);

    if (self.data._id) {
      return db.update(self.data, TABLES.JOBS)
        .then(function(result) {
          return self;
        });
    } else {
      return db.save(self.data, TABLES.JOBS)
        .then(function(result) {
          _.extend(self.data, result.ops[0]);    // Make sure the Job instance has the _id and the token.
          return self;
        });
    }
  };

  Job.prototype.getProp = function(prop) {
    logger.debug("Entered Job.getProp() property %s", prop);

    return this.data[prop];
  };

  Job.prototype.markComplete = function() {
    logger.debug("Entered Job.markComplete() ");

    this.data.dateCompleted = new Date();

    return this.save();

  }

  return Job;

};


