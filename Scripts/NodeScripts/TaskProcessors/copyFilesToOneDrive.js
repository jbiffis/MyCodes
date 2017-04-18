require('../constants.js');
var fs = require('fs-extra');
var Promise = require("bluebird");
var _ = require('underscore');
var stats = require('../stats.js');
var fileUtils = require('../fileUtils.js');
var FileIndexer = require('../fileIndex.js');
const path = require('path');
const util = require('util');
var timer = require('perfy');
const logger = require('winston');

logger.level = 'debug';
var locale = "en-us";

Promise.promisifyAll(fs);

var task = {
    run: copyFilesToOneDrive
}

function copyFilesToOneDrive(options) {
    // scan over the files
    var sourceFiles, destFiles;
    timer.start('Copy Photos to OneDrive');

    var source = new FileIndexer();
    var dest = new FileIndexer();

    return new Promise.join(source.buildIndex(options.folder, false), dest.buildIndex(options.destDir, false))
        .then((result) => {
            sourceFiles = result[0];
            destFiles = result[1];

            var message = util.format("Source Files: %s, Destination Files: %s", sourceFiles.numberOfFiles(), destFiles.numberOfFiles());
            
            stats.logEvent({
                module: MODULES.PHOTO_COPY,
                operation: 'copyPhotosToOneDrive',
                event: EVENTS.COPY_STARTED,
                data: {
                    numSourceFiles: sourceFiles.numberOfFiles(),
                    numDestFiles: destFiles.numberOfFiles()
                },
                message: message
            })

            logger.silly(message);

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
                
                return true;
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
                            .then(() => {
                                destFiles.addFile(file);

                                stats.logEvent({
                                    module: MODULES.PHOTO_COPY,
                                    operation: 'copyPhotosToOneDrive',
                                    event: EVENTS.FILE_COPIED_TO_ONEDRIVE,
                                    data: {
                                        originalFile: file,
                                        destination: destPath
                                    },
                                    message: util.format("File copied from %s to %s", file._id)
                                });
                            });
                    })
                    .catch((err) => {
                        //console.log(err);
                    })
            }

        })
        .each(file => {
            var matchingFiles = destFiles.findAllWhere({name: file.name});

            if (matchingFiles.length > 0) {
                return moveToRecycleBin(file, options);
            } else {
                logger.silly("[%s] - File wasn't copied over", file._id);
            }
        })
        .finally(() => {
            var totalTime = timer.end('Copy Photos to OneDrive');
            stats.logEvent({
                module: MODULES.PHOTO_COPY,
                operation: 'copyPhotosToOneDrive',
                event: EVENTS.DONE_COPY_TO_ONEDRIVE,
                status: STATUS_CODES.SUCCESS,
                data: {
                    execTime: totalTime,
                    numDestFiles: destFiles.numberOfFiles()
                },
                message: util.format("OndeDrive photo copy is done")
            });

            // TODO: Save the stats object
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
                event: EVENTS.FILE_RECYCLED,
                data: {
                    originalFile: file
                },
                message: util.format("File moved to Recyling Bin")
            })
        })
        .catch(err => {
            stats.logEvent({
                module: MODULES.PHOTO_COPY,
                operation: 'copyPhotosToOneDrive',
                event: EVENTS.FILE_RECYCLE_FAILED,
                data: {
                    originalFile: file
                },
                message: util.format("File moved to Recyling Bin")
            })
          logger.debug("File failed copy %s to %s", file._id, recyclePath)  ;
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


module.exports = task;