define(['chitu'], function (c) {
    let app = new chitu.Application({
        siteMap: {
            index(page) {
                page.element.innerHTML = "<h1>Hello World</h1>"
            }
        }
    })

    return app;
});