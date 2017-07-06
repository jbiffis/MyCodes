require('./constants.js');
var Promise = require("bluebird");
var Recursive = require('./scanner.js');
var async = require('async');
var fs = require('fs-extra');
var timer = require('perfy');
const logger = require('winston');

var FileIndexer = function() {
    return {
        buildIndex: buildIndex
    }
}

function buildIndex (baseDir, fullScan) {
    return new Promise(function(resolve, reject) {
        if (!fs.existsSync(baseDir)) {
            logger.error("Folder [%s] does not exist motherfucker", baseDir);
            reject("Folder not found");
        }

        var recursive = new Recursive(baseDir);
        recursive.readdir(baseDir, function (err, collection) {
        // Files is an array of filename
            resolve(collection);
        });
    })
    
    .then(data => {
        if (!fullScan) {
            return data;
        }
        
        var tasks = [];

        timer.start('Pull EXIF Data');
        return new Promise(function(resolve, reject) {
            var filesArr = data.getFiles();
            filesArr.forEach(file => {
                tasks.push(function(cb) {
                    logger.silly("Reading EXIF Data for %s", file._id);
                    file.addExifData()
                        .then(() => {
                            cb();
                        });
                });
            });

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
//fileIndexer1.buildIndex('\\\\Mediabox\\m\\OneDrive\\Pictures\\Photos\\2017')
//fileIndexer1.buildIndex('M:\\OneDrive\\Pictures\\photos')
//fileIndexer1.buildIndex('E:\\SkyDrive\\Pictures\\Photos\\2012\\trip')
//fileIndexer1.buildIndex('E:\\SkyDrive\\Pictures\\Hospital-prints')
//fileIndexer1.buildIndex('E:\\TestSrc')
//fileIndexer1.buildIndex('E:\\SkyDrive\\Pictures\\Photos\\2011')
  //.then((dataset) =>  {
      //    console.log("Number of Files: " + dataset.length);
    //});
/*
//fileIndexer.buildIndex('M:\\OneDrive\\Pictures')
//fileIndexer.buildIndex('E:\\ForBackup\\Temp Photo Landing Zone\\From camera')
fileIndexer2.buildIndex('E:\\TestDest')
  .then((data) =>  {
      console.log("Number of Files: " + data.numberOfFiles());
    });
//fileIndexer.buildIndex('E:\\tmp');
*/