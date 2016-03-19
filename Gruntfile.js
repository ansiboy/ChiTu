var js_output_file = 'Release/chitu.js';
var ts_output_file = 'Release/chitu.d.ts';
module.exports = function(grunt) {
    var config = {
        typescript: {
            base: {
                src: ['ChiTu/**/*.ts'],
                dest: 'Build/chitu.js',
                options: {
                    basePath: 'Build',
                    module: 'amd', //or commonjs
                    target: 'es5',
                    removeComments: true,
                    declaration: true,
                }
            }
        },
        concat: {
            chitudts: {
                options: {
                    stripBanners: true,
                    banner: '/// <reference path="jquery.d.ts" /> \r\n',
                },
                files: {
                    ts_output_file: ['Build/**/*.d.ts']
                }
            },
            chitujs: {
                options: {
                    footer:
                    '\nif (typeof define == "function") { \n\
                        define(function(require, factory) { \n\
                            return chitu;\n\
                        }); \n\
                    } \n',
                },
                src: ['Build/**/*.js'],
                dest: js_output_file

            }
        },
        uglify: {
            build: {
                src: 'Release/chitu.js',
                dest: 'Release/chitu.min.js'
            }
        },
        clean: ['Build/**/*.d.ts', ts_output_file]
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