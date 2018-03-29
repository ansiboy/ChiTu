# AJAX 调用 —— 以表单格式提交数据


## 源码

### index.html 文件

```html
<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="utf-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <link href="https://cdn.bootcss.com/bootstrap/3.3.7/css/bootstrap.css" rel="stylesheet"/>
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
        chitu: 'js/chitu'
    }
})

requirejs(['application'], function (app) {
    app.run()
})
```

### application.js 文件

```js
define(['chitu'], function (c) {
    let siteMap = {
        /**
         * 首页
         * @param {chitu.Page} page 
         */
        index(page) {
            page.element.innerHTML = `
            <div class="container" style="padding-top:10px">           
                <form>
                    <div class="form-group">
                        <label>用户名</label>
                        <input type="text" class="form-control" value="18562156216"/>
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <input type="password" class="form-control" value="abcd"/>
                    </div>
                    <div class="form-group">
                        <button type="button" class="btn btn-primary btn-block">登录</button>
                    </div>
                </form>
            </div>
            `;

            var service = page.createService(chitu.Service);
            page.element.querySelector('button').onclick = function () {
                let url = "https://service.alinq.cn/user/login";
                let inputs = page.element.querySelectorAll('input');
                let username = inputs[0].value;
                let password = inputs[1].value;
                service.ajax(url, {
                    data: {
                        username,
                        password
                    },
                    method: 'post'
                })

            }
        }
    }
    let app = new chitu.Application(siteMap)
    app.error.add((sender, err) => {
        alert(err.message);
    })
    return app
})
```