
const webpack_es6 = require('./webpack.config.js');

let webpack_es6_min = Object.assign({}, webpack_es6, {
    output: Object.assign({}, webpack_es6.output, { filename: "index.min.js" }),
    mode: 'production',
})


let webpack_es5 = Object.assign({}, webpack_es6, {
    entry: __dirname + "/out-es5/index.js",
    output: Object.assign({}, webpack_es6.output, { filename: "index.es5.js" }),
})

let webpack_es5_min = Object.assign({}, webpack_es5, {
    output: Object.assign({}, webpack_es6.output, { filename: "index.es5.min.js" }),
    mode: 'production',
})

module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        shell: {
            src: {
                command: `tsc -p src`
            },
        },
        webpack: {
            es6: webpack_es6,
            es6_min: webpack_es6_min,
            es5: webpack_es5,
            es5_min: webpack_es5_min,
        },
        babel: {
            options: {
                sourceMap: true,
                presets: [
                    ['@babel/preset-env', {
                        targets: {
                            "chrome": "58",
                            "ie": "11"
                        }
                    }]
                ]
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'out',
                    src: ['**/*.js'],
                    dest: 'out-es5/'
                }]
            }
        },
        requirejs: {
            chitu: {
                options: {
                    baseUrl: "out",
                    include: [
                        "index", //"maishu-chitu-react", "maishu-dilu", "maishu-ui-toolkit",
                    ],
                    out: "dist/index.min.js",
                    paths: {
                        "maishu-chitu-service": "empty:"
                    },
                    // optimize: "none"
                }
            },
        }

    });

    grunt.registerTask('default', ['shell:src', 'babel', 'webpack']);
}