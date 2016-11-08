/** @param page {chitu.Page} */
function index(page) {
    alert('hello');
}

define(["require", "exports"], function (require, exports) {
    exports.index = index;
});