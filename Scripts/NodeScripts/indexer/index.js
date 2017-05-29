require('../constants.js');
var Promise = require("bluebird");
var Recursive = require('../scanner.js');
var async = require('async');
var parallelLimit = require('run-parallel-limit');
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
    var tasks = [];
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
    .each(file => {
        return photos.files.findOne({path: file.path})
            .then(matchedFile => {
                if (!matchedFile) {
                    return photos.files.add(file)
                        .then(matchedFile => {
                            tasks.push(function(cb) {
                                return matchedFile.updateExifInfo()
                                    .then(data => {
                                        cb();
                                    });
                                });
                        });
                } else {
                    if (matchedFile.modified < file.modified) {
                        return matchedFile.updateFileData();
                    }
                }
            });            
    })    
    .then(data => {
        // Can't queue up too many file operations at once!
        return new Promise(function(resolve, reject) {
            parallelLimit(tasks, 20, function(err, result) {
                if (err) {
                    logger.error("Something bad happened during EXIF data extraction");
                    reject(err);
                } else {
                    logger.debug("Finished pulling EXIF data");
                    resolve(data);
                }            
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