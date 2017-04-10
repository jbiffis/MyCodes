require('./constants.js');
var fs = require('fs-extra');
var Promise = require("bluebird");
var _ = require('underscore');
var transcoder = require('./transcoder.js');
//var email = require('./mailer.js');
var stats = require('./stats.js');
var fileUtils = require('./fileUtils.js');
var FileIndexer = require('./fileIndex.js');
const path = require('path');
const util = require('util');
var timer = require('perfy');
const logger = require('winston');
logger.level = 'silly';
var logFile = 'log.log';
var locale = "en-us";

logger.add(logger.transports.File, { filename: logFile, prettyPrint: true });

Promise.promisifyAll(fs);

var hockeyVideos = function(options) {
    // For each folder, get a list of all the input files and send them off to the transcoder   
    this.gamesToTranscode = {};
    var directory = options.folder;

    return fs.readdirAsync(directory)
        .filter((file) => {
            var filepath = path.join(directory, file);
            return fs.statSync(filepath).isDirectory();
        })
        .map((gameFolder) => {
            var gameFolderPath = path.join(directory, gameFolder);
            var gameFilePath = path.join(gameFolderPath, gameFolder);
            // By this point our game file path will be E:\a\b\game\game.mp4

            this.gamesToTranscode[gameFilePath] = new Array();

            return fs.readdirAsync(gameFolderPath)
                .map((filename) =>  {
                    var filepath = gameFolderPath + '\\' + filename;
                    this.gamesToTranscode[gameFilePath].push(filepath);
                });
        })
        .then(() => {
            var transcodeJobs = [];

            _.each(this.gamesToTranscode, function(clips, gameName)  {
                clips.sort();

                var transcodeJob = {
                    clips: clips,
                    destFilename: gameName,
                    status: STATUS_CODES.READY
                };

                transcodeJobs.push(transcodeJob);
            });

            return transcodeJobs;
        })
        .mapSeries(function(job) {
            return transcoder.transcodeMulti(job.clips, job.destFilename)
                .then((result) => {
                    // send the info to the stats thing.
                    stats.logEvent({
                        module: MODULES.HOCKEY_VIDEOS,
                        operation: 'combineGameFiles',
                        message: util.format("Combined %d files into %s. (%d seconds)", job.clips.length, job.destFilename, result.timeElapsed),
                        execTime: result.timeElapsed
                    })
                    job.status = STATUS_CODES.COMPLETED;
                })
                .catch((error) => {
                    job.status = STATUS_CODES.ERROR;
                    job.statusMessage = error.message;
                    logger.error("Problem with Transcode")
                });
        })
        .then(() => {
            var summary = stats.getSummary();

            //email.send('jeremy@biffis.com', 'ottawa@biffis.com', 'Server Task Report', summary);
        });
        
        
}

