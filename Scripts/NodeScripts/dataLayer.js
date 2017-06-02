require('./constants.js');
var _ = require('underscore');
//var DataSet = require('./data.js');
//var DataSet = require('./dataSources/loki.js');
var DataSet = require('./dataSources/mongo.js');

var DataLayer =  function() {


    return {
            data: DataSet,

            init: function() {
                return this.data.init();
            },

            save: function(item, collection) {
                return this.data.add(collection, item);
            },

            update: function(item, collection) {
                return this.data.update(collection, {"_id": item._id}, item);
            },

            delete: function(item, collection) {

            },

            find: function(collection, query) {
                return this.data.find(collection, query);
            },

            findOne: function(collection, query) {
                return this.data.findOne(collection, query);
            },

            // TODO Deprecate these

            addFile: function(file) {
                this.data.add(TABLES.FILES, file);
            },

            removeFile: function(file) {

            },

            getFiles : function() {
                var arr = [];
                _.forEach(this.data.get(TABLES.FILES), function(obj) {
                    arr.push(obj);
                });
                return arr;
            },

            numberOfFiles: function() {
                return this.data.sizeOfTable(TABLES.FILES);
            },

            findAllWhere: function(params) {
                return this.data.findAllWhere(TABLES.FILES, params);
            }
        }
}

module.exports = DataLayer;