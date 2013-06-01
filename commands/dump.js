var sortAndRank = require('../lib/sortandrank');
var validate = require('../lib/validate');
var fsPath = require('path');
var fs = require('fs');

function Dump(rli, client) {
  this.rli = rli;
  this.client = client;
}

Dump.prototype = {
  action: function(line, callback) {
    var client = this.client;


    function dump(db, store) {
      var file = fsPath.join(
        process.cwd(),
        'dump-' + db + '-' + store + '-' + Date.now() + '.json'
      );

      fs.appendFileSync(file, '[');
      var row = 0;

      var all = client.all(db, store);
      all.on('data', function(data) {
        console.log('WRITE:', row);
        var content = JSON.stringify(data);
        if (row++ !== 0) {
          content = ',' + content;
        }
        fs.appendFileSync(file, content);
      });

      all.on('error', function(err) {
        console.log('Error:', err);
        callback();
      });

      all.on('end', function() {
        fs.appendFileSync(file, ']');
        console.log('saved to file:', file);
        callback();
      });
    }

    validate(this.client, line).
      // <db>, <store>
      objectStore(1, 2).
      complete(dump);
  },

  help: function() {
    return '<db> <store> Dumps contents of ' +
           'database/object store to a json file';
  },

  completer: function(line, callback) {
    var parts = line.split(' ');

    if (parts.length <= 2) {
      return this.completeDb(
        parts.slice(0).join('') + ' ',
        parts.slice(1),
        callback
      );
    }

    if (parts.length <= 3)
      return this.completeStore(
        parts.slice(0, 2).join(' ') + ' ',
        parts.slice(1),
        callback
      );

    // no completions required...
    callback(null, [[], line]);
  },

  completeDb: function(line, parts, callback) {
    this.client.databases(function(err, list) {
      var db = parts[0];
      var results = sortAndRank(list, function(part) {
        return part.indexOf(db);
      });

      callback(null, [results, db]);
    });
  },

  completeStore: function(line, parts, callback) {
    var db = parts[0];
    var store = parts[1] || ' ';

    this.client.objectStores(db, function(err, list) {
      var results = sortAndRank(list, function(part) {
        return part.indexOf(store);
      });

      callback(null, [results, store]);
    });
  }
};

module.exports = Dump;

