require('../constants.js');
var Promise = require("bluebird");

module.exports = function(db, logger) {

    var File = require('../models/File.js')(db, logger);

    return {
        add: function(data) {
            logger.debug("Entered Files.add() with data: %s", JSON.stringify(data));
            return Promise.try(() => {
                var file = new File(data);
                return file.save();
            });
        },

        find: function(params) {
            logger.debug("Entered Files.find() looking for Files with query: %s", JSON.stringify(params));
            return File.find(params)
                .then(data => {
                    return data;
                });
        },

        findOne: function(params) {
            logger.debug("Entered Files.findOne() looking for a file with query: %s", JSON.stringify(params));
            return File.find(params)
                .then(data => {
                    return data[0];
                });
        },
    }
};
