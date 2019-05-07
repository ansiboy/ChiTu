let node_modules = 'node_modules'

const webpackES6Config = require('./webpack.config.js');
let webpackES5Config = Object.assign({}, webpackES6Config)
webpackES5Config.entry = __dirname + "/out/es5/index.js"//已多次提及的唯一入口文件
webpackES5Config.output.filename = "index.es5.js"

module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

    let pkg = grunt.file.readJSON('package.json');

    let license = `
/*
 * ${pkg.name} v${pkg.version}
 * https://github.com/ansiboy/chitu
 *
 * Copyright (c) 2016-2018, shu mai <ansiboy@163.com>
 * Licensed under the MIT License.
 *
 */`;

    grunt.initConfig({
        shell: {
            src: {
                command: `tsc -p src`
            },
            // webpack: {
            //     command: `webpack`
            // }
        },
        webpack: {
            es6: webpackES6Config,
            es5: webpackES5Config,
        },
        babel: {
            options: {
                sourceMap: true,
                presets: ['@babel/preset-env']
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'out/es6',
                    src: ['**/*.js'],
                    dest: 'out/es5/'
                }]
            }
        },

    });

    grunt.registerTask('default', ['shell:src', 'babel', 'webpack']);
}