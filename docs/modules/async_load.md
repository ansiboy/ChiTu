# 异步加载

SiteMap 对象中的 SiteMapNode 的 action 字段，除了可以是函数，还可以是一个路径。

例如：

```js
{
    index: 'modules/index'
}
```

等价于

```js
{
    index: {
        action: 'modules/index'
    }
}
```

当 action 为字段串，对应的 JS 文件定义如下：

```js
define(["exports"], function (exports) {
    function action(page) {
        // 编写渲染页面的代码
    }

    exports.default = action
});
```

注意到 ```exports.default = action``` ，必须将 action 方法导出到 default 字段。

## index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CHITU</title>
</head>

<body>
    <script src="js/require.js" data-main="index"></script>

</body>

</html>
```

## index.js

```js
requirejs.config({
    paths: {
        chitu: 'js/chitu'
    }
})

requirejs(['application'], function (app) {
    if (!location.hash)
        location.hash = '#index'

    app.run()
})
```

## application.js

```js
define(['chitu'], function (c) {
    let app = new chitu.Application({
        siteMap: {
            index: 'modules/index'
        }
    })

    return app
})
```

## modules/index.js

```js
define(["exports"], function (exports) {
    exports.default = action

    /**
     * 
     * @param {chitu.Page} page 
     */
    function action(page) {
        page.element.innerHTML = "<h1>Hello World</h1>"
    }
});
```