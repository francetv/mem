(function(global) {
    "use strict";

    function factory() {
        function slice(args, n) {
            return Array.prototype.slice.call(args, n);
        }

        var mem = {
            on: function on(subject, eventName, action, options) {
                this._forSubject(subject).callbacks.push({
                    eventName: eventName,
                    action: action,
                    once: options && options.once,
                    context: options && options.context,
                    args: options && options.args
                });
            },

            off: function off(subject, eventName, action) {
                this._callbacks = this._callbacks.filter(function(stack) {
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
                var stack = this._forSubject(subject);

                stack.callbacks = stack.callbacks.filter(function(callback) {
                    if (callback.eventName !== eventName) {
                        return true;
                    }
                    var forceArgs = callback.args || [];
                    gotCallback = true;
                    var keep = !callback.once;

                    try {
                        callback.action.apply(callback.context || subject, forceArgs.concat(args));
                    } catch (error) {
                        if (!(subject === mem && eventName === 'error')) {
                            mem.trigger(mem, 'error', error);
                        }
                        else {
                            mem._fatal(error);
                        }
                    }
                    return keep;
                });

                // remove subject if no more listeners attached
                if (!stack.callbacks.length) {
                    this._callbacks = this._callbacks.filter(function(stack) {
                        if (stack.subject === subject) {
                            return false;
                        }
                        return true;
                    });
                }

                if (subject === mem && eventName === 'error' && !gotCallback) {
                    mem._fatal(arguments[2]);
                }
            },

            _callbacks: [],

            _forSubject: function _forSubject(subject) {
                var gotSubject;
                this._callbacks.some(function(stack) {
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
                    this._callbacks.push(gotSubject);
                }

                return gotSubject;
            },

            _fatal: function _fatal(error) {
                setTimeout(function() {
                    throw error;
                }, 0);
            }
        };

        return mem;
    }

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        global.mem = factory();
    }
}(this));