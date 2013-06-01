function Validate(client, line) {
  if (!(this instanceof Validate))
    return new Validate(client, line);

  this.parts = line.split(' ');
  this.client = client;
  this.parsed = [];
  this.pending = 0;
}

Validate.prototype = {
  _validate: function(part, handler) {
    var position = this.parsed.length;
    handler.call(this, this.parts[part], function(err, value) {
      if (err) {
        return this.oncomplete(err);
      }

      this.parsed[position] = value;
      this.pending--;

      process.nextTick(function() {
        if (this.pending <= 0)
          return this.oncomplete.apply(this, this.parsed);
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

        validateDone(null, db);
        // allow for chaining
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
