require('./constants.js');
var data = require('./data.js');

var DataLayer =  {

    addFile: function(file) {
        data.add(TABLES.FILES, file);
    },

    removeFile: function(file) {

    },

    getFiles : function() {
        return data.get(TABLES.FILES);
    },

    numberOfFiles: function() {
        return data.sizeOfTable(TABLES.FILES);
    }
}

module.exports = DataLayer;