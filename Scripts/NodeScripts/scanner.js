var fs = require('fs')
var p = require('path')
var DataCollection = require('./dataLayer.js');
var minimatch = require('minimatch');
var ExifImage = require('exif').ExifImage;
var moment = require('moment');
moment().format();

var Recursive = function() {

  return {
    list: [],
    collection: new DataCollection(),
    readdir: function(path, callback) {
      var self = this;

      /*var ignores;
      if (typeof ignores == 'function') {
        callback = ignores
        ignores = []
      }
      ignores = ignores.map(toMatcherFunction)*/

      var list = [];

      fs.readdir(path, function(err, files) {
        if (err) {
          return callback(err)
        }

        var pending = files.length
        if (!pending) {
          // we are done, woop woop
          return callback(null, self.collection)
        }

        files.forEach(function(file) {
          var filePath = p.join(path, file)
          fs.stat(filePath, function(_err, stats) {
            if (_err) {
              return callback(_err)
            }

            /*if (ignores.some(function(matcher) { return matcher(filePath, stats) })) {
              pending -= 1
              if (!pending) {
                return callback(null, collection)
              }
              return null
            }*/

            if (stats.isDirectory()) {
              self.readdir(filePath, /*ignores,*/ function(__err, res) {
                if (__err) {
                  return callback(__err)
                }

                list = list.concat(res)
                pending -= 1
                if (!pending) {
                  return callback(null, self.collection)
                }
              })
            } else {
              var file = new File(filePath, stats);
              file.getDateCreated().then((file) => {
                  self.collection.addFile(file)
                  pending -= 1
                  if (!pending) {
                    return callback(null, self.collection)
                  }
                })
                .catch((error) => {
                    console.log('test');
                });          
            }
          })
        })
      })
    }
  }
}

function patternMatcher(pattern) {
  return function(path, stats) {
    var minimatcher = new minimatch.Minimatch(pattern, {matchBase: true})
    return (!minimatcher.negate || stats.isFile()) && minimatcher.match(path)
  }
}

function toMatcherFunction(ignoreEntry) {
  if (typeof ignoreEntry == 'function') {
    return ignoreEntry
  } else {
    return patternMatcher(ignoreEntry)
  }
}

function File(filepath, stats) {

  var filename = filepath.substring(filepath.lastIndexOf('\\') + 1);
  var file = {
        _id:          filepath,
        name:         filename,
        size:         stats.size,
        created:      stats.ctime,
        accessed:     stats.atime,
        modified:     stats.mtime,
        getDateCreated:  getDateCreated
      }
    
    return file;
}

var getDateCreated = function() {
    var file = this;

    return new Promise(function(resolve, reject) {
      fileType = getFileType(file._id);

      if (['mov', 'avi', 'mp4', 'mkv', 'wmv'].indexOf(fileType) >= 0) {
          file.dateCreated = file.modifed;
          resolve(file);
      } else {
          try {
            new ExifImage({ image : file._id }, function (error, exifData) {
                if (error) {
                    file.dateCreated = file.modifed;
                   resolve(file);                 
                } else if (exifData && exifData.exif) {
                      ctime = new Date(exifData.exif.DateTimeOriginal);
                      var momentDate = moment(exifData.exif.DateTimeOriginal, 'YYYY-MM-DD HH:mm:ss')
                      file.dateCreated = momentDate.toDate();
                      resolve(file);
                } else {
                   file.dateCreated = file.modifed;
                    resolve(file);
                }
              });
          } catch (error) {
              file.dateCreated = file.modifed;
              resolve(file);
          }
      }
    })

    

}

var getFileType = function(filename) {
    var fileType = filename.split('.');
    fileType = fileType[fileType.length-1].toLocaleLowerCase();
    return fileType;
}

module.exports = Recursive