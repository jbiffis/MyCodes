require('./constants.js');
var fs = require('fs-extra');
var Promise = require("bluebird");
var _ = require('underscore');
var transcoder = require('./transcoder.js');
var email = require('./mailer.js');
var stats = require('./stats.js');
var fileUtils = require('./fileUtils.js');
var FileIndexer = require('./fileIndex.js');
var photosAPI = require('./interfaces/photoJSON.js');
const path = require('path');
const util = require('util');
var timer = require('perfy');
const logger = require('winston');
logger.level = 'debug';
var logFile = 'log.log';
var locale = "en-us";

logger.add(logger.transports.File, { filename: logFile, prettyPrint: true });

var prepareEmail = function(stats)  {
    var startEvent = stats.searchEvents({
                        module: MODULES.PHOTO_COPY,
                        operation: 'copyPhotosToOneDrive',
                        event: EVENTS.COPY_STARTED
                    })[0];
    var numSourceFiles = startEvent.data.numSourceFiles;
    var numDuplicates = stats.searchEvents({
                        module: MODULES.PHOTO_COPY,
                        operation: 'copyPhotosToOneDrive',
                        event: EVENTS.DUPLICATE_FILE
                    });
    var numCopied = stats.searchEvents({
                        module: MODULES.PHOTO_COPY,
                        operation: 'copyPhotosToOneDrive',
                        event: EVENTS.FILE_COPIED_TO_ONEDRIVE
                    });
    var numRecycled = stats.searchEvents({
                        module: MODULES.PHOTO_COPY,
                        operation: 'copyPhotosToOneDrive',
                        event: EVENTS.FILE_RECYCLED
                    });
    var numUndated = stats.searchEvents({
                        module: MODULES.PHOTO_COPY,
                        operation: 'copyPhotosToOneDrive',
                        event: EVENTS.UNKNOWN_DATE
                    });
    var endEvent = stats.searchEvents({
                        module: MODULES.PHOTO_COPY,
                        operation: 'copyPhotosToOneDrive',
                        event: EVENTS.DONE_COPY_TO_ONEDRIVE
                    })[0];
    var totalTime = endEvent.data.execTime.time;

    var string = "Completed adding new files to onedrive: \n%d Source files. \n%d duplicate files, %d copied to OneDrive, %d moved to Recycling Bin, %d have an Unknown Date \nOperation took %d seconds";
    var message = util.format(string, numSourceFiles, numDuplicates.length, numCopied.length, numRecycled.length, numUndated.length, totalTime);
    
    logger.debug(message);
    return message;
}

var liveSet = [
    /*{
        "action"  :   hockeyVideos,
        "options" : {
            "folder" : "M:\\Videos\\Aylmer Express\\To Be Transcoded"
        }
    },*/ {
        "operation"  :   TASK_PROCESSORS.COPY_TO_ONEDRIVE,
        "data" : {
            "folder"    :  "M:\\Temp Photo Landing Zone",
            "destDir"   :  "M:\\OneDrive\\Pictures\\Photos",
            "recycleBin":   "M:\\RecycleBin",
            "safeMode"  :   false    // Don't actually copy files
        }
    }
]

var dev = [
    {
        "operation"  :   TASK_PROCESSORS.COPY_TO_ONEDRIVE,
        "data" : {
            "folder"    :  "E:\\TestSrc",
            "destDir"   :  "E:\\TestDest",
            "recycleBin":   "E:\\RecycleBin",
            "safeMode"  :   false    // Don't actually copy files
        }
    }
]
photosAPI.init()
.then(() => {
    photosAPI.jobs.add(dev)
})

/*
testSet1.forEach(queuedTask => {
    var taskProcessor = require('./TaskProcessors/'+queuedTask.task+'.js')
    return taskProcessor.run(queuedTask.options)
        .then(() => {
            logger.debug("Done");
            var logText = fs.readFileSync(logFile);
            var emailMessage = prepareEmail(stats);
            email.send('jeremy@biffis.com', 'ottawa@biffis.com', 'Script finished running', emailMessage, emailMessage);
            //process.exit();
        });
});
*/