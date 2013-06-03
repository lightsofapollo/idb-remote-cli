function Validate(client, argv) {
  if (!(this instanceof Validate))
    return new Validate(client, argv);

  this.argv = argv;
  this.client = client;
  this.parsed = [];
  this.pending = 0;
}

Validate.prototype = {
  _validate: function(part, handler) {
    var position = this.parsed.length;
    this.pending++;
    handler.call(this, this.argv[part], function(err, value) {
      if (err) {
        return this.oncomplete(err);
      }

      this.parsed[position] = value;
      this.pending--;

      process.nextTick(function() {
        if (this.pending <= 0) {
          return this.oncomplete.apply(this, [null].concat(this.parsed));
        }
      }.bind(this));
    }.bind(this));
  },

  database: function(pos, callback) {
    this._validate(pos, function(db, validateDone) {
      this.client.databases(function(err, list) {
        if (err)
          return callback(err);

        if (list.indexOf(db) === -1) {
          return callback(
            new Error('invalid database: "' + db +'"')
          );
        }

        // allow for chaining
        validateDone(null, db);
        callback && callback(db);
      });
    });
    return this;
  },

  objectStore: function(dbPos, objectStorePos, validateDone) {
    this.database(dbPos, function(db) {
      this._validate(objectStorePos, function(store, callback) {
        this.client.objectStores(db, function(err, list) {
          if (err)
            return callback(err);

          if (list.indexOf(store) === -1) {
            return callback(
              new Error('invalid objectStore: "' + store +'"')
            );
          }
          callback(null, store);
          validateDone && validateDone(store);
        });
      }.bind(this));
    }.bind(this));

    return this;
  },

  complete: function(fn) {
    this.oncomplete = fn;
    return this;
  }
};

module.exports = Validate;
