require('../constants.js');
var Promise = require("bluebird");

module.exports = function(db, logger) {

    var File = require('../models/File.js')(db, logger);

    return {
        add: function(data) {
            return Promise.try(() => {
                var file = new File(data);
                return file.save();
            });
        },

        find: function(params) {
            return Promise.try(() => {
                return File.find(params);
                //this.data.find(TABLES.FILES, params)
            });
        },

        findOne: function(params) {
            return Promise.try(() => {
                return File.find(params)[0];
            });
        },
    }
};
