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

