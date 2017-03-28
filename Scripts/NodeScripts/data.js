var _ = require('underscore');

var data = {
    files: {}
}

data.add = function(table, object) {
    this[table][object._id] = object;
}

data.get = function(table) {
    return this[table];
}

data.sizeOfTable = function(table) {
    return _.size(this[table]);
}

module.exports = data;