var mem = {
  on: function on (subject, eventName, action, options) {
    var stack = mem._forSubject(subject);

    var isNewListener = !stack.callbacks.some(function (callback) {
      return callback.eventName === eventName;
    });

    stack.callbacks.push({
      eventName: eventName,
      action: action,
      iterations: (options && ((options.once && 1) || options.iterations)) || null,
      context: options && options.context,
      args: options && options.args
    });

    if (isNewListener && eventName !== mem._eventName_new_event_tracked) {
      mem.trigger(subject, mem._eventName_new_event_tracked, eventName);
    }
  },

  off: function off (subject, eventName, action) {
    var eventsOffIndex = {};
    mem._subjects = mem._subjects.filter(function (stack) {
      if (subject && stack.subject !== subject) {
        return true;
      }

      var eventsNbrIndex = {};

      stack.callbacks = stack.callbacks.filter(function (callback) {
        eventsNbrIndex[callback.eventName] = (eventsNbrIndex[callback.eventName] || 0) + 1;
        if (eventName && callback.eventName !== eventName) {
          return true;
        }

        if (action && callback.action !== action) {
          return true;
        }

        eventsNbrIndex[callback.eventName] -= 1;
        eventsOffIndex[callback.eventName] = true;

        return false;
      });

      Object.keys(eventsOffIndex).forEach(function (eventName) {
        if (!eventsNbrIndex[eventName]) {
          mem.trigger(stack.subject, mem._eventName_event_untracked, eventName);
        }
      });

      return !!stack.callbacks.length;
    });
  },

  trigger: function trigger (subject, eventName) {
    var args = Array.prototype.slice.call(arguments, 2);
    var gotCallback = false;
    var stack = mem._forSubject(subject);
    var results = [];

    // detect recursion loops (listener of an event trying to trigger this same event)
    if (stack.running && ~stack.running.indexOf(eventName)) {
      var error = new Error(mem._msg_recusions_not_allowed + ': ' + eventName + ' on ' + subject.toString());
      error.subject = subject;
      error.eventName = eventName;
      error.args = args;
      throw error;
    }

    stack.running = stack.running || [];
    stack.running.push(eventName);

    // exec matching listeners
    stack.callbacks.forEach(function (callback) {
      if (callback.eventName !== eventName) {
        return;
      }

      gotCallback = true;

      if (callback.iterations) {
        callback.iterations -= 1;
      }

      var callArgs = (callback.args || []).concat(args);

      try {
        results.push(
          callback.action.apply(callback.context || subject, callArgs)
        );
      } catch (error) {
        if (!(subject === mem && eventName === mem._eventName_error)) {
          mem.trigger(
            mem,
            mem._eventName_error,
            subject,
            eventName,
            error,
            callback.context,
            callback.action,
            callArgs
          );
        } else {
          mem._fatal(
            mem._msg_error_listener_error,
            subject,
            eventName,
            error,
            callback.context,
            callback.action,
            callArgs
          );
        }
      }
    });

    // clean recursion detector
    stack.running = stack.running.filter(function (evtName) {
      return eventName !== evtName;
    });

    if (gotCallback) {
      var stillHaveCallback = false;

      // Remove callbacks with iterations down to 0
      stack.callbacks = stack.callbacks.filter(function (callback) {
        if (callback.eventName !== eventName) {
          return true;
        }

        if (callback.iterations !== 0) {
          stillHaveCallback = true;
          return true;
        }

        return false;
      });

      // remove subject if no more listeners attached
      if (!stack.callbacks.length) {
        mem._subjects = mem._subjects.filter(function (stack) {
          return stack.subject !== subject;
        });
      }

      if (!stillHaveCallback) {
        mem.trigger(subject, mem._eventName_event_untracked, eventName);
      }
    } else {
      // no listener on a mem error event: it becomes an error sent to root error handler
      if (subject === mem && eventName === mem._eventName_error) {
        mem._fatal(
          mem._msg_error_uncaught,
          args[0], // subject
          args[1], // eventName
          args[2], // error
          args[3], // callback.context
          args[4], // callback.action
          args[5] // args
        );
      } else if (eventName !== mem._eventName_orphan) {
        // triggers special event orphan_event for each event triggered with no listener
        mem.trigger(mem, mem._eventName_orphan, subject, eventName, args);
      }
    }

    return results;
  },

  _eventName_new_event_tracked: 'event_tracked',
  _eventName_event_untracked: 'event_untracked',
  _eventName_orphan: 'orphan_event',
  _eventName_error: 'error',
  _msg_error_uncaught: 'mem error event uncaught',
  _msg_error_listener_error: 'mem error event listener error',
  _msg_recusions_not_allowed: 'mem event recursion not allowed',

  _subjects: [],

  _forSubject: function _forSubject (subject) {
    var gotSubject;
    mem._subjects.some(function (stack) {
      if (stack.subject !== subject) {
        return false;
      }
      gotSubject = stack;
      return true;
    });

    if (!gotSubject) {
      gotSubject = {
        subject: subject,
        callbacks: []
      };
      mem._subjects.push(gotSubject);
    }

    return gotSubject;
  },

  _fatal: function _fatal (msg, subject, eventName, error, context, action, args) {
    var fatal = new Error(msg + ': ' + error.message);
    fatal.subject = subject;
    fatal.eventName = eventName;
    fatal.error = error;
    fatal.context = context;
    fatal.action = action;
    fatal.args = args;
    setTimeout(function () {
      throw fatal;
    }, 0);
  }
};

module.exports = mem;
