require('../constants.js');
var Promise = require("bluebird");

module.exports = function(db, logger) {

    var Event = require('../models/Event.js')(db, logger);

    return {
        add: function(data) {
            return Promise.try(() => {
                event = new Event(data);
                return event.save();
            });
        },

        getEvents: function(params) {
            return Promise.try(() => {
                return Event.find(params);
            });
        }
    }
};
