require('./constants.js');
var _ = require('underscore');

var stats = {
    events: [],

    logEvent: logEvent,
    getSummary: getSummary,
    searchEvents: searchEvents
}

function logEvent(event) {
    event.time = new Date();
    // TODO: Gather some system data

    this.events.push(event);
    // save to the events json file
}

function getSummary(options) {
    var summary;
    this.events.forEach((event) => {
        summary += event.message;
    });

    return summary;
}

function getAllEvents(options) {

}

function searchEvents(params) {
    return _.where(this.events, params);
}

module.exports = stats;