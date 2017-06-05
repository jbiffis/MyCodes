var fs = require('graceful-fs')
var p = require('path')
var minimatch = require('minimatch');
var ExifImage = require('exif').ExifImage;

var Recursive = function() {

  return {
    files: [],
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
          return callback(null, self.files)
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
                return callback(null, files)
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
                  return callback(null, self.files)
                }
              })
            } else {
              var filename = filePath.substring(filePath.lastIndexOf('\\') + 1);
              var file = {
                  path:          filePath,
                  name:         filename,
                  size:         stats.size,
                  created:      stats.ctime,
                  accessed:     stats.atime,
                  modified:     stats.mtime
               }

              self.files.push(file);

              pending -= 1
              if (!pending) {
                return callback(null, self.files)
              }      
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

  
    
    return file;
}

module.exports = Recursive