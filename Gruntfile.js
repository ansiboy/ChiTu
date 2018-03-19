var build_dir = 'out';
var release_dir = 'out/dist';
var js_output_file = `${release_dir}/chitu.js`;
var ts_output_file = `${release_dir}/chitu.d.ts`;


module.exports = function (grunt) {
    let pkg = grunt.file.readJSON('package.json');

    let license = `
/*!
 * CHITU v${pkg.version}
 * https://github.com/ansiboy/ChiTu
 *
 * Copyright (c) 2016-2018, shu mai <ansiboy@163.com>
 * Licensed under the MIT License.
 *
 */
`

    let chitu_js_banner = `
${license}
(function(factory) { 
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') { 
        // [1] CommonJS/Node.js 
        var target = module['exports'] || exports;
        var chitu = factory(target, require);
        Object.assign(target,chitu);
    } else if (typeof define === 'function' && define['amd']) {
        define(factory); 
    } else { 
        factory();
    } 
})(function() {
`;
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
        babel: {
            source: {
                options: {
                    sourceMap: false,
                    presets: ["es2015"],
                },
                files: [{
                    src: [`out/dist/chitu.js`],
                    dest: `out/dist/chitu.es5.js`
                }]
            }
        },
        uglify: {
            out: {
                options: {
                    mangle: false
                },
                files: [{
                    src: `out/dist/chitu.es5.js`,
                    dest: `out/dist/chitu.min.js`
                }]
            }
        },
        concat: {
            chitudts: {
                options: {
                    stripBanners: true,
                    footer:
                        `
declare module "maishu-chitu" { \n\
    export = chitu; \n\
}\n
declare module "chitu" { \n\
    export = chitu; \n\
}\n
`
                },
                src: [build_dir + '/es6/*.d.ts'],
                dest: ts_output_file
            },
            chitujs_es6: {
                options: {
                    banner: chitu_js_banner,
                    footer: chitu_js_footer,
                },
                src: [build_dir + '/es6/chitu.js'],
                dest: release_dir + '/chitu.js'
            }
        },
        clean: [build_dir + '/**/*.d.ts', build_dir + '/**/*.js'],
        // 通过connect任务，创建一个静态服务器
        connect: {
            www: {
                options: {
                    // 服务器端口号
                    port: 6613,
                    // 服务器地址(可以使用主机名localhost，也能使用IP)
                    // hostname: '192.168.1.7',
                    hostname: '0.0.0.0',
                    keepalive: true,
                    // livereload: 17024,
                    // 物理路径(默认为. 即根目录) 注：使用'.'或'..'为路径的时，可能会返回403 Forbidden. 此时将该值改为相对路径 如：/grunt/reloard。
                    base: 'docs',
                    open: true,
                    // protocol: 'https'
                }
            }
        }
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

    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-shell');
    grunt.registerTask('default', ['shell', 'concat', 'babel', 'uglify']); //, 'copy'

};