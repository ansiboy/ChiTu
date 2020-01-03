const webpack = require('webpack');
let pkg = require("./package.json");
let license = `
 ${pkg.name} v${pkg.version}
 https://github.com/ansiboy/chitu
 
 Copyright (c) 2016-2018, shu mai <ansiboy@163.com>
 Licensed under the MIT License.
`;
module.exports = {
    entry: __dirname + "/out/index.js", //已多次提及的唯一入口文件
    output: {
        path: __dirname + "/dist", //打包后的文件存放的地方
        filename: "index.js", //打包后输出文件的文件名
        libraryTarget: "umd",
        globalObject: 'typeof window === \'undefined\' ? global : window'
    },
    mode: 'development',
    devtool: 'source-map',
    externals: ["maishu-chitu-service"],
    plugins: [
        new webpack.BannerPlugin(license),
    ],
}