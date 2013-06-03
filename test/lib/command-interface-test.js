var assert = require('assert');

suite('command interface', function() {
  var Command = require('../../lib/command-interface').Command;

  suite('#Command', function() {

    test('#create', function() {
      var myCommand = Command.create({
        action: function() {
        }
      });

      // create an instance
      var command = new myCommand({ x: true });

      assert(command instanceof Command, 'is instanceof Command');
      assert.equal(command.x, true, 'set x');
    });
  });


  var CommandInterface =
    require('../../lib/command-interface').CommandInterface;
  var subject;

  var client = {};
  var stub = {};
  var options;

  setup(function() {
    options = {
      client: client,
      stub: stub
    };

    subject = new CommandInterface(options);
  });

  teardown(function() {
    subject.close();
  });

  test('initialization', function() {
    assert.ok(subject.rli, 'has rli');

    assert.equal(subject.options.client, client);
    assert.equal(subject.options.stub, stub);
    assert.equal(subject.options.commandInterface, subject);
  });

  suite('#register', function() {
    var command;
    var instance;
    setup(function() {
      command = Command.create({
        action: function() {}
      });

      subject.register('foo', command);
      instance = subject.commands.foo;
    });

    test('instance', function() {
      assert(instance instanceof command, 'creates instance');
    });

    test('options', function() {
      for (var key in subject.options) {
        assert.equal(instance[key], subject.options[key], 'has: ' + key);
      }
    });
  });

  test('#commandFactory', function() {
    subject.commandFactory('foo', {
      action: function() {}
    });

    assert.ok(subject.commands.foo, 'registers foo');
  });

  suite('#defaultCompleter', function() {
    setup(function() {
      // register some commands
      subject.commandFactory('yey', {
       action: function() {}
      });

      subject.commandFactory('woot', {
       action: function() {}
      });
    });

    test('all commands', function(done) {
      var input = ' ';
      subject.completer(input, function(err, complete) {
        assert.ok(!err);
        assert.deepEqual(
          complete,
          [Object.keys(subject.commands), input]
        );
        done();
      });
    });

    test('one match', function(done) {
      var input = 'ye';

      subject.completer(input, function(err, complete) {
        assert.ok(!err);
        assert.deepEqual(complete, [['yey'], input]);
        done();
      });
    });
  });

  suite('#determineCommand', function() {
    test('default command', function() {
      assert.equal(
        subject.determineCommand('xxx'),
        subject.commands[subject.defaultCommand]
      );
    });

    test('available command', function() {
      var command = subject.register('xfoo', {
        action: function() {}
      });

      assert.equal(subject.determineCommand('xfoo wow'), command);
    });
  });

  suite('invoke command', function() {
    setup(function(done) {
      subject.rli.prompt = function() {
        subject.rli.prompt = function() {};
        done();
      };
      subject.start();
    });

    test('action: with command', function(done) {
      var input = 'name wow';
      var isDone = false;
      // verify we resume prompt
      subject.rli.prompt = function() {
        done();
      };


      subject.commandFactory('name', {
        action: function(argv, callback) {
          assert.deepEqual(argv, input.split(' '));
          isDone = true;
          callback();
        }
      });

      subject.rli.emit('line', input);
    });

    test('completer', function(done) {
      var isDone = false;
      var complete = [['woot'], 'wo'];
      var input = 'name w';
      subject.commandFactory('name', {
        action: function() {
        },
        completer: function(argv, callback) {
          assert.deepEqual(argv, input.split(' '));
          isDone = true;
          callback(null, complete);
        }
      });

      subject.completer(input, function(err, _complete) {
        assert.ok(isDone);
        assert.ok(!err);
        assert.deepEqual(_complete, complete, 'completer results');
        done();
      });
    });
  });

});
