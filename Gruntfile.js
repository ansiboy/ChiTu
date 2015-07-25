module.exports = function (grunt) {
    // 项目配置
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: { separator: ';' },
            dist: {
                src: ['ChiTu/ScriptBegin.txt','ChiTu2/Utility.js', 'ChiTu2/Errors.js', 'ChiTu2/Extends.js', 'ChiTu2/PageContainer.js',
                      'ChiTu2/Page.js', 'ChiTu2/Controller.js', 'ChiTu2/ControllerContext.js', 'ChiTu2/ControllerFactory.js',
                      'ChiTu2/Route.js', 'ChiTu2/RouteCollection.js', 'ChiTu2/ViewFactory.js', 'ChiTu2/Application.js','ChiTu/ScriptEnd.txt'],
                dest: 'Build/chitu.js'
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