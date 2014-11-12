(function(global) {
    function factory(mem, chai, sinon, mocha) {

        function withMemErrorsSync(action) {
            var backup = global.setTimeout;
            global.setTimeout = function(callback) {
                try {
                    callback();
                }
                catch (error) {
                    global.setTimeout = backup;
                    throw error;
                }
            };

            action();

            global.setTimeout = backup;
        }

        return describe('mem', function() {
            afterEach(function() {
                mem._subjects = [];
            });

            it ('should trigger events', function() {
                var subject = {};
                var done = false;
                mem.on(subject, 'event', function() {
                    done = true;
                });

                withMemErrorsSync(function() {
                    mem.trigger(subject, 'event');
                });

                chai.assert.equal(done, true, 'Event listener should have been executed');
            });

            it ('should transmit arguments to event handlers', function() {
                var subject = {};
                mem.on(subject, 'event', function(arg1, arg2, arg3, arg4) {
                    chai.assert.equal(arg1, 'one argument');
                    chai.assert.equal(arg2, 'another one');
                    chai.assert.equal(arg3, 42);
                    chai.assert.equal(arg4, undefined);
                });

                withMemErrorsSync(function() {
                    mem.trigger(subject, 'event', 'one argument', 'another one', 42);
                });
            });

            it('should trigger events on all listeners and get results', function() {
                var subject = {};

                function count() {
                    count.val = (count.val || 0) + 1;
                }

                mem.on(subject, 'event', function() {
                    count();
                    return 1;
                });

                mem.on(subject, 'event', function() {
                    count();
                    return 2;
                });

                var results;
                withMemErrorsSync(function() {
                    results = mem.trigger(subject, 'event');
                });

                chai.assert.deepEqual(results, [1, 2]);
                chai.assert.equal(count.val, 2);
            });

            it('should stop listening to events after a general off', function() {
                var subject1 = {};
                var subject2 = {};
                var callback1 = sinon.stub();
                var callback2 = sinon.stub();

                mem.on(subject1, 'event1', callback1);
                mem.on(subject2, 'event2', callback2);
                mem.off();

                withMemErrorsSync(function() {
                    mem.trigger(subject1, 'event1');
                    mem.trigger(subject2, 'event2');
                });

                chai.assert.equal(callback1.callCount, 0);
                chai.assert.equal(callback2.callCount, 0);
            });

            it('should trigger events only once on listeners that provide the once option', function() {
                var subject = {};
                var eventCallback = sinon.stub();

                mem.on(subject, 'event', eventCallback, {
                    once: true
                });

                withMemErrorsSync(function() {
                    mem.trigger(subject, 'event');
                    mem.trigger(subject, 'event');
                });

                chai.assert.equal(eventCallback.callCount, 1);
            });

            it ('should trigger events on all listeners execept "offed" ones', function() {
                var subject = {};
                var count = sinon.stub();

                function count2() {
                    count();
                }

                mem.on(subject, 'event', count);

                mem.on(subject, 'event', count);

                mem.on(subject, 'event', count2);
                mem.off(subject, 'event', count2);

                withMemErrorsSync(function() {
                    mem.trigger(subject, 'event');
                });

                chai.assert.equal(count.callCount, 2, 'count should have been called 2 times');
            });

            it('off will remove ALL matching listeners', function() {
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

                withMemErrorsSync(function() {
                    mem.trigger(subject1, 'event');
                });

                chai.assert.equal(count1.callCount, 0, 'should not execute count1');
                chai.assert.equal(count2.callCount, 2, 'should execute count2 2 times');
            });

            it('An error in a listener won\'t break all listeners', function() {
                var subject = {};
                var errors = [];

                var count1 = sinon.stub().returns('result');
                var count2 = sinon.stub().throws(new Error('sample error'));
                var count3 = sinon.stub().returns('result');

                mem.on(subject, 'event', count1);
                mem.on(subject, 'event', count2);
                mem.on(subject, 'event', count3);

                mem.on(mem, 'error', function(subject, eventName, error, context, action, args) {
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
                chai.assert.deepEqual(results, ['result','result']);
                chai.expect(errors.length).to.equal(1);
                chai.expect(errors[0].error.message).to.equal('sample error');
                chai.expect(errors[0].subject).to.equal(subject);
                chai.expect(errors[0].eventName).to.equal('event');
                chai.expect(errors[0].context).to.equal(undefined);
                chai.expect(errors[0].action).to.equal(count2);
            });

            it('should execute callback with subject as execution context', function() {
                var subject = {};
                var context = {
                    method: function() {
                        chai.assert.equal(this, subject);
                    }
                };

                mem.on(subject, 'event', context.method);

                withMemErrorsSync(function() {
                    mem.trigger(subject, 'event');
                });
            });

            it('should be possible to set callback\'s execution context with context option', function() {
                var subject = {};
                var context = {
                    method: function() {
                        chai.assert.equal(this, context);
                    }
                };

                mem.on(subject, 'event', context.method, {
                    context: context
                });

                withMemErrorsSync(function() {
                    mem.trigger(subject, 'event');
                });
            });

            it('should be possible to force callback\'s arguments with args option', function() {
                var subject = {};
                var context = {
                    method: function() {
                        var args = [].slice.call(arguments);
                        chai.assert.deepEqual(args, ['argf1', 'argf2', 'arg1', 'arg2']);
                    }
                };

                mem.on(subject, 'event', context.method, {
                    args: ['argf1', 'argf2']
                });

                withMemErrorsSync(function() {
                    mem.trigger(subject, 'event', 'arg1', 'arg2');
                });
            });

            it('should catch errors and broadcast them as a mem  "error" event', function() {
                var subject = {};
                var gotError = false;

                mem.on(subject, 'event', function() {
                    throw new Error('error');
                });

                mem.on(mem, 'error', function(subject, eventName, error, context, action, args) {
                    gotError = true;
                    chai.assert.equal(error.message, 'error');
                });

                withMemErrorsSync(function() {
                    mem.trigger(subject, 'event');
                });

                chai.assert.equal(gotError, true);
            });

            it('should throw global error if there\'s no listenner for mem "error" events', function() {
                var subject = {};
                var gotError = false;
                var backup = global.setTimeout;
                global.setTimeout = function(callback) {
                    global.setTimeout = backup;

                    try {
                        callback();
                    }
                    catch(error) {
                        gotError = true;
                        chai.assert.equal(error.message, 'mem error event uncaught: error');
                    }
                };

                mem.on(subject, 'event', function() {
                    throw new Error('error');
                });

                mem.trigger(subject, 'event');

                chai.assert.equal(gotError, true);
            });

            it('should throw global error if there\'s an error in a mem "error" listenner', function() {
                var subject = {};
                var gotError = false;
                var backup = global.setTimeout;
                global.setTimeout = function(callback) {
                    global.setTimeout = backup;

                    try {
                        callback();
                    }
                    catch(error) {
                        gotError = true;
                        chai.assert.equal(error.message, 'mem error event listener error: error2');
                    }
                };

                mem.on(subject, 'event', function() {
                    throw new Error('error1');
                });

                mem.on(mem, 'error', function(error) {
                    throw new Error('error2');
                });

                mem.trigger(subject, 'event');

                chai.assert.equal(gotError, true);
            });

            it('should not allow recusion', function() {
                var subject = {};
                var errors = [];

                mem.on(subject, 'event', function() {
                    mem.trigger(subject, 'event');
                });

                mem.on(mem, 'error', function(sub, evname, error) {
                    errors.push(error);
                });

                withMemErrorsSync(function() {
                    mem.trigger(subject, 'event');
                });

                chai.assert.equal(errors[0].message, 'mem event recursion not allowed: event on [object Object]');
            });

            it('should cleanup recursion detector after each run', function() {
                var subject = {};
                var count = sinon.stub();

                mem.on(subject, 'event', count);

                withMemErrorsSync(function() {
                    mem.trigger(subject, 'event');
                    mem.trigger(subject, 'event');
                });

                chai.assert.equal(count.callCount, 2, 'mem event recursion not allowed');
            });

            it('Avoid a recursion detector bug in specific case after triggering a not yet listened event', function() {
                var subject = {};

                mem.on(subject, 'event', function() {});

                mem.trigger(subject, 'event2');

                mem.on(subject, 'event2', function() {});

                withMemErrorsSync(function() {
                    mem.trigger(subject, 'event2');
                });
            });

            it('should clean correctly the stack with the off (not only inside the current trigger)', function() {
                var errors = [];
                var getStack = function getStack() {
                    return mem._subjects.filter(function(item) {
                        return item.subject === subject;
                    })[0].callbacks;
                };
                var subject = {};
                var events = [{
                    name: 'event1',
                    callback: function() {
                        var event = events[1];
                        mem.off(subject, event.name, event.callback);
                        chai.assert.equal(getStack().length, 1, 'mem stack for this subject should be clean');
                    }
                }, {
                    name: 'event2',
                    callback: function() {}
                }];

                mem.on(mem, 'error', function(subject, eventName, error) {
                    errors.push(error);
                });

                events.forEach(function(event) {
                    mem.on(subject, event.name, event.callback);
                });

                chai.assert.equal(getStack().length, 2, 'mem stack for this subject should be completely filled');

                mem.trigger(subject, 'event1');

                chai.assert.equal(errors.length, 0, errors.length > 1 ? 'error (' + errors[0].message + ')' : '');
                chai.assert.equal(getStack().length, 1, 'mem stack for this subject is never clean');

                mem.trigger(subject, 'event2');
            });
        });
    }

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['mem', 'chai', 'sinon', 'mocha'], factory);
    } else {
        // Browser globals
        factory(global.mem, global.chai, global.sinon, global.mocha);
    }
}(this));