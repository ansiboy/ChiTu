# 页面间参数传递

## 源码

### page1.js
```js
define(["exports", "application"],
    /**
     *  @param {chitu.Application} app
     */
    function (exports, app) {
        /**
         * @param {chitu.Page} page
         */
        function action(page) {
            let btn = document.createElement('button')
            btn.innerHTML = '打开并传递参数第二个页面'
            page.element.appendChild(btn)

            page.element.appendChild(document.createElement('br'))

            let input = document.createElement("input")
            page.element.appendChild(input)
            input.value = '第一个页面'

            btn.onclick = function () {
                app.redirect('#page2', { name: input.value })
            }
        }
        exports.default = action
    }
)
```

### page2.js
```js
define(["exports", "application"],
    /**
     * @param {chitu.Application} app
     */
    function action(exports, app) {
        'use strict';
        /**
         * @param {chitu.Page} page 
         */
        function action(page) {
            page.element.innerHTML = `
            这是第二个页面
            <button>点击这里返回</button>
            <div></div>
            `;

            let btn = page.element.querySelector('button')
            btn.onclick = () => {
                app.back()
            }
            page.active.add((sender, args) => {
                let element = sender.element.querySelector("div");
                element.innerHTML = `传过来的参数：${JSON.stringify(args)}`
            })
        }

        exports.default = action
    }
);
```


