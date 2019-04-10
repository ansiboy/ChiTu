const path = require('path');
const webpack = require('webpack');
const grunt = require('grunt')
let pkg = grunt.file.readJSON('package.json');

let license = `CHITU v${pkg.version}
https://github.com/ansiboy/chitu

Copyright (c) 2016-2018, shu mai <ansiboy@163.com>
Licensed under the MIT License.`

module.exports = {
    entry: './out/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js'
    },
    mode: 'development', // production
    plugins: [
        new webpack.BannerPlugin(license)
    ]
}