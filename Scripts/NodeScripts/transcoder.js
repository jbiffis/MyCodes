var fs = require('fs');
var FfmpegCommand = require('fluent-ffmpeg');
var moment = require('moment');
var Promise = require("bluebird");

const convertHrtime = require('convert-hrtime');
const logger = require('winston');
logger.level = 'debug';

Promise.promisifyAll(fs);

var Transcoder = {
    'transcodeFile': transcodeFile,
    'transcodeMulti': transcodeMulti
}

module.exports = Transcoder;

// ---------------- PUBLIC FUNCTIONS ----------------------

// Accepts single input file, outputs single outputFile
function transcodeFile(inputFile, outputFile, options) {
    logger.log('debug', 'transcodeFile start of execution with %s destined for %s', inputFile, outputFile);

    return Transcoder.transcodeMulti([inputFile], outputFile, options);
}


// Accepts array of input files, outputs a single outputFile
// This should be converted into a promise so the result gets passed back to calling func
function transcodeMulti(inputFiles, outputFile, options) {

    var transcodeJob = new FfmpegCommand();

    var promise = new Promise(function(resolve, reject) {
        // Make sure options are set
        var options = options || {};
        options.size = options.size || 720;

        inputFiles.forEach((file) => {
            if (!_validateFilepath(file)) {
                logger.warn("Input file is invalid: %s", file);
                return false;
            }
            
            transcodeJob.addInput(file);
        });

        transcodeJob
            .videoBitrate(4024)
            .videoCodec('libx264')
            .size('?x' + options.size)
            .output(outputFile)
            .on('start', (commandLine) => {
                logger.debug('Transcoding with command line: %s', commandLine);
            })
            .on('progress', (progress) => {
                logger.silly('Processing: %s% done', progress.percent ? Math.floor(progress.percent) : 'NA');
            })
            .on('error', (err, stdout, stderr) => {
                logger.error('Cannot process video: ' + err.message);
                reject(err);
            })
            .on('end', (stdout, stderr) => {
                var diff = Math.floor(convertHrtime(process.hrtime(startTime)).s);
                logger.debug('Trancoding to %s has finished in %s seconds', outputFile, diff);
                resolve();
            });

        var startTime = process.hrtime();
        
        transcodeJob.run();
    });

    return promise;

    
}

// ---------------- PRIVATE FUNCTIONS ----------------------

function _validateFilepath(filepath) {
    return fs.existsSync(filepath);
}

function _mergeFiles(inputFiles) {

    ffmpeg('/path/to/part1.avi')
  .input('/path/to/part2.avi')
  .input('/path/to/part2.avi')
  .on('error', function(err) {
    console.log('An error occurred: ' + err.message);
  })
  .on('end', function() {
    console.log('Merging finished !');
  })
  .mergeToFile('/path/to/merged.avi', '/path/to/tempDir');
}

// ---------------- TEST FUNCTIONS -------------------------
//Transcoder.transcodeFile('E:\\tmp\\sampleFile.mp4', 'E:\\tmp\\OutputFile.mp4', {});
Transcoder.transcodeFile('E:\\tmp\\sampleFile2.mp4', 'E:\\tmp\\OutputFile2.mp4', {});
//Transcoder.transcodeFile('E:\\tmp\\sampleFile3.mp4', 'E:\\tmp\\OutputFile3.mp4', {});