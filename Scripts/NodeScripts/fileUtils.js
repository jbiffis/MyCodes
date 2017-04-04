var fs = require('fs');
var Promise = require("bluebird");
var _ = require('underscore');
var moment = require('moment');
moment().format();

var utils = {
    copyFile: function(source, target) {
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
    },

    
    getDateCreated: function(file) {
        var dates = [];
        //dates.push(new Date(file.created));
        //dates.push(new Date(file.modified));
        //dates.push(new Date(file.accessed));
        fileType = this.getFileType(file);

        // I can't pull exif data for video files yet, so hopefully this is accurate
        // Possible to look in the filename for a date, but this is at least 10x easier
        if (_.contains(['mov', 'mp4', 'avi'], fileType)) {
            dates.push(new Date(file.modified));
        }

        if (file.exifData && file.exifData.exif) {
            var momentDate = moment(file.exifData.exif.DateTimeOriginal, 'YYYY-MM-DD HH:mm:ss');
            if (momentDate.isValid()) {
                dates.push(momentDate.toDate());
            }
        }

        return this.findEarliestDate(dates);
    },

    findEarliestDate: function(dates){
        if(dates.length == 0) return null;
        var earliestDate = dates[0];
        for(var i = 1; i < dates.length ; i++){
            var currentDate = dates[i];
            if(currentDate < earliestDate){
                earliestDate = currentDate;
            }
        }
        return earliestDate;
    },

    getFileType: function(file) {
        var fileType = file._id.split('.');
        fileType = fileType[fileType.length-1].toLocaleLowerCase();
        return fileType;
    }
}

module.exports = utils