require('../constants.js');
var Promise = require("bluebird");

module.exports = function(db, logger) {

    var Job = require('../models/Job.js')(db, logger);

    return {
        add: function(data) {
            return Promise.try(() => {
                job = new Job(data);
                return job.save();
            });
        },

        getJobs: function(params) {
            return Promise.try(() => {
                return Job.find(params);
            });
        },

        getNextJob: function() {
            return Promise.try(() => {
                return Job.findNext()
            });
        },

        markComplete: function(params) {
            return Promise.try(() => {
                return Job.markComplete(params);
            });
        }
    }
};
