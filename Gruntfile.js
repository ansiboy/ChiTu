
module.exports = function (grunt) {
    grunt.initConfig({
        typescript: {
            base: {
                src: ['ChiTu/**/*.ts'],
                dest: 'Build',
                options: {
                    module: 'amd', //or commonjs
                    target: 'es5',
                    removeComments: true,
                    declaration: true
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
                    '/Users/MaiShu/git/ChiTuStore/Web/Scripts/typings/chitu.d.ts': ['Build/**/*.d.ts']
                }
            },
            chitujs: {
                src: ['Build/**/*.js'],
                dest: '/Users/MaiShu/git/ChiTuStore/Web/Scripts/chitu.js'//'Release/chitu.js'
            }
        },
        uglify: {
            build: {
                src: 'Release/chitu.js',
                dest: 'Release/chitu.min.js'
            }
        },
        clean: ['Build/**/*.d.ts']
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['typescript', 'concat', 'uglify', 'clean']);//,

};