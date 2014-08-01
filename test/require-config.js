// require the test file
var deps = __TEST_SUITES__.slice();
deps.unshift('mocha');

require.config({
    baseUrl: "../",
    paths: {
        'mocha': 'bower_components/mocha/mocha',
        'chai': 'bower_components/chai/chai',
        'sinon': 'bower_components/sinonjs/sinon'
    },
    shim: {
        mocha: {
            init : function() {
                mocha.setup('bdd');

                var runner = window.mochaPhantomJS ? window.mochaPhantomJS : mocha;

                return {
                    // setup: mocha.setup.bind(mocha),
                    run: function() {
                        runner.run();
                    }
                };
            }
        },
        sinon: {
            exports : 'sinon'
        }
    },
    deps: deps,
    callback: function callback(mocha) {
        mocha.run();
    }
});
