var fs = require('fs')
var p = require('path')
var DataCollection = require('./dataLayer.js');
var minimatch = require('minimatch');
var ExifImage = require('exif').ExifImage;

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
              self.collection.addFile(file);

              pending -= 1
              if (!pending) {
                return callback(null, self.collection)
              }
              /*file.addExifData().then((file) => {
                  self.collection.addFile(file)
                  
                })
                .catch((error) => {
                    console.log('test');
                });   
                */       
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
        addExifData:  addExifData
      }
    
    return file;
}

var addExifData = function() {
    var file = this;

    return new Promise(function(resolve, reject) {
      try {
        new ExifImage({ image : file._id }, function (error, exifData) {
            if (error) {
                resolve(file);                 
            } else if (exifData && exifData.exif) {
                  exifData.exif && exifData.exif.MakerNote && (exifData.exif.MakerNote = {});
                  exifData.exif && exifData.exif.UserComment && (exifData.exif.UserComment = {});
                  file.exifData = exifData;
                  resolve(file);
            } else {
                resolve(file);
            }
          });
      } catch (error) {
          resolve(file);
      }
    });
}

module.exports = Recursive