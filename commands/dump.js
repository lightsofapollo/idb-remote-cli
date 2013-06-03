var Command = require('../lib/command-interface').Command;
var sortAndRank = require('../lib/sortandrank');
var validate = require('../lib/validate');
var fsPath = require('path');
var fs = require('fs');

module.exports = Command.create({
  action: function(argv, callback) {
    var client = this.client;

    function dump(err, db, store) {
      if (err) {
        console.log('Error:', err);
        return callback();
      }

      if (!db || !store) {
        console.log('Error: missing db: "%s" or store: "%s"', db, store);
        return callback();
      }

      var file = fsPath.join(
        process.cwd(),
        'dump-' + db + '-' + store + '-' + Date.now() + '.json'
      );

      fs.appendFileSync(file, '[');
      var row = 0;

      var all = client.all(db, store);
      all.on('data', function(data) {
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

    validate(this.client, argv).
      // <db>, <store>
      objectStore(1, 2).
      complete(dump);
  },

  help: function() {
    return '<db> <store> Dumps contents of ' +
           'database/object store to a json file';
  },

  completer: function(argv, callback) {
    if (argv.length <= 2) {
      return this.completeDb(
        argv[1], // db
        callback
      );
    }

    if (argv.length <= 3)
      return this.completeStore(
        argv[1], // db
        argv[2], // store
        callback
      );

    // no completions required...
    callback(null, [[], line]);
  },

  completeDb: function(db, callback) {
    this.client.databases(function(err, list) {
      var results = sortAndRank(list, function(part) {
        return part.indexOf(db);
      });

      callback(null, [results, db]);
    });
  },

  completeStore: function(db, store, callback) {
    this.client.objectStores(db, function(err, list) {
      var results = sortAndRank(list, function(part) {
        return part.indexOf(store);
      });

      callback(null, [results, store]);
    });
  }
});
