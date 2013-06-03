var Command = require('../lib/command-interface').Command;

module.exports = Command.create({
  action: function(argv, callback) {
    this.client.databases(function(err, list) {
      if (err) {
        return callback(err);
      }

      console.log(list.join(' \n'));
      callback();
    }.bind(this));
  },

  help: function() {
    return 'displays all available databases';
  }
});
