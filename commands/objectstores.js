var sortAndRank = require('../lib/sortandrank');

function ObjectStores(repl, client) {
  this.client = client;
  this.repl = repl;
}

ObjectStores.prototype = {
  _objectStore: function(db, callback) {
    this.client.objectStores(db, function(err, list) {
      process.stdout.write('\n');
      process.stdout.write(list.join('\n') + '\n');
      callback();
    });
  },

  action: function(line, callback) {
    var db = line.split(' ')[1] || '';
    var self = this;

    this.client.databases(function(err, list) {
      if (list.indexOf(db) === -1) {
        console.log(
          'database "%s" is invalid choose: [%s]'.white,
          db.red,
          list.map(function(item){ return item.green; }).join(', ')
        );
        return callback();
      }

      self._objectStore(db, callback);
    });
  },

  completer: function(line, callback) {
    var items = line.split(' ');
    var partial = items[1];
    var prefix = items[0] + ' ';

    this.client.databases(function(err, list) {
      var results = sortAndRank(list, prefix, function(item) {
        return item.indexOf(partial);
      });

      var item;

      callback(null,
        (item = (results.length ?
          [results, line] :
          [results, results[0]]))
      );
    });
  },

  help: function() {
    return "[database] shows all stores for given db";
  }
};

module.exports = ObjectStores;
