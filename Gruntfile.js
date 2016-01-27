
module.exports = function (grunt) {
    grunt.initConfig({
        typescript: {
            base: {
                src: ['ChiTu/**/*.ts'],
                dest: 'Build',
                options: {
                    module: 'amd', //or commonjs 
                    target: 'es5',
                    removeComments: true
                }
            }
        },
        concat: {
            chitu: {
                src: ['ChiTu/Utility.ts', 'ChiTu/Errors.ts', 'ChiTu/Extends.ts',
                    'ChiTu/Action.ts',
                    'ChiTu/Page.ts', 'ChiTu/Page.ts', 'ChiTu/PageContext.ts',
                    'ChiTu/Route.ts', 'ChiTu/RouteCollection.ts', 'ChiTu/RouteData.ts', 'ChiTu/Application.ts',
                    'ChiTu/Scroll/DivScroll.ts', 'ChiTu/Scroll/DocumentScroll.ts', 'ChiTu/Scroll/IOSScroll.ts',
                    'ChiTu/Gesture/Common.ts', 'ChiTu/Gesture/DIVGesture.ts', 'ChiTu/Gesture/IOSGesture.ts',
                ],
                dest: 'Release/chitu.ts'
            },
            chitujs: {
                src: ['Build/**/*.js'],
                dest: 'Release/chitu.js'
            }
        },
        uglify: {
            build: {
                src: 'Release/chitu.js',
                dest: 'Release/chitu.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['typescript', 'concat', 'uglify']);

};