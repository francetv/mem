(function(global) {
    "use strict";

    function factory() {
        function slice(args, n) {
            return Array.prototype.slice.call(args, n);
        }

        var mem = {
            on: function on(subject, eventName, action, options) {
                var stack = mem._forSubject(subject);

                var isNewListener = !stack.callbacks.some(function(callback) {
                    return callback.eventName === eventName;
                });

                stack.callbacks.push({
                    eventName: eventName,
                    action: action,
                    iterations: (options && ((options.once && 1) || options.iterations)) || null,
                    context: options && options.context,
                    args: options && options.args
                });

                if (isNewListener && eventName !== mem._new_event_tracked_eventName) {
                    mem.trigger(subject, mem._new_event_tracked_eventName, eventName);
                }
            },

            off: function off(subject, eventName, action) {
                mem._subjects = mem._subjects.filter(function(stack) {
                    if (subject && stack.subject !== subject) {
                        return true;
                    }

                    stack.callbacks = stack.callbacks.filter(function(callback) {
                        if (eventName && callback.eventName !== eventName) {
                            return true;
                        }

                        if (action && callback.action !== action) {
                            return true;
                        }

                        return false;
                    });

                    return !!stack.callbacks.length;
                });
            },

            trigger: function trigger(subject, eventName) {
                var args = slice(arguments, 2);
                var gotCallback = false;
                var stack = mem._forSubject(subject);
                var results = [];

                if (stack.running && ~stack.running.indexOf(eventName)) {
                    var error = new Error(mem._msg_recusions_not_allowed + ': ' + eventName + ' on ' + subject.toString());
                    error.subject = subject;
                    error.eventName = eventName;
                    error.args = args;
                    throw error;
                }

                stack.running = stack.running || [];
                stack.running.push(eventName);

                stack.callbacks.forEach(function(callback) {
                    if (callback.eventName !== eventName) {
                        return;
                    }

                    gotCallback = true;

                    if (callback.iterations) {
                        callback.iterations-= 1;
                    }

                    var callArgs = (callback.args || []).concat(args);

                    try {
                        results.push(
                            callback.action.apply(callback.context || subject, callArgs)
                        );
                    } catch (error) {
                        if (!(subject === mem && eventName === mem._error_eventName)) {
                            mem.trigger(
                                mem,
                                mem._error_eventName,
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

                stack.callbacks = stack.callbacks.filter(function(callback) {
                    if (callback.eventName !== eventName) {
                        return true;
                    }

                    return callback.iterations !== 0;
                });

                stack.running = stack.running.filter(function(evtName) {
                    return eventName !== evtName;
                });

                // remove subject if no more listeners attached
                if (!stack.callbacks.length) {
                    mem._subjects = mem._subjects.filter(function(stack) {
                        if (stack.subject === subject) {
                            return false;
                        }
                        return true;
                    });
                }

                if (!gotCallback) {
                    if (subject === mem && eventName === mem._error_eventName) {
                        mem._fatal(
                            mem._msg_error_uncaught,
                            arguments[2],
                            arguments[3],
                            arguments[4],
                            arguments[5],
                            arguments[6],
                            arguments[7]
                        );
                    }
                    else if (eventName !== mem._orphan_eventName) {
                        mem.trigger(mem, mem._orphan_eventName, subject, eventName, args);
                    }
                }

                return results;
            },

            _new_event_tracked_eventName: 'event_tracked',
            _orphan_eventName: 'orphan_event',
            _error_eventName: 'error',
            _msg_error_uncaught: 'mem error event uncaught',
            _msg_error_listener_error: 'mem error event listener error',
            _msg_recusions_not_allowed: 'mem event recursion not allowed',

            _subjects: [],

            _forSubject: function _forSubject(subject) {
                var gotSubject;
                mem._subjects.some(function(stack) {
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

            _fatal: function _fatal(msg, subject, eventName, error, context, action, args) {
                var fatal = new Error(msg + ': ' + error.message);
                fatal.subject = subject;
                fatal.eventName = eventName;
                fatal.error = error;
                fatal.context = context;
                fatal.action = action;
                fatal.args = args;
                setTimeout(function() {
                    throw fatal;
                }, 0);
            }
        };

        return mem;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    }
    else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        global.mem = factory();
    }
}(this));