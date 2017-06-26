require('./constants.js');
var _ = require('underscore');
var photosAPI = require('./interfaces/photoJSON.js');

var stats = {
    logEvent: logEvent,
    searchEvents: searchEvents
}

function logEvent(event) {
    event.time = new Date();
    // TODO: Gather some system data

    return photosAPI.events.add(event);
    // save to the events json file
}


function getAllEvents(options) {

}

function searchEvents(params) {
    return photosAPI.events.getEvents(params);
}

module.exports = stats;