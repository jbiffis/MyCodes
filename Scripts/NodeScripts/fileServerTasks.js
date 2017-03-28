require('./constants.js');
var fs = require('fs');
var Promise = require("bluebird");
var _ = require('underscore');
var transcoder = require('./transcoder.js');
var email = require('./mailer.js');
var stats = require('./stats.js');
const path = require('path');
const util = require('util');
const convertHrtime = require('convert-hrtime');
const logger = require('winston');
logger.level = 'debug';
var logFile = 'log.log';

logger.add(logger.transports.File, { filename: logFile, prettyPrint: true });

Promise.promisifyAll(fs);

var hockeyVideos = function(directory) {
    // For each folder, get a list of all the input files and send them off to the transcoder   
    this.gamesToTranscode = {};

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

            email.send('jeremy@biffis.com', 'ottawa@biffis.com', 'Server Task Report', summary);
        });
        
        
}

var transferToOneDrive = function() {

}


var tasks2 = [
    {
        'folder' : "E:\\tmp",
        //"folder": "\\\\Mediabox\\m\\Videos\\Aylmer Express\\To Be Transcoded",
        "action": hockeyVideos
    }
]

var tasks = [
    {
        "folder"  :   "M:\\Videos\\Aylmer Express\\To Be Transcoded",
        "action"  :   hockeyVideos
    }, /*{
        "folder"  :   "M:\\Temp Photo Landing Zone",
        "action"  :   transferToOneDrive
    }*/
]

tasks.forEach((task) => {
    task.action(task.folder)
        .then(() => {
            var logText = fs.readFileSync(logFile);
            //email.send('jeremy@biffis.com', 'ottawa@biffis.com', 'Script finished running', logText, logText);
        });
});