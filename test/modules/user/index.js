/** @param page {chitu.Page} */
function index(page) {
    page.element.innerHTML = '<h1>User.Index</h1>'
}

define(['exports'], (exports) => {
    exports.default = index;
})