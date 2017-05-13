require('../constants.js');
var Promise = require("bluebird");
var Recursive = require('../scanner.js');
var async = require('async');
var fs = require('fs-extra');
var timer = require('perfy');
const logger = require('winston');
var photos = require('../interfaces/photoJSON.js');

var FileIndexer = function() {
    return {
        index: index
    }
}

function index (baseDir, options) {
    return new Promise(function(resolve, reject) {
        if (!fs.existsSync(baseDir)) {
            logger.error("Folder [%s] does not exist motherfucker", baseDir);
            reject("Folder not found");
        }

        var recursive = new Recursive(baseDir, options);
        recursive.readdir(baseDir, function (err, collection) {
        // Files is an array of filename
            resolve(collection);
        });
    })
    .then(data => {

        
        var tasks = [];

        timer.start('Pull EXIF Data');
        return new Promise(function(resolve, reject) {
            var filesArr = data;
            filesArr.forEach(file => {
                // look if it is in the db
                photos.files.findOne({path: file._id})
                    .then(matchedFile => {
                        if (!matchedFile) {
                            matchedFile = photos.files.add(file);
                            
                            tasks.push(function(cb) {
                                logger.silly("Reading EXIF Data for %s", file._id);
                                matchedFile.getExifData()
                                    .then(() => {
                                        matchedFile.save();
                                    });
                            });
                        } else {
                            if (matchedFile.modified < file.modified) {
                                matchedFile.updateFileData();
                            }
                        }
                    });                
            });

            // Can't queue up too many file operations at once!
            async.parallelLimit(tasks, 10, function(err, result) {
                var totalTime = timer.end('Pull EXIF Data');
                logger.debug("It took %ss to pull the EXIF data for %d files", totalTime.time, filesArr.length);

                if (err) {
                    console.log("rejecting");
                    reject(err);
                }
                resolve(data);
            });
        });
    })
    .catch(err => {
        logger.error(err);
    });
}



module.exports = FileIndexer;

fileIndexer1 = new FileIndexer();

// Test functions
fileIndexer1 = new FileIndexer();
fileIndexer2 = new FileIndexer();
logger.level = 'silly';
//fileIndexer1.index('\\\\Mediabox\\m\\OneDrive\\Pictures\\Photos\\2017')
//fileIndexer1.index('M:\\OneDrive\\Pictures\\photos')
//fileIndexer1.index('E:\\SkyDrive\\Pictures\\Photos\\2012\\trip')
//fileIndexer1.index('E:\\SkyDrive\\Pictures\\Hospital-prints')
photos.init()
    .then(() => {
        return fileIndexer1.index('E:\\TestSrc', {fullScan: true});
        //fileIndexer1.index('E:\\SkyDrive\\Pictures\\Photos\\2011')
    })
    .then((dataset) =>  {
        console.log("Number of Files: " + dataset.length);
    });
/*
//fileIndexer.index('M:\\OneDrive\\Pictures')
//fileIndexer.index('E:\\ForBackup\\Temp Photo Landing Zone\\From camera')
fileIndexer2.index('E:\\TestDest')
  .then((data) =>  {
      console.log("Number of Files: " + data.numberOfFiles());
    });
//fileIndexer.index('E:\\tmp');
*/