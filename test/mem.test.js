;(function(global) {
    function factory(mem, chai, sinon, mocha) {

        return describe('mem', function() {
            it ('should be available', function() {
                chai.expect(sample_module).to.eql({sample:'module'});
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