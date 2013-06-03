function interface(client) {
  var CommandInterface =
    require('./lib/command-interface').CommandInterface;

  var prompt = 'idb remote> ';
  var ci = new CommandInterface({
    client: client
  });

  ci.register('databases', require('./commands/databases'));
  ci.register('objectstores', require('./commands/objectstores'));
  ci.register('dump', require('./commands/dump'));

  ci.commandFactory('exit', {
    action: function() {
      process.exit();
    },

    help: function() {
      return 'terminates session.';
    }
  });

  console.log('\n\nIDB Remote >');

  // start prompt show help
  ci.start(prompt, true);
}

module.exports = interface;
