require('../constants.js');
var Promise = require("bluebird");
var _ = require('underscore');
var stats = require('../stats.js');
var fs = require('fs');
var fileUtils = require('../fileUtils.js');
var Recursive = require('../scanner.js');
var parallelLimit = require('run-parallel-limit')
const path = require('path');
const util = require('util');
var timer = require('perfy');
const logger = require('winston');

Promise.promisifyAll(fs);

var task = function(photosAPI, jobId) {
    return {
        run: function copyFilesToOneDrive(options) {

        timer.start('Copy Photos to OneDrive');

        return new Promise(function(resolve, reject) {
            if (!fs.existsSync(options.folder)) {
                logger.error("Folder [%s] does not exist motherfucker", options.folder);
                throw new Error("Source dir does not exist");
            }

            if (!fs.existsSync(options.destDir)) {
                logger.error("Folder [%s] does not exist motherfucker", options.destDir);
                throw new Error("Dest dir does not exist");
            }

            var recursive = new Recursive();
            
            recursive.readdir(options.folder, function (err, collection) {
                // Files is an array of filename
                var message = util.format("Source Files: %s", collection.length);
                    
                stats.logEvent({
                    module: MODULES.PHOTO_COPY,
                    operation: 'copyPhotosToOneDrive',
                    event: EVENTS.COPY_STARTED,
                    data: {
                        numSourceFiles: collection.length,
                        jobId: jobId
                    },
                    message: message
                })

                logger.silly(message);
                
                return new Promise.each(collection, file => {
                    return fileUtils.getDateCreated(file.path, {created: file.created, modified: file.modified, accessed: file.accessed})
                    .then(dateCreated => {
                        file.dateCreated = dateCreated;
                        
                        var subpath = getSubPath(file);
                        newPath = path.join(options.destDir, subpath, file.name);

                        if (fs.existsSync(newPath)) {
                            stats.logEvent({
                                module: MODULES.PHOTO_COPY,
                                operation: 'copyPhotosToOneDrive',
                                event: EVENTS.DUPLICATE_FILE,
                                data: {
                                    originalFile: file,
                                    jobId: jobId
                                },
                                message: util.format("File [%s] already exists in destination", file.name),
                                execTime: null
                            })
                            logger.silly("[%s] - File already in destination", file.name);
                            
                            return moveToRecycleBin(file, options);
                        }

                        if(options.safeMode) {
                            return true;
                        }

                        return fileUtils.copyFile(file.path, newPath);
                    })
                    .then(() => {
                        stats.logEvent({
                            module: MODULES.PHOTO_COPY,
                            operation: 'copyPhotosToOneDrive',
                            event: EVENTS.FILE_COPIED_TO_ONEDRIVE,
                            data: {
                                originalFile: file,
                                destination: options.destDir,
                                jobId: jobId
                            }
                        });
                    });
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
                            jobId: jobId
                        },
                        message: util.format("OndeDrive photo copy is done")
                    })
                    resolve();
                })
                .catch(err => {
                    console.log(err);
                    reject();
                });
            
            })
            
        })
        }
    }
}

var moveToRecycleBin = function(file, options) {
    if (options.safeMode) {
        return false;
    }

    var recyclePath = path.join(options.recycleBin, file.name);

    return fs.renameAsync(file.path, recyclePath)
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
                message: util.format("Failed to move to Recyling Bin")
            })
          logger.debug("File failed copy %s to %s", file._id, recyclePath)  ;
        });
}

var getSubPath = function(file) {    
    if (file.dateCreated === null) {
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

    var year = file.dateCreated.getFullYear().toString();
    var month = ("0" + (file.dateCreated.getMonth() + 1)).slice(-2) + ' - ' + file.dateCreated.toLocaleString("en-CA", { month: "long" });

    return path.join(year, month); 
}



module.exports = task;