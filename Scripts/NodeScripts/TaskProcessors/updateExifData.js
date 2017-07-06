require('../constants.js');
var Promise = require("bluebird");
var ExifImage = require('exif').ExifImage;
var fs = require('graceful-fs');
var fileUtils = require('../fileUtils.js')
const logger = require('winston');

Promise.promisifyAll(fs);

var task = function(photosAPI) {
    return {
        run: function(params) {
            logger.debug("Entered updateExifInfo::updateExifInfo with params: %s", JSON.stringify(params));
            var file;
            return photosAPI.files.find({_id: params.fileId})
            .then(result => {
                file = result[0];
                if (file.getProp("type") !== FILE_TYPES.IMAGE) {
                    return "Unsupported File Type";
                }
                
                return fileUtils.getExifData(file.getProp("path"));
            })
            .then(exifData => {
                file.data.exifData = exifData;
                return file.save();
            })
            .catch(err => {
                logger.error(err.message);
                return;
            });
        }
    }
}

module.exports = task;
