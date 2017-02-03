var fs = require('fs');

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

      var ctime = stats.ctime;
      var year = ctime.getFullYear();
      var month = ("0" + (ctime.getMonth() + 1)).slice(-2) + ' - ' + ctime.toLocaleString(locale, { month: "long" });;

      var destDir = dest + '\\' + year + '\\' + month;

      // If directory doesnt exist, create it.
      if (!fs.existsSync(destDir)){
        console.log('Creating Directory ' + destDir);
        fs.mkdirSync(destDir);
      }

      var destPath = destDir + '\\' + file;
      
      console.log('Copying File: ' + filepath + " ==> " + destPath);
      fs.rename(filepath, destPath);

    });

  });
});