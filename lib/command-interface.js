var readline = require('readline');
var sortAndRank = require('./sortandrank');

function Command(options) {
  for (var key in options) {
    this[key] = options[key];
  }
}

Command.create = function(setup) {
  var command = function() {
    Command.apply(this, arguments);
  };

  command.prototype =
    Object.create(Command.prototype);


  if (typeof setup !== 'object')
    throw new Error('setup must be an object');

  if (typeof setup.action !== 'function')
    throw new Error('every command must have an action');

  for (var key in setup)
    command.prototype[key] = setup[key];

  return command;
};

module.exports.Command = Command;

function splitLine(input) {
  return input.split(' ');
}

HelpCommand = Command.create({
  action: function(line, callback) {
    var commands = this.commandInterface.commands;
    console.log('\nRemote IDB');
    Object.keys(commands).forEach(function(name) {
      var command = commands[name];
      if (command.help) {
        console.log('  %s - %s', name, command.help());
      }
    });
    console.log();
    callback && callback();
  }
});

function CommandInterface(options, rli) {
  this.options = {
    commandInterface: this
  };

  if (options) {
    for (var key in options) {
      this.options[key] = options[key];
    }
  }

  if (!rli) {
    rli = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: this.completer.bind(this)
    });
  }

  this.rli = rli;
  this.commands = {
    help: HelpCommand
  };

  this._handleLine = this._handleLine.bind(this);
}


CommandInterface.prototype = {

  defaultCommand: 'help',

  /**
   * Quick helper to add commands to the interface.
   *
   *    ci.commandFactory('exec', {
   *      action: function(argv, callback) {
   *        // ...
   *      }
   *    });
   *
   */
  commandFactory: function(name, setup) {
    var command = Command.create(setup);
    return this.register(name, command);
  },

  /**
   * Given a line determine the command.
   *
   *  var command = FoobarCommand();
   *  ci = new CommandInterface();
   *  ci.register('foobar', command);
   *
   *  ci.determineCommand('foobar yey');
   *  // => FoobarCommand
   *
   *  ci.determineCommand('huh');
   *  // => default help command
   */
  determineCommand: function(line) {
    var name = splitLine(line)[0];

    if (name in this.commands)
      return this.commands[name];

    return this.commands[this.defaultCommand];
  },

  /**
   * Default top level completer which tab
   * completes commands.
   */
  defaultCompleter: function(line, callback) {
    var commandList = Object.keys(this.commands);

    // no line content
    if (!line.trim()) {
      return callback(
        null,
        [commandList, line]
      );
    }

    // best guess at command
    var command = splitLine(line)[0];

    // rank and sort
    var results = sortAndRank(commandList, function(item) {
      return item.indexOf(command);
    });

    // display completer
    callback(null, [results, line]);
  },

  /**
   * Handles tab completion for readline interface.
   * Delegates to commands if a matching command is found.
   */
  completer: function(line, callback) {
    var command = this.determineCommand(line);
    if (!command || !command.completer) {
      return this.defaultCompleter(line, callback);
    }
    command.completer(splitLine(line), callback);
  },

  /**
   * Register an object or Command object to handle input.
   *
   *    ci.register('exec', { action: function() {} });
   *
   *    // now when the readline interface receives:
   *    "exec something" it will call the action on the command.
   *
   * If a function is given instead of an object it will be invoked
   * with the "new" keyword and passed this.options.
   */
  register: function(name, instance) {
    if (typeof instance === 'function') {
      instance = new instance(this.options);
    }
    return this.commands[name] = instance;
  },

  _handleLine: function(input) {
    // get argv to pass to action of command
    var argv = splitLine(input);

    // find command and execute action (async of course)
    this.determineCommand(input).action(
      argv,
      function() {
        // resume the prompt after action is complete
        this.rli.prompt();
      }.bind(this)
    );
  },

  close: function() {
    this.rli.close();
  },

  /**
   * Stop responding to line events on rli.
   */
  stop: function() {
    this.rli.removeListener('line', this._handleLine);
  },

  /**
   * Start listening to line events on the rli.
   * Optionally sets prompt and shows help message.
   *
   *    ci.start(
   *      'idb remote>', // prompt
   *      true // show help
   *    );
   */
  start: function(prompt, showHelp) {
    this.rli.on('line', this._handleLine);

    if (prompt)
      this.rli.setPrompt(prompt);

    if (showHelp)
      this.commands.help.action();
  }
};


module.exports.CommandInterface = CommandInterface;
