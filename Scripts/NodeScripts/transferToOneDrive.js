var fs = require('fs');
var ExifImage = require('exif').ExifImage;
var moment = require('moment');
moment().format();

var params = [];
var locale = "en-us";

process.argv.slice(2).forEach(function(item) {
    params[item.split('=')[0]] = item.split('=')[1];
})

var source = params['src'];
var dest = params['dest'];

fs.readdir(source, (err, files) => {
  files.forEach(file => {
    
    var filepath = source + '\\' + file;

    fs.stat(filepath, (err, stats) => {

      if (stats.isDirectory()) {
        return;
      }
      
      var ExifImage = require('exif').ExifImage;

try {
    new ExifImage({ image : filepath }, function (error, exifData) {
        if (error)
            console.log('Error: '+error.message);
        else
            var ctime = stats.birthtime;
            
            if (exifData.exif) {
              ctime = new Date(exifData.exif.DateTimeOriginal);
              var momentDate = moment(exifData.exif.DateTimeOriginal, 'YYYY-MM-DD HH:mm:ss')
              ctime = momentDate.toDate();
            }

            var year = ctime.getFullYear();
            var month = ("0" + (ctime.getMonth() + 1)).slice(-2) + ' - ' + ctime.toLocaleString(locale, { month: "long" });;

            var destDir = dest + '\\' + year + '\\' + month;
            var destPath = destDir + '\\' + file;

            // If directory doesnt exist, create it.
            if (!fs.existsSync(destDir)){
              console.log('Creating Directory ' + destDir);
              fs.mkdirSync(destDir);
            }

            // TODO: Add a feature to check if there's a duplicate filename buried in a subfolder.
            console.log('Copying File: ' + filepath + " ==> " + destPath);
            //fs.rename(filepath, destPath);
          });
      } catch (error) {
          console.log('Error: ' + error.message);
      }
    });

  });
});