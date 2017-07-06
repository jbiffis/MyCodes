require('../constants.js');

var Promise = require("bluebird");
var Recursive = require('../scanner.js');
const logger = require('winston');
var fs = require('fs');
var timer = require('perfy');


//logger.level = "debug";

var missingFromDB = [];
var missingFromFS = [];
var totalFoundFilesize = 0;
var filesFound = [];

var doubleCheck = true;

var task = function(photosAPI, jobId) {
    return {
        run: function (options) {
            return Promise.try(function() {
                if (options.otherFolders.length <= 0) {
                    throw new Error("No other folders to check");
                }

                // TODO Validate folders exist

                return Promise.each(options.otherFolders, function(folder) {
                    return new Promise(function(resolve, reject) {
                        logger.info('Scanning %s', folder);
                        var scanner = new Recursive(folder);
                        scanner.readdir(folder, function(err, collection) {
                            if (err) {
                                reject("Problem scanning folder");
                            }
                            resolve(collection);
                        });
                    })
                    .each(file => {
                        return photosAPI.files.findOne({
                            name: file.name,
                            size: file.size
                        }).then(matchedFile => {
                            if (!matchedFile) {
                                logger.info("Not found in master photodb: %s", file.path);
                                missingFromDB.push(file);
                            } else if (doubleCheck) {
                                if (!fs.existsSync(matchedFile.data.path)) {
                                    logger.info("Not found in master file system: %s", matchedFile.data.path);
                                    console.log(matchedFile);
                                    missingFromFS.push(file);
                                }
                            }
                            filesFound.push(file);
                            totalFoundFilesize += file.size;
                        })
                    })
                    .catch(err => {
                        console.log(err);
                    })
                });
            })
        }
    }
}

// Test Harness
if (true) {
    var photosAPI = require('../interfaces/photoJSON.js');

    photosAPI.init()
        .then(() => {
            var taskRunner = new task(photosAPI, 1234)
            timer.start('findMissingFiles');
            taskRunner.run({
                otherFolders: CONFIG.options.otherPhotoFolders
            })
            .then(() => {
                var totalTime = timer.end('findMissingFiles');
                logger.info("Finished Scan, missing from DB: %d, missing from File System: %s, Total File size in duplicated files: %d, total files in db already: %dMB.  Took %ds to run", missingFromDB.length, missingFromFS.length, filesFound.length, Math.floor(totalFoundFilesize / (1024 * 1024)), totalTime.time);
            })
        })
}