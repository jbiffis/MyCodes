require('./constants.js');
var fs = require('fs');
var Promise = require("bluebird");
var _ = require('underscore');
var recursive = require('./scanner.js');
var stats = require('./stats.js');
var dataLayer = require('./dataLayer.js');  
const path = require('path');
const util = require('util');
const convertHrtime = require('convert-hrtime');
const logger = require('winston');

Promise.promisifyAll(fs);
Promise.promisifyAll(recursive);

var fileIndexer = {
    buildIndex: buildIndex
}

function buildIndex (baseDir) {
    dataLayer.getFiles();
    return new Promise(function(resolve, reject) {
        recursive(baseDir, function (err, files) {
        // Files is an array of filename
            resolve(files);
        });
    });
}



module.exports = fileIndexer;

// Test functions

fileIndexer.buildIndex('E:\\TestDest')
  .then(() =>  {
      console.log(dataLayer.getFiles());
    });
//fileIndexer.buildIndex('E:\\tmp');
