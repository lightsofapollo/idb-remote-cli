function Database(rli, client) {
  this.rli = rli;
  this.client = client;
}

Database.prototype = {
  action: function(line, callback) {
    this.client.databases(function(err, list) {
      if (err) {
        return callback(err);
      }

      console.log(list.map(function(item) {
        return item.white;
      }).join(' \n'));
      callback();
    }.bind(this));
  },

  help: function() {
    return 'displays all available databases';
  }
};

module.exports = Database;
