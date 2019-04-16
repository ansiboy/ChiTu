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
        browserify: {
            dist: {
                files: {
                    'dist/index.js': ['out/index.js']
                }
            },
            options: {
                banner: license,
                browserifyOptions: {
                    standalone: pkg.name,
                },
                // external: ['maishu-chitu-service'],
                alias: [
                    `./node_modules/maishu-chitu-service/out/index.js:maishu-chitu-service`,
                ]
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