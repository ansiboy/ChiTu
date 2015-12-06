module.exports = function (grunt) {
    // 项目配置
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: { separator: ';' },
            dist: {
                src: ['ChiTu/ScriptBegin.txt', 'ChiTu/Scripts/crossroads.js',
                      'ChiTu/Utility.js', 'ChiTu/chitu.js',
                      'ChiTu/ScriptEnd.txt'],
                dest: 'Build/chitu.js'
            },
            chitu: {
                src: ['ChiTu/Utility.ts', 'ChiTu/Errors.ts', 'ChiTu/Extends.ts',
                      'ChiTu/Page.ts', 'ChiTu/Controller.ts', 'ChiTu/ControllerContext.ts', 'ChiTu/ControllerFactory.ts',
                      'ChiTu/Route.ts', 'ChiTu/RouteCollection.ts', 'ChiTu/RouteData.ts', 'ChiTu/ViewFactory.ts', 'ChiTu/Application.ts',
                      'ChiTu/Scroll/DivScroll.ts', 'ChiTu/Scroll/DocumentScroll.ts', 'ChiTu/Scroll/IOSScroll.ts'
                   ],
                dest: 'Build/chitu.ts'
            }
        },
        uglify: {
            options: {
                banner: '/*! Author: Shu Mai, Contact: ansiboy@163.com */\n'
            },
            build: {
                src: 'Build/chitu.js',
                dest: 'Build/chitu.min.js'
            }
        }
    });
    // 加载提供"uglify"任务的插件
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    // 默认任务
    grunt.registerTask('default', ['concat', 'uglify']);
}