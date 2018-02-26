# 快速入门

<div class="device"></div>

## 创建项目

创建文件夹，然后在新建的文件夹添加如下文件。源码在下文中。如下所示：

```
js\
    chitu.js
    require.js

application.js
index.html
index.js
```

在浏览器输入：path/index.html#index，path 为文件夹在 Web Server 中对应的路径。

运行效果如右图所示

## 理解页面的显示

1. 在创建 Application 对象，并调用 run 方法后，Application 对象将会监视浏览器 URL 的变化。
1. 当浏览器的 URL 发生变化，Application 对象将对路径进行解释，生成 RouteData 对象。

    ```js
    interface RouteData {
        pageName: string;
        values: any;
        url: string;
    }
    ```
1. Application 调用 Application 的 createElement 方法，创建 HTML 元素，并将该 HTML 元素包装成为 Page 对象。
1. 根据 RouteData 中的 Page，在 SiteMap 中查找出对应的 SiteMapNode，然后调用对应的 action 方法渲染页面。

## 使用步骤

1. 创建 Application 对象
1. 调用 Application 对象的 run 方法

## 源码

### index.html 文件

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

### index.js 文件

```js
requirejs.config({
    paths: {
        chitu: '/js/chitu'
    }
})

requirejs(['application'], function (app) {
    app.run()
    if (!location.hash)
        location.hash = '#index'
})
```

### application.js 文件

```js
define(['chitu'], function (c) {
    let app = new chitu.Application({
        siteMap: {
            index(page) {
                page.element.innerHTML = "<h1>Hello World</h1>"
            }
        }
    })

    return app;
});
```
