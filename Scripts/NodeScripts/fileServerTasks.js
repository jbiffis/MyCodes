var fs = require('fs');
var Promise = require("bluebird");
var _ = require('underscore');
var transcoder = require('./transcoder.js');
var email = require('./mailer.js');

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
            var filepath = filepath = directory + '\\' + file;
            return fs.statSync(filepath).isDirectory();
        })
        .map((gameFolder) => {
            var gameFolderPath = directory + '\\' + gameFolder;
            var gameFilename = gameFolderPath + '\\' + gameFolder;

            this.gamesToTranscode[gameFilename] = new Array();

            return fs.readdirAsync(gameFolderPath)
                .map((filename) =>  {
                    var filepath = gameFolderPath + '\\' + filename;
                    this.gamesToTranscode[gameFilename].push(filepath);
                });
        })
        .then(() => {
            var transcodeJobs = [];

            _.each(this.gamesToTranscode, function(clips, gameName)  {
                clips.sort();
                var transcodeJob = transcoder.transcodeMulti(clips, gameName);
                transcodeJobs.push(transcodeJob);
            });

            return transcodeJobs;
        })
        .mapSeries(function(finishedJob) {
            console.log("done?");
        });
        
        
}

var transferToOneDrive = function() {

}


var tasks = [
    {
        'folder' : "E:\\tmp",
        //"folder": "\\\\Mediabox\\m\\Videos\\Aylmer Express\\To Be Transcoded",
        "action": hockeyVideos
    }
]

var tasks1 = [
    {
        "folder"  :   "M:\\Videos\\Aylmer Express\\To Be Transcoded",
        "action"  :   hockeyVideos
    }, {
        "folder"  :   "M:\\Temp Photo Landing Zone",
        "action"  :   transferToOneDrive
    }
]

tasks.forEach((task) => {
    task.action(task.folder)
        .then(() => {
            var logText = fs.readFileSync(logFile);
            email.send('jeremy@biffis.com', 'ottawa@biffis.com', 'Script finished running', logText, logText);
        });
});