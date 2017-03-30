var _ = require('underscore');

var data = function() {
    
    return {
        files: {},
        add: function(table, object) {
            this[table][object._id] = object;
        },

        get: function(table) {
            return this[table];
        },

        sizeOfTable: function(table) {
            return _.size(this[table]);
        },

        findAllWhere: function(table, params) {
            return _.where(this[table], params);
        }
    }
}


module.exports = data;