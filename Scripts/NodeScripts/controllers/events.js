require('../constants.js');

module.exports = function(db, logger) {

    var Event = require('../models/Event.js')(db, logger);

    return {
        add: function(Event) {
            return Promise.try(() => {
                var Event = new Event(Event);
                return Event.save();
            });
        },

        getEvents: function(params) {
            return Promise.try(() => {
                return Event.find(params);
                //this.data.find(TABLES.EventS, params)
            });
        }
    }
};
