# 页面间跳转

## 源码

### html.js

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

### index.js

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

### application.js

```js
define(['chitu'], function (c) {
    let app = new chitu.Application({
        siteMap: {
            index: {
                action: 'modules/index',
                children: {
                    newPage: 'modules/newPage'
                }
            }
        }
    })

    return app
})
```

### modules/index

```js
define(["exports"], function (exports) {
    /**
     * 
     * @param {chitu.Page} page 
     */
    function action(page) {
        page.element.innerHTML = `
<h1>Hello World</h1>
<a href="#newPage">点击这里进入新页面<a/>
        `
    }

    exports.default = action
})
```

### modules/newPage

```js
define(['exports'], function (exports) {
    function action(page) {
        page.element.innerHTML = `
            <h1>这是一个新页面</h1>
            <a href="javascript:history.back()">点击这里返回上一个页面</a>
        `;
    }
    exports.default = action
})
```