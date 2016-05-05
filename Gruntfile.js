var js_output_file = 'release/chitu.js';
var ts_output_file = 'release/chitu.d.ts';
var build_dir = 'build';
var release_dir = 'release';
module.exports = function(grunt) {
    var config = {
        typescript: {
            base: {
                src: ['src/**/*.ts'],
                dest: build_dir + '/chitu.js',
                options: {
                    basePath: build_dir,
                    target: 'es5',
                    removeComments: true,
                    declaration: true,
                    references: [
                        "src/**/*.ts"
                    ]
                }
            }
        },
        concat: {
//             chitudts: {
//                 options: {
//                     stripBanners: true,
//                     banner: '/// <reference path="jquery.d.ts" /> \r\n',
//                     footer: 'declare module "chitu" { \n\
//     export = chitu; \n\
// }\n'
//                 },
//                 src: [build_dir + '/**/*.d.ts'],
//                 dest: ts_output_file
//             },
            chitujs: {
                options: {
                    banner:
                    "(function(factory) { \n\
        if (typeof define === 'function' && define['amd']) { \n\
            define(['jquery', 'hammer', 'move'], factory);  \n\
        } else { \n\
            factory($, Hammer, move); \n\
        } \n\
    })(function($, Hammer,move) {",
                    footer: '\n return chitu;\n\
    });',
                },
                src: [build_dir + '/**/*.js'],
                dest: js_output_file

            }
        },
        uglify: {
            build: {
                src: release_dir + '/chitu.js',
                dest: release_dir + '/chitu.min.js'
            }
        },
        clean: [build_dir + '/**/*.d.ts', ts_output_file]
    };

    config.copy = {
        main: {
            files: [
                { src: [js_output_file], dest: '/Users/MaiShu/git/YunDe/POS/src/js/chitu.js' },
                { src: [ts_output_file], dest: '/Users/MaiShu/git/YunDe/POS/src/js/typings/chitu.d.ts' },
            ]
        }
    };



    grunt.initConfig(config);

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['typescript', 'concat', 'uglify', 'copy', 'clean']);//,

};