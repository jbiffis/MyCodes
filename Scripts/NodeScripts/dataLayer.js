require('./constants.js');
var _ = require('underscore');
var DataSet = require('./data.js');

var DataLayer =  function() {


    return {
            data: new DataSet(),

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