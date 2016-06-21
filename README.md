## 代码下载
ChiTu 项目托管在 github 上，网址：https://github.com/ansiboy/ChiTu

## 代码生成
1. 安装 Grunt
2. 运行 npm install 命令，安装所需要的 grunt 插件
3. 运行 grunt 命令生成项目

如果对 Grunt 不熟悉，请自行搜索相关教程

## 项目结构
* src: 源代码
* test: 测试项目，使用的测试类库是 qunit 。
* release: 项目经过 grunt 预处理后，生成文件。
* .vscode: VS Code 的配置文件。（作者是使用 VS Code 进行开发的）

## 项目脚手架
## 入门

### 配置 requirejs
1. 依赖的第三方库

	* jquery
	* hammerjs
	* iscroll
	* requirejs 及其插件 text，css 。其中 text 是用来加载页面对应视图（html文件）以及样式文件。

	```js
	requirejs.config({
    urlArgs: "bust=46",
    shim: {
        chitu: {
            deps: ['jquery', 'crossroads', 'hammer', 'move']
        },
        hammer: {
            exports: 'Hammer'
        },
        'iscroll': {
            exports: 'IScroll'
        },
        'move': {
            exports: 'move'
        }
    },

    paths: {
        chitu: 'scripts/chitu',
        css: 'scripts/css',
        hammer: 'scripts/hammer',
        iscroll: 'scripts/iscroll-probe',
        jquery: 'scripts/jquery-2.1.0',
        text: 'scripts/text'
    }
	```

### 创建 Application 对象
1. 默认配置
#### 创建页面
1. 路由的解释
	1. 页面的路径 
	2. 路由参数的获取
	 
2. 页面的加载
	1. HTML 及 JS 的加载 
	2. 资源文件的加载
	
### 页面间数据交换
1. 参数的传递
2. 数据的返回

### 页面容器
### 页面跳转与返回
1. 页面跳转
2. 页面返回
3. 重写页面返回

### 滚动视图
1. 滚动到底加载数据
2. 通过手势切换视图
3. 自定手势动作

