var fs = require('graceful-fs');
var path = require('path');
var Promise = require("bluebird");
var _ = require('underscore');
var moment = require('moment');
var logger = require('winston');
var ExifImage = require('exif').ExifImage;
moment().format();

Promise.promisifyAll(fs);

moveFile = function(source, target) {
    return new Promise(function(resolve, reject) {
        var rd = fs.createReadStream(source);
        rd.on('error', rejectCleanup);
        var wr = fs.createWriteStream(target);
        wr.on('error', rejectCleanup);
        function rejectCleanup(err) {
            rd.destroy();
            wr.end();
            reject(err);
        }
        wr.on('finish', resolve);
        wr.on('open', () => {
            rd.pipe(wr);
        });
    });
}

ensureDirectoryExistence = function(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}


copyFile = function(source, target) {
    logger.debug("Copying %s to %s", source, target);
    return new Promise(function(resolve, reject) {

        ensureDirectoryExistence(target);

        var rd = fs.createReadStream(source);
        rd.on('error', rejectCleanup);
        var wr = fs.createWriteStream(target);
        wr.on('error', rejectCleanup);
        function rejectCleanup(err) {
            rd.destroy();
            wr.end();
            reject(err);
        }
        wr.on('finish', resolve);
        wr.on('open', () => {
            rd.pipe(wr);
        });
    });
}

getExifData = function (filePath) {
    // Got the same fucking problem here
    return fs.readFileAsync(filePath)
        .then((fileBuffer, err) => {
        return new Promise(function(resolve, reject) {
                new ExifImage(fileBuffer, function (error, exifData) {
                if (error) {
                    resolve(error);
                } else if (exifData && exifData.exif) {
                        exifData.exif && exifData.exif.MakerNote && (exifData.exif.MakerNote = {});
                        exifData.exif && exifData.exif.UserComment && (exifData.exif.UserComment = {});
                        resolve(exifData);
                } else {
                    resolve("Unknown error");
                }
            });
        });  
    });
}

getDateCreated = function(filePath, fileDates) {
    return new Promise(function(resolve, reject) {
        var dates = [];
        //dates.push(new Date(dates.created));
        //dates.push(new Date(dates.modified));
        //dates.push(new Date(dates.accessed));
        fileType = getFileType(filePath);

        // Before any of this happens, lets check using this regexp to see if the
        // date is in the filename https://regex101.com/r/vS3fC8/3
        
        // I can't pull exif data for video files yet, so hopefully this is accurate
        // Possible to look in the filename for a date, but this is at least 10x easier
        if (fileType === FILE_TYPES.VIDEO) {
            dates.push(new Date(fileDates.modified));
            resolve(findEarliestDate(dates));

        } else if (fileType === FILE_TYPES.IMAGE) {
            return getExifData(filePath) 
                .then(function(exifData) {
                    if (exifData.exif) {
                        var momentDate = moment(exifData.exif.DateTimeOriginal, 'YYYY-MM-DD HH:mm:ss');
                        if (momentDate.isValid()) {
                            dates.push(momentDate.toDate());
                            resolve(findEarliestDate(dates));
                        }
                    }                    
                    resolve(findEarliestDate(dates));
                })
        } else {
            resolve(findEarliestDate(dates));
        }
        });
    
}

findEarliestDate = function(dates){
    if(dates.length == 0) return null;
    var earliestDate = dates[0];
    for(var i = 1; i < dates.length ; i++){
        var currentDate = dates[i];
        if(currentDate < earliestDate){
            earliestDate = currentDate;
        }
    }
    return earliestDate;
}

getFileType = function(filePath) {
    var extension = filePath.split('.');
    extension = extension[extension.length-1].toLowerCase();

    switch (extension) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'heif':
            return FILE_TYPES.IMAGE;
        case 'avi':
        case 'mpeg':
        case 'mkv':
        case 'mov':
        case '3gp':
        case 'h264':
        case 'mp4':
            return FILE_TYPES.VIDEO;
    }

    return FILE_TYPES.UNKNOWN;
}


var utils = {
    copyFile: copyFile,
    getExifData: getExifData,
    getDateCreated: getDateCreated,
    findEarliestDate: findEarliestDate,
    getFileType: getFileType
}




module.exports = utils