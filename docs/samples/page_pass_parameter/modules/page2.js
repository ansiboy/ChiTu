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