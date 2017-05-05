var _ = require('underscore');
var loki = require('lokijs');

var db = new loki('photodb.json', {persistenceMethod:'fs', autoload: true, autosave: true, autoloadCallback: loadHandler});
var dbReady = false;
var collections = {};

function loadHandler() {
    var files = db.getCollection('files');
    if (!files) {
        files = db.addCollection('files');
    }

    collections.files = files;
    dbReady = true;
}

var data = {
        loadHandler: loadHandler,
        add: function(table, object) {
            if (!dbReady) return false;
            collections.files.insert(object);
        },

        get: function(table) {
            return collections[table].find();
        },

        sizeOfTable: function(table) {
            return collections[table].count();
        },

        findAllWhere: function(table, params) {
            //return _.where(this[table], params);
        }
}

module.exports = data;