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