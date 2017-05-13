var _ = require('underscore');
var loki = require('lokijs');
var Promise = require("bluebird");

var db = null;
var dbReady = false;
var collections = {};

function dbInit() {
    return new Promise((resolve, reject) => {
        
        function loadHandler() {
            var files = db.getCollection('files');
            if (!files) {
                files = db.addCollection('files');
            }

            collections.files = files;

            // DB is ready to go
            dbReady = true;
            resolve();
        }

        db = new loki('photodb.json', {persistenceMethod:'fs', autoload: true, autosave: true, autoloadCallback: loadHandler});
    });
}



var data = {
        init: dbInit,
        add: function(table, object) {
            if (!dbReady) return false;
            return Promise.try(() => {
                collections[table].insert(object);
            });
        },

        get: function(table) {
            return collections[table].find();
        },

        update: function(table, object) {
            if (!dbReady) return false;
            return Promise.try(() => {
                collections[table].update(object);
            });
        },

        sizeOfTable: function(table) {
            return collections[table].count();
        },

        findAllWhere: function(table, params) {
            if (!dbReady) return false;
            return collections[table].find(params);
        },

        findOne: function(table, params) {
            return collections[table].findOne(params);
        }
}

module.exports = data;