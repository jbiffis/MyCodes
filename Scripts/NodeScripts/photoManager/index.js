require('../constants.js');
var Promise = require("bluebird");
var Recursive = require('../scanner.js');
var async = require('async');
var parallelLimit = require('run-parallel-limit');
var fs = require('graceful-fs')
var timer = require('perfy');
const logger = require('winston');
var photosAPI = require('../interfaces/photoJSON.js');

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
        return photosAPI.files.findOne({path: file.path})
            .then(matchedFile => {
                if (!matchedFile) {
                    return Promise.try(function() {
                        return photosAPI.files.add(file);
                    }).then(function(result) {
                        tasks.push(function(cb) {
                            return photosAPI.files.updateExifInfo(result.data._id)
                                .then(data => {
                                    cb();
                                })    
                        });

                        photosAPI.events.add({
                            module: MODULES.PHOTO_INDEXER,
                            operation: 'indexPhotos',
                            event: EVENTS.FILE_NEW,
                            data: {
                                fileId: result.data._id
                            },
                            execTime: null
                        });  
                    });
                } else {
                    // TODO Double check this shit
                    if (matchedFile.modified < file.modified) {
                        return matchedFile.updateFileData()
                            .then(() => {
                                photosAPI.events.add({
                                    module: MODULES.PHOTO_INDEXER,
                                    operation: 'indexPhotos',
                                    event: EVENTS.FILE_UPDATED,
                                    data: {
                                        fileId: matchedFile.data._id,
                                        dateModified: file.modified
                                    },
                                    execTime: null
                                });
                            });
                    }
                }
            });            
    })    
    .then(data => {
        // Can't queue up too many file operations at once!
        return new Promise(function(resolve, reject) {
            parallelLimit(tasks, 5, function(err, result) {
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
        logger.error("Problem indexing");
        console.log(err);
    });
}

module.exports = FileIndexer;
var params = [];
process.argv.slice(2).forEach(function(item) {
    params[item.split('=')[0]] = item.split('=')[1];
})

var source = params['src'] || CONFIG.options.basedir;

if (source) {
    fileIndexer = new FileIndexer();

    photosAPI.init()
        .then(() => {
            return fileIndexer.index(source, {fullScan: true});
        })
        .then((dataset) =>  {
            console.log("Number of Files: " + dataset.length);
        });
} else {
    logger.error("No base dir set");
}

fileIndexer1 = new FileIndexer();

// Test functions
fileIndexer1 = new FileIndexer();
fileIndexer2 = new FileIndexer();
logger.level = 'silly';
//fileIndexer1.index('\\\\Mediabox\\m\\OneDrive\\Pictures\\Photos\\2017')
//fileIndexer1.index('M:\\OneDrive\\Pictures\\photos')
//fileIndexer1.index('E:\\SkyDrive\\Pictures\\Photos\\2012\\trip')
//fileIndexer1.index('E:\\SkyDrive\\Pictures\\Hospital-prints')
/*photosAPI.init()
    .then(() => {
        return fileIndexer1.index('E:\\TestSrc', {fullScan: true});
        //fileIndexer1.index('E:\\SkyDrive\\Pictures\\Photos\\2011')
    })
    .then((dataset) =>  {
        console.log("Number of Files: " + dataset.length);
    });*/
/*
//fileIndexer.index('M:\\OneDrive\\Pictures')
//fileIndexer.index('E:\\ForBackup\\Temp Photo Landing Zone\\From camera')
fileIndexer2.index('E:\\TestDest')
  .then((data) =>  {
      console.log("Number of Files: " + data.numberOfFiles());
    });
//fileIndexer.index('E:\\tmp');
*/