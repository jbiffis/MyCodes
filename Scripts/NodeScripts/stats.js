

var stats = {
    events: [],

    logEvent: logEvent,
    getSummary: getSummary
}

function logEvent(event) {
    event.time = new Date();

    this.events.push(event);
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

module.exports = stats;