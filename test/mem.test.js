;(function(global) {
    function factory(mem, chai, sinon, mocha) {

        return describe('mem', function() {
            afterEach(function() {
                mem._callbacks = [];
            });

            it ('should trigger events', function(done) {
                var subject = {};
                mem.on(subject, 'event', function() {
                    done();
                });

                mem.trigger(subject, 'event');
            });

            it ('should transmit arguments to event handlers', function(done) {
                var subject = {};
                mem.on(subject, 'event', function(arg1, arg2, arg3, arg4) {
                    chai.assert.equal(arg1, 'one argument');
                    chai.assert.equal(arg2, 'another one');
                    chai.assert.equal(arg3, 42);
                    chai.assert.equal(arg4, undefined);
                    done();
                });

                mem.trigger(subject, 'event', 'one argument', 'another one', 42);
            });

            it ('should trigger events on all listeners', function(done) {
                var subject = {};

                function count() {
                    count.val = (count.val || 0) + 1;

                    if (count.val === 2) {
                        done();
                    }
                }

                mem.on(subject, 'event', function() {
                    count();
                });

                mem.on(subject, 'event', function() {
                    count();
                });

                mem.trigger(subject, 'event');
            });

            it('should stop listening to events after a general off', function() {
                var subject1 = {};
                var subject2 = {};
                var callback1 = sinon.stub();
                var callback2 = sinon.stub();

                mem.on(subject1, 'event1', callback1);
                mem.on(subject2, 'event2', callback2);
                mem.off();
                mem.trigger(subject1, 'event1');
                mem.trigger(subject2, 'event2');
                chai.assert.equal(callback1.callCount, 0);
                chai.assert.equal(callback2.callCount, 0);
            });

            it ('should trigger events only once on listeners that provide the once option', function() {
                var subject = {};
                var eventCallback = sinon.stub();

                mem.on(subject, 'event', eventCallback, {once: true});

                mem.trigger(subject, 'event');
                mem.trigger(subject, 'event');
                chai.assert.equal(eventCallback.callCount, 1);
            });

            it ('should trigger events on all listeners execept "offed" ones', function(done) {
                var subject = {};

                function count() {
                    count.val = (count.val || 0) + 1;

                    if (count.val === 2) {
                        done();
                    }
                }

                function count2() {
                    count();
                }

                mem.on(subject, 'event', count);

                mem.on(subject, 'event', count);

                mem.on(subject, 'event', count2);
                mem.off(subject, 'event', count2);

                mem.trigger(subject, 'event');
            });

            it ('off will remove ALL matching listeners', function() {
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

                mem.trigger(subject1, 'event');

                chai.assert.equal(count1.callCount, 0, 'should not execute count1');
                chai.assert.equal(count2.callCount, 2, 'should execute count2 2 times');
            });

            it ('An error in a listener won\'t break all listeners', function(done) {
                var subject = {};
                var errors = [];

                function count() {
                    count.val = (count.val || 0) + 1;

                    if (count.val === 2) {
                        chai.expect(errors.length).to.equal(1);
                        chai.expect(errors[0].message).to.equal('sample error');
                        done();
                    }
                }

                function count2() {
                    throw new Error('sample error');
                }

                mem.on(subject, 'event', count);
                mem.on(subject, 'event', count2);
                mem.on(subject, 'event', count);

                mem.on(mem, 'error', function(error) { errors.push(error); });

                mem.trigger(subject, 'event');
            });

            it('should execute callback with subject as execution context', function(done) {
                var subject = {};
                var context = {
                    method: function() {
                        setTimeout(function() {
                            chai.assert.equal(this, subject);
                            done();
                        }.bind(this), 0);
                    }
                };

                mem.on(subject, 'event', context.method);

                mem.trigger(subject, 'event');
            });

            it('should be possible to set callback\'s execution context with context option', function(done) {
                var subject = {};
                var context = {
                    method: function() {
                        setTimeout(function() {
                            chai.assert.equal(this, context);
                            done();
                        }.bind(this), 0);
                    }
                };

                mem.on(subject, 'event', context.method, { context: context });

                mem.trigger(subject, 'event');
            });

            it('should be possible to force callback\'s arguments with args option', function(done) {
                var subject = {};
                var context = {
                    method: function() {
                        var args = [].slice.call(arguments);
                        setTimeout(function() {
                            chai.assert.deepEqual(args, ['argf1', 'argf2', 'arg1', 'arg2']);
                            done();
                        }.bind(this), 0);
                    }
                };

                mem.on(subject, 'event', context.method, { args: ['argf1', 'argf2'] });

                mem.trigger(subject, 'event', 'arg1', 'arg2');
            });

            it('should catch errors and broadcast them as a mem  "error" event', function(done) {
                var subject = {};

                mem.on(subject, 'event', function() {
                    throw new Error('error');
                });

                mem.on(mem, 'error', function(error) {
                    chai.assert.equal(error.message, 'error');
                    done();
                });

                mem.trigger(subject, 'event');
            });
        });

    }

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['mem', 'chai', 'sinon', 'mocha'], factory);
    } else {
        // Browser globals
        factory(mem, chai, sinon, mocha);
    }
}(this));