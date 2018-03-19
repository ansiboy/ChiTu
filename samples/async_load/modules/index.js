define(["exports"], function (exports) {
    /**
     * 
     * @param {chitu.Page} page 
     */
    function action(page) {
        page.element.innerHTML = "<h1>Hello World</h1>"
    }

    exports.default = action    
});

