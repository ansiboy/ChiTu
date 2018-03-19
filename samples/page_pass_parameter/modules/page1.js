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

            let label = document.createElement('div')
            page.element.appendChild(label)
            label.innerHTML = '在文本框中输入要传递的参数'

            btn.onclick = function () {
                app.redirect('#page2', { name: input.value })
            }
        }
        exports.default = action
    }
)