var copyPhotosToOneDrive = function(options) {
    // scan over the files
    var sourceFiles, destFiles;

    var source = new FileIndexer();
    var dest = new FileIndexer();

    return new Promise.join(source.buildIndex(options.folder, false), dest.buildIndex(options.destDir, false))
        .then((result) => {
            sourceFiles = result[0];
            destFiles = result[1];

            logger.silly("Source Files: %s, Destination Files: %s", sourceFiles.numberOfFiles(), destFiles.numberOfFiles());

            return sourceFiles.getFiles();
        })
        .each((file) => {           
            var matchingFiles = destFiles.findAllWhere({name: file.name});

            if (matchingFiles.length > 0) {
                stats.logEvent({
                    module: MODULES.PHOTO_COPY,
                    operation: 'copyPhotosToOneDrive',
                    event: EVENTS.DUPLICATE_FILE,
                    data: {
                        originalFile: file,
                        matchedFiles: matchingFiles
                    },
                    message: util.format("File [%s] already exists in destination", file._id),
                    execTime: null
                })
                logger.silly("[%s] - File already in destination %d times", file._id, matchingFiles.length);
                
                return moveToRecycleBin(file, options)
            } else {
                return file.addExifData()
                    .then(file => {
                        var destSubPath = getSubPath(file);
                        var destPath = path.join(options.destDir, destSubPath, file.name);

                        logger.silly("[%s] - File copying to [%s]", file._id, destPath);

                        if(options.safeMode) {
                            throw new Error("Safe Mode enabled");
                        }

                        // TODO: Eventually this should be a move.
                        return fs.copyAsync(file._id, destPath, {preserveTimestamps: true})
                    })
                    .then(() => {
                        destFiles.addFile(file);

                        stats.logEvent({
                            module: MODULES.PHOTO_COPY,
                            operation: 'copyPhotosToOneDrive',
                            result: EVENTS.FILE_COPIED_TO_ONEDRIVE,
                            data: {
                                originalFile: file,
                                destination: destPath
                            },
                            message: util.format("File copied from %s to %s", file._id),
                            execTime: null
                        })
                    })
                    .catch((err) => {
                        //console.log(err);
                    });
            }

        })
        .each(file => {
            var matchingFiles = destFiles.findAllWhere({name: file.name});

            if (matchingFiles.length > 0) {
                return moveToRecycleBin(file, options);
            } else {
                logger.silly("[%s] - File wasn't copied over", file._id);
            }
        });
}

var moveToRecycleBin = function(file, options) {
    if (options.safeMode) {
        return false;
    }

    var recyclePath = path.join(options.recycleBin, file.name);

    return fs.renameAsync(file._id, recyclePath)
        .then(() => {
            stats.logEvent({
                module: MODULES.PHOTO_COPY,
                operation: 'copyPhotosToOneDrive',
                result: EVENTS.FILE_RECYCLED,
                data: {
                    originalFile: file
                },
                message: util.format("File moved to Recyling Bin"),
                execTime: null
            })
        });
}

var getSubPath = function(file) {
    var dateCreated = fileUtils.getDateCreated(file);
    
    if (dateCreated === null) {
        stats.logEvent({
            module: MODULES.PHOTO_COPY,
            operation: 'copyPhotosToOneDrive',
            event: EVENTS.UNKNOWN_DATE,
            data: {
                originalFile: file
            },
            message: util.format("Could not figure out date for file: [%s]", file._id)
        });
        return "undated";
    }

    var year = dateCreated.getFullYear().toString();
    var month = ("0" + (dateCreated.getMonth() + 1)).slice(-2) + ' - ' + dateCreated.toLocaleString(locale, { month: "long" });

    return path.join(year, month); 
}


var scanOneDriveForDuplicates = function() {

}


var tasks2 = [
    {
        'folder' : "E:\\tmp",
        //"folder": "\\\\Mediabox\\m\\Videos\\Aylmer Express\\To Be Transcoded",
        "action": hockeyVideos
    }
]

var liveSet = [
    /*{
        "action"  :   hockeyVideos,
        "options" : {
            "folder" : "M:\\Videos\\Aylmer Express\\To Be Transcoded"
        }
    },*/ {
        "action"  :   copyPhotosToOneDrive,
        "options" : {
            "folder"    :  "M:\\Temp Photo Landing Zone",
            "destDir"   :  "M:\\OneDrive\\Pictures",
            "safeMode"  :   true    // Don't actually copy files
        }
    }
]

var testSet1 = [
    {
        "action"  :   copyPhotosToOneDrive,
        "options" : {
            "folder"    :  "E:\\TestSrc\\DifferentTypes",
            //"folder"    :  "E:\\TestSrc",
            "destDir"   :  "E:\\TestDest\\Photos",
            "recycleBin":   "E:\\RecycleBin",
            "safeMode"  :   true    // Don't actually copy files
        }
    }
]

testSet1.forEach((task) => {
    task.action(task.options)
        .then(() => {
            logger.debug("Done");
            var logText = fs.readFileSync(logFile);
            //email.send('jeremy@biffis.com', 'ottawa@biffis.com', 'Script finished running', logText, logText);
        });
});