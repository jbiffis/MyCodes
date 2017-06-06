require('../constants.js');
var Promise = require("bluebird");
var ExifImage = require('exif').ExifImage;
var fs = require('graceful-fs')

Promise.promisifyAll(fs);

module.exports = function(db, logger) {

    var File = require('../models/File.js')(db, logger);

    return {
        add: function(data) {
            logger.debug("Entered Files.add() with data: %s", JSON.stringify(data));
            return Promise.try(() => {
                var file = new File(data);
                return file.save();
            });
        },

        find: function(params) {
            logger.debug("Entered Files.find() looking for Files with query: %s", JSON.stringify(params));
            return File.find(params)
                .then(data => {
                    return data;
                });
        },

        findOne: function(params) {
            logger.debug("Entered Files.findOne() looking for a file with query: %s", JSON.stringify(params));
            return File.find(params)
                .then(data => {
                    return data[0];
                });
        },

        updateExifInfo: function(id) {
            var file;
            return File.find({_id: id})
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
};
