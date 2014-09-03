;(function(global) {
    function factory(mem, chai, sinon, mocha) {

        return describe('mem', function() {
            afterEach(function() {
                mem._callbacks = [];

                if (console.error.restore) {
                    console.error.restore();
                }
            });

            it ('should trigger events', function(done) {
                var subject = {};
                mem.on(subject, 'event', function() {
                    done();
                });

                mem.trigger(subject, 'event');
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
                sinon.stub(console, 'error');

                var subject = {};

                function count() {
                    count.val = (count.val || 0) + 1;

                    if (count.val === 2) {
                        chai.expect(console.error.called).to.equal(true);
                        done();
                    }
                }

                function count2() {
                    throw new Error('sample error');
                }

                mem.on(subject, 'event', count);
                mem.on(subject, 'event', count2);
                mem.on(subject, 'event', count);

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