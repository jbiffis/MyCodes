const config = require('C:\\node\\config.js');
var files = require('../controllers/files.js');
var events = require('../controllers/events.js');
var db = new require('../dataLayer.js')();
const logger = require('winston');

var files = require('../controllers/files.js')(db, logger);

var photoInterface = {
    init: function() {
        return db.init();
    },
    
    files: files,
    events: events
}


module.exports = photoInterface;