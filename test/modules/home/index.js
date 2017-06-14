/** @param page {chitu.Page} */
function index(page) {
    page.element.innerHTML = '<h1>Hello World</h1>';
}

define(["require", "exports"], function (require, exports) {
    exports.default = index;
});