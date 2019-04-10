module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

    let pkg = grunt.file.readJSON('package.json');

    let license = `
/*
 * CHITU v${pkg.version}
 * https://github.com/ansiboy/chitu
 *
 * Copyright (c) 2016-2018, shu mai <ansiboy@163.com>
 * Licensed under the MIT License.
 *
 */`;

    grunt.initConfig({
        browserify: {
            dist: {
                files: {
                    'dist/index.js': ['out/index.js']
                }
            },
            options: {
                banner: license,
                external: ['maishu-chitu-service'],
            },
        },
        shell: {
            src: {
                command: `tsc -p src`
            }
        }
    });

    grunt.registerTask('default', ['shell', 'browserify']);// 'babel', 
}