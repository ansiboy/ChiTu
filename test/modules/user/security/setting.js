/** @param page {chitu.Page} */
function setting(page) {
    page.load.add((sender, html) => {
        page.element.innerHTML = html;
    })
}

define(["require", "exports"], function (require, exports) {
    exports.default = setting;
});