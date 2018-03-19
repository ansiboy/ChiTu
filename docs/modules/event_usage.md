# 消息的通知

CHITU 框架提供了一个非常有用的类 Callback ，用来实现消息的通知机制。

示例

```js
define(['chitu'], function (c) {
    let app = new chitu.Application({
        siteMap: {
            index(page) {
                let callbacks = chitu.Callbacks()
                callbacks.add((sender, msg) => {
                    alert(`来自 ${sender.name} 的消息：${msg}`)
                })

                let btn = document.createElement('button')
                btn.innerHTML = '点击这里触发事件'
                btn.name = 'button1'
                page.element.appendChild(btn)
                btn.onclick = function () {
                    callbacks.fire(btn, 'hello~~~')
                }
            }
        }
    })

    return app;
});
```