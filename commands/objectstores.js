var sortAndRank = require('../lib/sortandrank');
var Command = require('../lib/command-interface').Command;

module.exports = Command.create({
  _objectStore: function(db, callback) {
    this.client.objectStores(db, function(err, list) {
      console.log();
      console.log(
        ' ',
        list.join('\n  ')
      );
      console.log();
      callback();
    });
  },

  action: function(argv, callback) {
    var db = argv[1] || '';
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

  completer: function(argv, callback) {
    var partial = argv[1];

    this.client.databases(function(err, list) {
      var results = sortAndRank(list, function(item) {
        return item.indexOf(partial);
      });

      var item;

      callback(null, [results, partial]);
    });
  },

  help: function() {
    return "[database] shows all stores for given db";
  }
});
