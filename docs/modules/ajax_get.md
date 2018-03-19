# AJAX 调用 —— 数据的获取

作为客户端，通过 AJAX 来调用服务端的提供的接口，基本上就每一个应用都要处理的事情，为了方便异常的处理， CHITU 封装了 AJAX 方法。

**注意：**

应当使用 Page 类的 createService 来创建 Service 对象，而不是使用 new 方法。这样可以使得 Page 能够捕获到 Service 的错误，方便统一处理错误。

```js
let service = page.createService(chitu.Service);
```

**最好不要这写，不要这么写**，除非你有充分的理由。 

```js
let service = new chitu.Service();
```

## 源码


```js
define(["exports"], function (exports) {
    /**
     * 
     * @param {chitu.Page} page 
     */
    function action(page) {
        page.element.innerHTML = "<h1>AJAX 调用示例</h1>"

        let dataContainer = document.createElement("div")
        page.element.appendChild(dataContainer)

        let service = page.createService(chitu.Service);

        let url = "http://service.alinq.cn/UserSite/Home/GetHomeProducts?pageIndex=0"
        service.ajax(url, {
            headers: {
                'Application-Key': '59a0d63ab58cf427f90c7d3e'
            }
        }).then(data => {
            for (let i = 0; i < data.length; i++) {
                let element = document.createElement('div')
                element.innerHTML = data[i].Name
                dataContainer.appendChild(element)
            }

        })
    }

    exports.default = action
});
```