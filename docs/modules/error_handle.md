# 错误处理

CHTTU 提供了一个统一错误处理的机制，通过监听 Application 对象的 error 事件可以捕获取 Page 和 Service 对象产生的错误。当 Page 或 Service 对象工作时出现了错语，会调用 Application 对象的 throwError 方法，将错误抛出。

throwError 方法

```ts
public throwError(err: Error, page?: Page) {
    let e = err as AppError;
    this.error.fire(this, e, page)
    if (!e.processed) {
        throw e
    }
}
```

使用

```js
app.error.add(function(sender, error){
    // 在这理可以根据不同的错误，进行不同的处理
})
```



下面来看一个例子

```js
define(['chitu'], function (c) {
    let siteMap = {
        index(page) {
            let btn = document.createElement('button')
            btn.innerHTML = '点击这里触发错误'
            page.element.appendChild(btn)

            let service = page.createService(chitu.Service)
            btn.onclick = function () {
                // 调用这个方法，会出来 "Application id is required" 的错语
                service.ajax("http://service.alinq.cn/")
            }
        }
    }

    let app = new chitu.Application(siteMap)
    app.error.add(function (app, error, page) {
        alert(error.message)
    })
    return app;
});
```