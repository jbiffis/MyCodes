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

      var fileType = file.split('.');
      fileType = fileType[fileType.length-1].toLocaleLowerCase();

      if (['mov', 'avi', 'mp4', 'mkv', 'wmv'].indexOf(fileType) >= 0) {
          var ctime = stats.mtime;
          var year = ctime.getFullYear();
          var month = ("0" + (ctime.getMonth() + 1)).slice(-2) + ' - ' + ctime.toLocaleString(locale, { month: "long" });;
          var destDir = dest + '\\' + year + '\\' + month;

          copyFiles(filepath, destDir, file);
      } else {
        try {
          new ExifImage({ image : filepath }, function (error, exifData) {
              if (error) {
                  console.log('Error: '+error.message);
                  var ctime = stats.birthtime;
                  var year = ctime.getFullYear();
                  var month = ("0" + (ctime.getMonth() + 1)).slice(-2) + ' - ' + ctime.toLocaleString(locale, { month: "long" });;
                  var destDir = dest + '\\' + year + '\\' + month;

                  copyFiles(filepath, destDir, file);

                  
              } else {
                  var ctime = stats.birthtime;
                  
                  if (exifData && exifData.exif) {
                    ctime = new Date(exifData.exif.DateTimeOriginal);
                    var momentDate = moment(exifData.exif.DateTimeOriginal, 'YYYY-MM-DD HH:mm:ss')
                    ctime = momentDate.toDate();
                  }

                  var year = ctime.getFullYear();
                  var month = ("0" + (ctime.getMonth() + 1)).slice(-2) + ' - ' + ctime.toLocaleString(locale, { month: "long" });;

                  var destDir = dest + '\\' + year + '\\' + month;
                  copyFiles(filepath, destDir, file);

              } 
              });
            } catch (error) {
                console.log('Error: ' + error.message);
            }
      }   
      
    });

  });
});



function copyFiles (filepath, destDir, file) {
            
  
  var destPath = destDir + '\\' + file;
  // If directory doesnt exist, create it.
  if (!fs.existsSync(destDir)){
    console.log('Creating Directory ' + destDir);
    fs.mkdirSync(destDir);
  }

  // TODO: Add a feature to check if there's a duplicate filename buried in a subfolder.
  console.log('Copying File: ' + filepath + " ==> " + destPath);
  fs.rename(filepath, destPath);
}