let node_modules = 'node_modules'

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
            webpack: {
                command: `webpack`
            }
        }
    });

    grunt.registerTask('default', ['shell:src', 'shell:webpack']);
}