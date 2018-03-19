define(['exports'], function (exports) {
    function action(page) {
        page.element.innerHTML = `
            <h1>这是一个新页面</h1>
            <a href="javascript:history.back()">点击这里返回上一个页面</a>        
        `;
    }
    exports.default = action
})