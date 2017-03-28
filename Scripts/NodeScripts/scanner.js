var fs = require('fs')
var p = require('path')
var dataLayer = require('./dataLayer.js');
var minimatch = require('minimatch')

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

function newFile(filepath, stats) {

  var filename = filepath.substring(filepath.lastIndexOf('\\') + 1);

  var file = {
    _id:      filepath,
    name:     filename,
    size:     stats.size,
    created:  stats.ctime,
    accessed: stats.atime,
    modified: stats.mtime
  }

  return file;
}

function readdir(path, ignores, callback) {
  if (typeof ignores == 'function') {
    callback = ignores
    ignores = []
  }
  ignores = ignores.map(toMatcherFunction)

  var list = []

  fs.readdir(path, function(err, files) {
    if (err) {
      return callback(err)
    }

    var pending = files.length
    if (!pending) {
      // we are done, woop woop
      return callback(null, list)
    }

    files.forEach(function(file) {
      var filePath = p.join(path, file)
      fs.stat(filePath, function(_err, stats) {
        if (_err) {
          return callback(_err)
        }

        if (ignores.some(function(matcher) { return matcher(filePath, stats) })) {
          pending -= 1
          if (!pending) {
            return callback(null, list)
          }
          return null
        }

        if (stats.isDirectory()) {
          readdir(filePath, ignores, function(__err, res) {
            if (__err) {
              return callback(__err)
            }

            list = list.concat(res)
            pending -= 1
            if (!pending) {
              return callback(null, list)
            }
          })
        } else {
          dataLayer.addFile(newFile(filePath, stats));
          pending -= 1
          if (!pending) {
            return callback(null, list)
          }
        }

      })
    })
  })
}

module.exports = readdir