var fs = require('fs');
var Promise = require("bluebird");
var _ = require('underscore');
var transcoder = require('./transcoder.js');

const convertHrtime = require('convert-hrtime');
const logger = require('winston');
logger.level = 'silly';
logger.add(logger.transports.File, { filename: 'log.log' });

Promise.promisifyAll(fs);

var hockeyVideos = function(directory) {
    // For each folder, get a list of all the input files and send them off to the transcoder   
    this.gamesToTranscode = {};

    fs.readdirAsync(directory)
        .filter((file) => {
            var filepath = filepath = directory + '\\' + file;
            return fs.statSync(filepath).isDirectory();
        })
        .map((gameFolder) => {
            var gameFolderPath = directory + '\\' + gameFolder;
            this.gamesToTranscode[gameFolderPath] = new Array();

            return fs.readdirAsync(gameFolderPath)
                .map((filename) =>  {
                    var filepath = gameFolderPath + '\\' + filename;
                    this.gamesToTranscode[gameFolderPath].push(filepath);
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


var tasksTest = [
    {
        //'folder' : "E:\\tmp",
        "folder": "\\\\Mediabox\\m\\Videos\\Aylmer Express\\To Be Transcoded",
        "action": hockeyVideos
    }
]

var tasks = [
    {
        "folder"  :   "M:\\Videos\\Aylmer Express\\To Be Transcoded",
        "action"  :   hockeyVideos
    }, {
        "folder"  :   "M:\\Temp Photo Landing Zone",
        "action"  :   transferToOneDrive
    }
]

tasks.forEach((task) => {
    task.action(task.folder);
});