var fs = require('fs');
var FfmpegCommand = require('fluent-ffmpeg');
var moment = require('moment');
var Promise = require("bluebird");

const convertHrtime = require('convert-hrtime');
const logger = require('winston');
logger.level = 'silly';

Promise.promisifyAll(fs);

var Transcoder = {
    'transcodeFile': transcodeFile,
    'transcodeMulti': transcodeMulti
}

module.exports = Transcoder;

// ---------------- PUBLIC FUNCTIONS ----------------------

// Accepts single input file, outputs single outputFile
function transcodeFile(inputFile, outputFile, options) {
    var outputFile = outputFile+'.mp4';
    logger.log('debug', 'transcodeFile start of execution with %s destined for %s', inputFile, outputFile);

    var transcodeJob = new FfmpegCommand();

    var promise = new Promise(function(resolve, reject) {
        // Make sure options are set
        var options = options || {};
        options.size = options.size || 720;

        transcodeJob
            .addInput(inputFile)
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


// Accepts array of input files, outputs a single outputFile
// This should be converted into a promise so the result gets passed back to calling func
function transcodeMulti(inputFiles, outputFile, options) {
    logger.log('debug', 'transcodeMulti start of execution with %d files destined for %s', inputFiles.length, outputFile);

    var mergedFile = outputFile + '-merged.mp4';

    return _mergeFiles(inputFiles, mergedFile)
        .then((mergedFilename) => {
            return this.transcodeFile(mergedFile, outputFile, options);
        });
        // Then delete originals?  Move them to another folder and mark for deletion?  Archive?    
}

// ---------------- PRIVATE FUNCTIONS ----------------------

function _validateFilepath(filepath) {
    return fs.existsSync(filepath);
}


function _mergeFiles(inputFiles, mergedFile) {

    var job = new FfmpegCommand();

    var promise = new Promise(function(resolve, reject) {
        inputFiles.forEach((file) => {
            if (!_validateFilepath(file)) {
                    logger.warn("Input file is invalid: %s", file);
                    return false;
                }
                
                job.addInput(file);
        });

        var startTime = process.hrtime();

        job.on('error', function(err) {
                logger.error('Cannot merge video: ' + err.message);
                reject(err);
            })
            .on('start', (commandLine) => {
                logger.debug('Merging files with command line: %s', commandLine);
            })
            .on('progress', (progress) => {
                logger.silly('Processing: %s% done', progress.percent ? Math.floor(progress.percent) : 'NA');
            })
            .on('end', function() {
                var diff = Math.floor(convertHrtime(process.hrtime(startTime)).s);
                logger.debug('Merging to %s has finished in %s seconds', mergedFile, diff);
                resolve(mergedFile);
            })
            .mergeToFile(mergedFile, '/path/to/tempDir');        

    });

    return promise;
}

// ---------------- TEST FUNCTIONS -------------------------
//Transcoder.transcodeFile('E:\\tmp\\sampleFile.mp4', 'E:\\tmp\\OutputFile.mp4', {});
//Transcoder.transcodeFile('E:\\tmp\\sampleFile2.mp4', 'E:\\tmp\\OutputFile2.mp4', {});
//Transcoder.transcodeFile('E:\\tmp\\sampleFile3.mp4', 'E:\\tmp\\OutputFile3.mp4', {});

//Transcoder.transcodeMulti(['E:\\tmp\\sampleFile2.mp4', 'E:\\tmp\\sampleFile2.mp4'], 'E:\\tmp\\OutputFile2', {});