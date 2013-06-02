function cli(client) {
  var util = require('util');

  var readline = require('readline');
  var program = require('commander');
  var prompt = 'idb remote> ';
  var sortAndRank = require('./lib/sortandrank');

  function colorize(array, type) {
    return array.map(function(item) {
      return item[type];
    });
  }

  function determineCommand(line) {
    var name =  line.split(' ')[0];

    if (name in commands)
      return commands[name];

    return commands.help;
  }

  function defaultCompleter(line, callback) {
    // no line content
    if (!line.trim()) {
      return callback(
        null,
        [Object.keys(commands), line]
      );
    }

    // best guess at command
    var command = line.split(' ')[0];

    // rank and sort
    var results = sortAndRank(Object.keys(commands), function(item) {
      return item.indexOf(command);
    });

    // display completer
    callback(null, [results, line]);
  }

  var rli = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: function(line, callback) {
      var command = determineCommand(line);
      if (!command || !command.completer) {
        return defaultCompleter(line, callback);
      }
      command.completer(line, callback);
    }
  });

  var commands = {
    help: {
      action: function(line, callback) {
        console.log('\nRemote IDB'.bold);
        Object.keys(commands).forEach(function(name) {
          var command = commands[name];
          if (command.help) {
            console.log('  %s - %s', name.green, command.help().white);
          }
        });
        console.log();
        callback && callback();
      }
    },

    exit: {
      help: function() {
        return 'close prompt';
      },

      action: function(line, callback) {
        process.exit();
        callback();
      }
    },

    databases:
      new (require('./commands/databases'))(rli, client),

    objectStores:
      new (require('./commands/objectstores'))(rli, client),

    dump:
      new (require('./commands/dump'))(rli, client)
  };

  // show the help menu
  commands.help.action();

  rli.setPrompt(prompt.blue, prompt.length);
  rli.prompt();

  rli.on('line', function(line) {
    determineCommand(line).action(line, function() {
      rli.prompt();
    });
  });
}

module.exports = cli;
