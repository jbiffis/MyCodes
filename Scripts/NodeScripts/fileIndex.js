require('./constants.js');
var Promise = require("bluebird");
var Recursive = require('./scanner.js');
const logger = require('winston');


var FileIndexer = function() {
    return {
        buildIndex: buildIndex
    }
}

function buildIndex (baseDir) {
    return new Promise(function(resolve, reject) {
        var recursive = new Recursive(baseDir);
        recursive.readdir(baseDir, function (err, collection) {
        // Files is an array of filename
            resolve(collection);
        });
    })
    .then(data => {
      return new Promise.map(data.getFiles(), function (file) {
          return file.addExifData();
        }, {concurrency: 3})
        .then(() => {
            return data;
        });
    });
}



module.exports = FileIndexer;

// Test functions
fileIndexer1 = new FileIndexer();
fileIndexer2 = new FileIndexer();
//fileIndexer.buildIndex('\\\\Mediabox\\m\\OneDrive\\Pictures')
//fileIndexer1.buildIndex('M:\\OneDrive\\Pictures')
//fileIndexer1.buildIndex('E:\\ForBackup\\Temp Photo Landing Zone\\From camera')
//fileIndexer1.buildIndex('E:\\SkyDrive\\Pictures\\Hospital-prints')
fileIndexer1.buildIndex('E:\\TestSrc')
  .then((dataset) =>  {
      console.log("Number of Files: " + dataset.numberOfFiles());
    });
/*
//fileIndexer.buildIndex('M:\\OneDrive\\Pictures')
//fileIndexer.buildIndex('E:\\ForBackup\\Temp Photo Landing Zone\\From camera')
fileIndexer2.buildIndex('E:\\TestDest')
  .then((data) =>  {
      console.log("Number of Files: " + data.numberOfFiles());
    });
//fileIndexer.buildIndex('E:\\tmp');
*/