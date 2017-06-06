// app/models/File.js
require('../constants.js');
var _ = require('underscore');
//var format = require('../format');
var Promise = require("bluebird");

module.exports = function(db, logger) {

  var File = function(data) {
    logger.debug("Entered File() with data: %s", JSON.stringify(data));

    var schema = {
        path:         null,
        name:         null,
        size:         null,
        type:         null,
        created:      null,
        accessed:     null,
        modified:     null
    };

    this.data = _.extend({}, schema, data);
  };

  File.findById = function(id) {
    logger.debug("Entered File.findById() looking for File with id: %s", id);

    return this.find({"_id": id})
      .then(function(data) {
        if (data.length >= 1) {
          return data[0];
        }
        return;
      });
  };

  File.findByName = function(name) {
    logger.debug("Entered File.findByName() looking for File with name: %s", name);

    return this.find({"name": name})
      .then(function(data) {
        if (data.length >= 1) {
          return data[0];
        }
        return;
      });
  };

  File.find = function(query) {
    logger.debug("Entered File.find() looking for Files with query: %s", JSON.stringify(query));

    return Promise.try(() => {
            return db.find(TABLES.FILES, query);
        })
        .map(function(item) {
            return new File(item);
        });
  };

/*
  // Returns a full JSON representation of the object, including all
  // Sub Products and formats the image urls.
  // Needs a reference to the request to pass along to format.
  File.prototype.expand = function(req) {
    var _data = JSON.parse(JSON.stringify(this.data));  // Works fine for simple data types.

    return db.find("products",
              {"name" : {$in: this.data.products}},
              {fields : {similar_products: false}})

      .then(function(products) {
        _data.products = products.map(function(product) {
          return format.expand_product(req, product);
        });
      })

      .then(function() {
        return format.expand_File(req, _data);
      });
  };
*/
  File.prototype.save = function() {
    var self = this;
    logger.debug("Entered File.save() save data for File: %s", this.data._id || this.data.path);

    // Operations before saving
    this.setType();

    if (self.data._id) {
      return db.update(self.data, TABLES.FILES)
        .then(function(result) {
          return self;
        });
    } else {
      return db.save(self.data, TABLES.FILES)
        .then(function(result) {
          _.extend(self.data, result.ops[0]);    // Make sure the file instance has the _id and the token.
          return self;
        });
    }
  };

  File.prototype.updateFileData = function() {

  };

  File.prototype.setType = function() {
    var extension = this.data.path.split('.');
    extension = extension[extension.length-1].toLowerCase();


    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'heif':
        this.data.type = FILE_TYPES.IMAGE;
        break;
      case 'avi':
      case 'mpeg':
      case 'mkv':
      case 'mov':
      case '3gp':
      case 'h264':
        this.data.type = FILE_TYPES.VIDEO;
        break;  
    }
  }

  File.prototype.moveTo = function(dest) {

  };

  File.prototype.copyTo = function(dest) {

  };

  File.prototype.getProp = function(prop) {
    logger.debug("Entered File.getProp() property %s", prop);

    return this.data[prop];
  };

  return File;

};


