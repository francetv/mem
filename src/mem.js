;
(function(global) {
    "use strict";

    function factory() {
        function slice(args, n) {
            return Array.prototype.slice.call(args, n);
        }

        return {
            _callbacks: [],

            on: function on(subject, eventName, action, options) {
                this._callbacks.push({
                    subject: subject,
                    eventName: eventName,
                    action: action,
                    once: options && options.once,
                    context: options && options.context,
                    args: options && options.args
                });
            },

            off: function off(subject, eventName, action) {
                this._callbacks = this._callbacks.filter(function(callback) {
                    if (subject && callback.subject !== subject) {
                        return true;
                    }

                    if (eventName && callback.eventName !== eventName) {
                        return true;
                    }

                    if (action && callback.action !== action) {
                        return true;
                    }

                    return false;
                });
            },

            trigger: function trigger(subject, eventName) {
                var args = slice(arguments, 2);

                this._callbacks = this._callbacks.filter(function(callback) {
                    var keep = !callback.once;
                    var forceArgs = callback.args || [];
                    if (callback.subject !== subject) {
                        return true;
                    }

                    if (callback.eventName !== eventName) {
                        return true;
                    }

                    try {
                        callback.action.apply(callback.context || subject, forceArgs.concat(args));
                    } catch (error) {
                        if (console && console.error) {
                            console.error(error);
                        }
                    }
                    return keep;
                });
            }
        };
    }

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        global.mem = factory();
    }
}(this));