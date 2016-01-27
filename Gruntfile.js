// module.exports = function (grunt) {
//     // 项目配置
//     grunt.initConfig({
//         pkg: grunt.file.readJSON('package.json'),
//         concat: {
//             options: { separator: ';' },
//             dist: {
//                 src: ['ChiTu/ScriptBegin.txt', 'ChiTu/Scripts/crossroads.js',
//                       'ChiTu/Utility.js', 'ChiTu/chitu.js',
//                       'ChiTu/ScriptEnd.txt'],
//                 dest: 'Build/chitu.js'
//             },
//             chitu: {
//                 src: ['ChiTu/Utility.ts', 'ChiTu/Errors.ts', 'ChiTu/Extends.ts',
//                       'ChiTu/Action.ts',
//                       'ChiTu/Page.ts', 'ChiTu/ControllerContext.ts', 'ChiTu/ControllerFactory.ts',
//                       'ChiTu/Route.ts', 'ChiTu/RouteCollection.ts', 'ChiTu/RouteData.ts', 'ChiTu/Application.ts',
//                       'ChiTu/Scroll/DivScroll.ts', 'ChiTu/Scroll/DocumentScroll.ts', 'ChiTu/Scroll/IOSScroll.ts',
//                       'ChiTu/Gesture/Common.ts', 'ChiTu/Gesture/DIVGesture.ts', 'ChiTu/Gesture/IOSGesture.ts',
//                    ],
//                 dest: 'Build/chitu.ts'
//             }
//         },
//         uglify: {
//             options: {
//                 banner: '/*! Author: Shu Mai, Contact: ansiboy@163.com */\n'
//             },
//             build: {
//                 src: 'Build/chitu.js',
//                 dest: 'Build/chitu.min.js'
//             }
//         }
//     });
//     // 加载提供"uglify"任务的插件
//     grunt.loadNpmTasks('grunt-contrib-concat');
//     grunt.loadNpmTasks('grunt-contrib-uglify');
//     // 默认任务
//     grunt.registerTask('default', ['concat', 'uglify']);
// }


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
                src: ['Build/*.js'],
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