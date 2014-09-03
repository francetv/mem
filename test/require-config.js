(function(global, document, __TEST_SUITES__, __LIB_PATHS__, __BASE_URL__, __COMPONENTS_PATH__) {
    // require the test file
    var deps = __TEST_SUITES__.slice();
    deps.unshift('mocha');

    var paths = {
        'mocha': __COMPONENTS_PATH__ + 'mocha/mocha',
        'chai': __COMPONENTS_PATH__ + 'chai/chai',
        'sinon': __COMPONENTS_PATH__ + 'sinonjs/sinon'
    };

    if (__LIB_PATHS__) {
        Object.keys(__LIB_PATHS__).forEach(function(key) {
            paths[key] = __LIB_PATHS__[key];
        });
    }

    require.config({
        baseUrl: __BASE_URL__,
        paths: paths,
        shim: {
            mocha: {
                init : function() {
                    var setup = {
                        ui: "bdd"
                    };
                    var runner = global.mocha;

                    if (global.mochaPhantomJS) {
                        runner = global.mochaPhantomJS;

                        // In Phantomjs, specify grep value looking for #grep=pattern
                        var match = /#grep=(.*)/.exec(document.location.hash);
                        if (match) {
                            setup.grep = match[1];
                        }
                    }
                    else {
                        // In browser, add mocha styles
                        var mochaStyle = document.createElement('link');
                        mochaStyle.setAttribute('rel', 'stylesheet');
                        mochaStyle.setAttribute('href', paths.mocha + '.css');
                        document.head.appendChild(mochaStyle);
                    }

                    // Add root DOM element for mocha
                    var mochaRoot = document.createElement('div');
                    mochaRoot.id = 'mocha';
                    document.body.appendChild(mochaRoot);

                    global.mocha.setup(setup);

                    return {
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
            console.log(document.title);
            mocha.run();
        }
    });
}(this, this.document, this.__TEST_SUITES__, this.__LIB_PATHS__, this.__BASE_URL__, __COMPONENTS_PATH__));