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

            it ('off will remove ALL matching listeners', function(done) {
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
                mem.on(subject, 'event', count2);

                mem.off(subject, 'event', count);

                mem.trigger(subject, 'event');
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
        define(['../mem', 'chai', 'sinon', 'mocha'], factory);
    } else {
        // Browser globals
        factory(global.mem, global.chai, global.sinon, global.mocha);
    }
}(this));