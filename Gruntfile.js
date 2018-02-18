var build_dir = 'out';
var release_dir = 'out/dist';
var js_output_file = `${release_dir}/chitu.js`;
var ts_output_file = `${release_dir}/chitu.d.ts`;
module.exports = function (grunt) {
    let chitu_js_banner =
        "(function(factory) { \n\
            if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') { \n\
                // [1] CommonJS/Node.js \n\
                var target = module['exports'] || exports; \n\
                var chitu = factory(target, require);\n\
                Object.assign(target,chitu);\n\
            } else \n\
        if (typeof define === 'function' && define['amd']) { \n\
            define(factory);  \n\
        } else { \n\
            factory(); \n\
        } \n\
    })(function() {";
    let chitu_js_footer =
        '\n\window[\'chitu\'] = window[\'chitu\'] || chitu \n\
                            \n return chitu;\n\
            });'

    var config = {
        shell: {
            ts: {
                command: 'tsc -p ./src',
                options: {
                    failOnError: false
                }
            },
        },
        concat: {
            chitudts: {
                options: {
                    stripBanners: true,
                    footer: 'declare module "maishu-chitu" { \n\
            export = chitu; \n\
        }\n'
                },
                src: [build_dir + '/**/*.d.ts'],
                dest: ts_output_file
            },
            chitujs_es6: {
                options: {
                    banner: chitu_js_banner,
                    footer: chitu_js_footer,
                },
                src: [build_dir + '/es6/**/*.js'],
                dest: release_dir + '/chitu.js'
            }
        },
        clean: [build_dir + '/**/*.d.ts', build_dir + '/**/*.js']
    };

    config.copy = {
        // main: {
        //     files: [
        //         { src: [js_output_file], dest: '../ChiTuStore/src/Scripts/chitu.js' },
        //         { src: [ts_output_file], dest: '../ChiTuStore/src/Scripts/typings/chitu.d.ts' },
        //     ]
        // },
        // test: { // Copy 到测试目录
        //     files: [{
        //             src: [js_output_file],
        //             dest: 'test/scripts/chitu.js'
        //         },
        //         {
        //             src: [ts_output_file],
        //             dest: 'test/scripts/typings/chitu.d.ts'
        //         },
        //     ]
        // }
    };



    grunt.initConfig(config);

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-shell');
    grunt.registerTask('default', ['shell', 'concat']); //, 'copy'

};