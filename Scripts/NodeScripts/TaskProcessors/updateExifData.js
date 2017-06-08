require('../constants.js');
var Promise = require("bluebird");
var ExifImage = require('exif').ExifImage;
var fs = require('graceful-fs');
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
                        file.data.exifData = "Unsupported File Type";
                        return file;
                    }
                    return fs.readFileAsync(file.data.path)
                      .then((fileBuffer, err) => {
                        return new Promise(function(resolve, reject) {
                            new ExifImage(fileBuffer, function (error, exifData) {
                            if (error) {
                                file.data.exifData = error;
                                resolve(file);
                            } else if (exifData && exifData.exif) {
                                    exifData.exif && exifData.exif.MakerNote && (exifData.exif.MakerNote = {});
                                    exifData.exif && exifData.exif.UserComment && (exifData.exif.UserComment = {});
                                    file.data.exifData = exifData;
                                    resolve(file);
                            } else {
                                resolve(file);
                            }
                        });
                    });                
                    });
                })
            .then(file => {
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
