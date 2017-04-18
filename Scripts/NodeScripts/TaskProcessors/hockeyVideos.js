require('../constants.js');
var fs = require('fs-extra');
var Promise = require("bluebird");
var _ = require('underscore');
var transcoder = require('../transcoder.js');
var stats = require('../stats.js');
var fileUtils = require('../fileUtils.js');
var FileIndexer = require('../fileIndex.js');
const path = require('path');
const util = require('util');
var timer = require('perfy');
const logger = require('winston');
var locale = "en-us";

Promise.promisifyAll(fs);

var task = {
    run: hockeyVideos
}

module.exports = task;

function hockeyVideos(options) {
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