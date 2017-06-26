require('../constants.js');
var Promise = require("bluebird");
var _ = require('underscore');
var stats = require('../stats.js');
var fs = require('fs');
var photosAPI = require('../interfaces/photoJSON.js');
var fileUtils = require('../fileUtils.js');
var Recursive = require('../scanner.js');
var parallelLimit = require('run-parallel-limit')
const path = require('path');
const util = require('util');
var timer = require('perfy');
const logger = require('winston');

logger.level = 'silly';

var sourceFolder = "E:\\TestSrc";
var targetFolder = CONFIG.options.basedir;

if (!fs.existsSync(sourceFolder)) {
    logger.error("Folder [%s] does not exist motherfucker", targetFolder);
    reject("Folder not found");
}

if (!fs.existsSync(targetFolder)) {
    logger.error("Folder [%s] does not exist motherfucker", targetFolder);
    reject("Folder not found");
}

var recursive = new Recursive(sourceFolder);
var tasks = [];
recursive.readdir(sourceFolder, function (err, collection) {
// Files is an array of filename
    logger.debug("There are %s files to import", collection.length);
    return new Promise.each(collection, function(file) {
        console.log(file.path)
        return fileUtils.getDateCreated(file.path, {created: file.created, modified: file.modified, accessed: file.accessed})
        .then(dateCreated => {
                console.log('starting file op');
                var subpath;
                if (dateCreated === null) {
                    subpath = "undated";
                } else {
                    var year = dateCreated.getFullYear().toString();
                    var month = ("0" + (dateCreated.getMonth() + 1)).slice(-2) + ' - ' + dateCreated.toLocaleString("en-CA", { month: "long" });

                    subpath = path.join(year, month); 
                }

                newPath = path.join(CONFIG.options.basedir, subpath, file.name);

                return fileUtils.copyFile(file.path, newPath);
        })
    })
    .catch(err => {
        console.log(err);
    });
        
})

