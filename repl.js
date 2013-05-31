function repl(client) {

  function listCommands() {
    process.stdout.write('\nCommands: \n\n');
    Object.keys(commands).forEach(function(command) {
      if (!commands[command].help)
        return;

      // help on the object not the instance
      process.stdout.write('  ' + command + ' - ' + commands[command].help(command) + '\n');
    });
    process.stdout.write('\n\n');
  }

  var repl = require('repl');
  var commands = {
    help: listCommands,
    exit: require('./commands/exit'),
    databases: require('./commands/databases'),
    objectStores: require('./commands/objectstores')
  };

  function input(cmd, context, filename, callback) {
    var len = cmd.length;
    var parts = cmd.slice(1, len - 2).split(' ');
    var type = parts[0];

    if (type in commands) {
      var issue = commands[type](client, replServer);
      if (issue && issue.action) {
        issue.action(parts.slice(1), callback);
      } else {
        callback();
      }
    } else {
      callback(null, commands.help());
    }
  }

  function output(command) {
    return '';
  }

  listCommands();

  var replServer = repl.start({
    prompt: 'idb remote> ',
    eval: input,
    writer: output
  });

}

module.exports = repl;
