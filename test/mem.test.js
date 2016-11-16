var chai = require('chai');
var sinon = require('sinon');
var mem = require('./../src/mem');

function withMemErrorsSync (action) {
  var backup = global.setTimeout;
  global.setTimeout = function (callback) {
    try {
      callback();
    } catch (error) {
      global.setTimeout = backup;
      throw error;
    }
  };

  action();

  global.setTimeout = backup;
}

describe('mem', function () {
  afterEach(function () {
    mem._subjects = [];
  });

  it('should trigger events', function () {
    var subject = {};
    var done = false;
    mem.on(subject, 'event', function () {
      done = true;
    });

    withMemErrorsSync(function () {
      mem.trigger(subject, 'event');
    });

    chai.assert.equal(done, true, 'Event listener should have been executed');
  });

  it('should transmit arguments to event handlers', function () {
    var subject = {};
    mem.on(subject, 'event', function (arg1, arg2, arg3, arg4) {
      chai.assert.equal(arg1, 'one argument');
      chai.assert.equal(arg2, 'another one');
      chai.assert.equal(arg3, 42);
      chai.assert.equal(arg4, undefined);
    });

    withMemErrorsSync(function () {
      mem.trigger(subject, 'event', 'one argument', 'another one', 42);
    });
  });

  it('should trigger events on all listeners and get results', function () {
    var subject = {};

    function count () {
      count.val = (count.val || 0) + 1;
    }

    mem.on(subject, 'event', function () {
      count();
      return 1;
    });

    mem.on(subject, 'event', function () {
      count();
      return 2;
    });

    var results;
    withMemErrorsSync(function () {
      results = mem.trigger(subject, 'event');
    });

    chai.assert.deepEqual(results, [1, 2]);
    chai.assert.equal(count.val, 2);
  });

  it('should stop listening to events after a general off', function () {
    var subject1 = {};
    var subject2 = {};
    var callback1 = sinon.stub();
    var callback2 = sinon.stub();

    mem.on(subject1, 'event1', callback1);
    mem.on(subject2, 'event2', callback2);
    mem.off();

    withMemErrorsSync(function () {
      mem.trigger(subject1, 'event1');
      mem.trigger(subject2, 'event2');
    });

    chai.assert.equal(callback1.callCount, 0);
    chai.assert.equal(callback2.callCount, 0);
  });

  it('should trigger events only once on listeners that provide the once option', function () {
    var subject = {};
    var eventCallback = sinon.stub();

    mem.on(subject, 'event', eventCallback, {
      once: true
    });

    withMemErrorsSync(function () {
      mem.trigger(subject, 'event');
      mem.trigger(subject, 'event');
    });

    chai.assert.equal(eventCallback.callCount, 1);
  });

  it('should trigger events on all listeners execept "offed" ones', function () {
    var subject = {};
    var count = sinon.stub();

    function count2 () {
      count();
    }

    mem.on(subject, 'event', count);

    mem.on(subject, 'event', count);

    mem.on(subject, 'event', count2);
    mem.off(subject, 'event', count2);

    withMemErrorsSync(function () {
      mem.trigger(subject, 'event');
    });

    chai.assert.equal(count.callCount, 2, 'count should have been called 2 times');
  });

  it('off will remove ALL matching listeners', function () {
    var subject1 = {};
    var subject2 = {};

    var count1 = sinon.stub();
    var count2 = sinon.stub();

    mem.on(subject1, 'event', count1);
    mem.on(subject1, 'event', count1);
    mem.on(subject1, 'event2', count1);

    mem.on(subject1, 'event', count2);
    mem.on(subject1, 'event', count2);
    mem.on(subject1, 'event2', count2);

    mem.on(subject2, 'event', count1);
    mem.on(subject2, 'event', count2);

    mem.off(subject1, 'event', count1);

    withMemErrorsSync(function () {
      mem.trigger(subject1, 'event');
    });

    chai.assert.equal(count1.callCount, 0, 'should not execute count1');
    chai.assert.equal(count2.callCount, 2, 'should execute count2 2 times');
  });

  it("An error in a listener won't break all listeners", function () {
    var subject = {};
    var errors = [];

    var count1 = sinon.stub().returns('result');
    var count2 = sinon.stub().throws(new Error('sample error'));
    var count3 = sinon.stub().returns('result');

    mem.on(subject, 'event', count1);
    mem.on(subject, 'event', count2);
    mem.on(subject, 'event', count3);

    mem.on(mem, 'error', function (subject, eventName, error, context, action, args) {
      errors.push({
        subject: subject,
        eventName: eventName,
        error: error,
        context: context,
        action: action,
        args: args
      });
    });

    var results = mem.trigger(subject, 'event');

    chai.assert.equal(count1.callCount, 1);
    chai.assert.equal(count3.callCount, 1);
    chai.assert.deepEqual(results, ['result', 'result']);
    chai.expect(errors.length).to.equal(1);
    chai.expect(errors[0].error.message).to.equal('sample error');
    chai.expect(errors[0].subject).to.equal(subject);
    chai.expect(errors[0].eventName).to.equal('event');
    chai.expect(errors[0].context).to.equal(undefined);
    chai.expect(errors[0].action).to.equal(count2);
  });

  it('should execute callback with subject as execution context', function () {
    var subject = {};
    var context = {
      method: function () {
        chai.assert.equal(this, subject);
      }
    };

    mem.on(subject, 'event', context.method);

    withMemErrorsSync(function () {
      mem.trigger(subject, 'event');
    });
  });

  it("should be possible to set callback's execution context with context option", function () {
    var subject = {};
    var context = {
      method: function () {
        chai.assert.equal(this, context);
      }
    };

    mem.on(subject, 'event', context.method, {
      context: context
    });

    withMemErrorsSync(function () {
      mem.trigger(subject, 'event');
    });
  });

  it("should be possible to force callback's arguments with args option", function () {
    var subject = {};
    var context = {
      method: function () {
        var args = [].slice.call(arguments);
        chai.assert.deepEqual(args, ['argf1', 'argf2', 'arg1', 'arg2']);
      }
    };

    mem.on(subject, 'event', context.method, {
      args: ['argf1', 'argf2']
    });

    withMemErrorsSync(function () {
      mem.trigger(subject, 'event', 'arg1', 'arg2');
    });
  });

  it('should catch errors and broadcast them as a mem  "error" event', function () {
    var subject = {};
    var gotError = false;

    mem.on(subject, 'event', function () {
      throw new Error('error');
    });

    mem.on(mem, 'error', function (subject, eventName, error, context, action, args) {
      gotError = true;
      chai.assert.equal(error.message, 'error');
    });

    withMemErrorsSync(function () {
      mem.trigger(subject, 'event');
    });

    chai.assert.equal(gotError, true);
  });

  it('should throw global error if there\'s no listenner for mem "error" events', function () {
    var subject = {};
    var gotError = false;
    var backup = global.setTimeout;
    global.setTimeout = function (callback) {
      global.setTimeout = backup;

      try {
        callback();
      } catch (error) {
        gotError = true;
        chai.assert.equal(error.message, 'mem error event uncaught: error');
      }
    };

    mem.on(subject, 'event', function () {
      throw new Error('error');
    });

    mem.trigger(subject, 'event');

    chai.assert.equal(gotError, true);
  });

  it('should throw global error if there\'s an error in a mem "error" listenner', function () {
    var subject = {};
    var gotError = false;
    var backup = global.setTimeout;
    global.setTimeout = function (callback) {
      global.setTimeout = backup;

      try {
        callback();
      } catch (error) {
        gotError = true;
        chai.assert.equal(error.message, 'mem error event listener error: error2');
      }
    };

    mem.on(subject, 'event', function () {
      throw new Error('error1');
    });

    mem.on(mem, 'error', function () {
      throw new Error('error2');
    });

    mem.trigger(subject, 'event');

    chai.assert.equal(gotError, true);
  });

  it('should not allow recusion', function () {
    var subject = {};
    var errors = [];

    mem.on(subject, 'event', function () {
      mem.trigger(subject, 'event');
    });

    mem.on(mem, 'error', function (sub, evname, error) {
      errors.push(error);
    });

    withMemErrorsSync(function () {
      mem.trigger(subject, 'event');
    });

    chai.assert.equal(errors[0].message, 'mem event recursion not allowed: event on [object Object]');
  });

  it('should cleanup recursion detector after each run', function () {
    var subject = {};
    var count = sinon.stub();

    mem.on(subject, 'event', count);

    withMemErrorsSync(function () {
      mem.trigger(subject, 'event');
      mem.trigger(subject, 'event');
    });

    chai.assert.equal(count.callCount, 2, 'mem event recursion not allowed');
  });

  it('Avoid a recursion detector bug in specific case after triggering a not yet listened event', function () {
    var subject = {};

    mem.on(subject, 'event', function () {});

    withMemErrorsSync(function () {
      mem.trigger(subject, 'event2');
    });

    mem.on(subject, 'event2', function () {});

    withMemErrorsSync(function () {
      mem.trigger(subject, 'event2');
    });
  });

  it('should be possible to use mem.off during a mem event on the same subject', function () {
    var subject = {};

    function callback1 () {
      mem.off(subject, 'event2', callback2);
    }

    var callback2 = sinon.stub();

    mem.on(subject, 'event1', callback1);
    mem.on(subject, 'event2', callback2);

    withMemErrorsSync(function () {
      mem.trigger(subject, 'event1');
      mem.trigger(subject, 'event2');
    });

    chai.assert.equal(callback2.callCount, 0, 'Callback2 should not be called');
  });

  it('should be possible to catch all orphan events on mem', function () {
    var subject = {};
    var called = false;

    mem.on(mem, 'orphan_event', function (sub, eventName, args) {
      chai.assert.equal(sub, subject, 'sub should be the expected subject');
      chai.assert.equal(eventName, 'event', 'Callback2 should not be called');
      chai.assert.deepEqual(args, [], 'event arguments should be an empty array');
      called = true;
    });

    withMemErrorsSync(function () {
      mem.trigger(subject, 'event');
    });

    chai.assert.equal(called, true);
  });

  it('should be possible to set iteration number for callbacks', function () {
    var subject = {};
    var count1 = 0;
    var count2 = 0;
    var count3 = 0;
    var count4 = 0;

    mem.on(subject, 'event', function () {
      count1 += 1;
    }, {
      iterations: 3
    });

    mem.on(subject, 'event', function () {
      count2 += 1;
    }, {
      iterations: 1
    });

    mem.on(subject, 'event', function () {
      count3 += 1;
    });

    mem.on(subject, 'event', function () {
      count4 += 1;
    }, {
      once: true
    });

    mem.trigger(subject, 'event');
    mem.trigger(subject, 'event');
    mem.trigger(subject, 'event');
    mem.trigger(subject, 'event');
    mem.trigger(subject, 'event');
    mem.trigger(subject, 'event');
    mem.trigger(subject, 'event');

    chai.assert.equal(count1, 3);
    chai.assert.equal(count2, 1);
    chai.assert.equal(count3, 7);
    chai.assert.equal(count4, 1);
  });

  it('should be possible to get a "event_tracked" event on the subject when adding a listener', function () {
    var subject = {};
    var called = false;

    mem.on(subject, 'event_tracked', function (eventName) {
      chai.assert.equal(eventName, 'event');
      called = true;
    });

    withMemErrorsSync(function () {
      mem.on(subject, 'event', function () {});
    });

    chai.assert.equal(called, true);
  });

  it('should be possible to get a "event_untracked" event on the subject when removing a listener', function () {
    var subject = {};
    function listener1 () {}
    function listener2 () {}
    var listenerUntrack = sinon.spy();

    mem.on(subject, 'event_untracked', listenerUntrack);

    withMemErrorsSync(function () {
      mem.on(subject, 'event', listener1);
      mem.on(subject, 'event', listener2);
      mem.on(subject, 'event1', listener1);
      mem.off(subject, 'event', listener1);
      mem.off(subject, 'event', listener2);
    });

    chai.assert.equal(listenerUntrack.callCount, 1);
    chai.assert.equal(listenerUntrack.calledWith('event'), true);
  });

  it('should be possible to get a "event_untracked" event on the subject when listener passes iterations limit', function () {
    var subject = {};
    function listener1 () {}
    var listenerUntrack = sinon.spy();

    mem.on(subject, 'event_untracked', listenerUntrack);

    withMemErrorsSync(function () {
      mem.on(subject, 'event', listener1, { once: true });

      mem.trigger(subject, 'event');
    });

    chai.assert.equal(listenerUntrack.callCount, 1);
    chai.assert.equal(listenerUntrack.calledWith('event'), true);
  });
});
