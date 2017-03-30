require('./constants.js');
var fs = require('fs');
var Promise = require("bluebird");
var _ = require('underscore');
var Recursive = require('./scanner.js');
var stats = require('./stats.js');
const path = require('path');
const util = require('util');
const convertHrtime = require('convert-hrtime');
const logger = require('winston');

Promise.promisifyAll(fs);

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
    });
}



module.exports = FileIndexer;
/*
// Test functions
fileIndexer1 = new FileIndexer();
fileIndexer2 = new FileIndexer();
//fileIndexer.buildIndex('\\\\Mediabox\\m\\OneDrive\\Pictures')
//fileIndexer.buildIndex('M:\\OneDrive\\Pictures')
//fileIndexer.buildIndex('E:\\ForBackup\\Temp Photo Landing Zone\\From camera')
//fileIndexer1.buildIndex('E:\\SkyDrive\\Pictures\\Hospital-prints')
fileIndexer1.buildIndex('E:\\TestSrc')
  .then((dataset) =>  {
      console.log("Number of Files: " + dataset.numberOfFiles());
    });

//fileIndexer.buildIndex('M:\\OneDrive\\Pictures')
//fileIndexer.buildIndex('E:\\ForBackup\\Temp Photo Landing Zone\\From camera')
fileIndexer2.buildIndex('E:\\TestDest')
  .then((data) =>  {
      console.log("Number of Files: " + data.numberOfFiles());
    });
//fileIndexer.buildIndex('E:\\tmp');
*/