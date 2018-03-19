define(['chitu'], function (c) {
    let app = new chitu.Application({
        siteMap: {
            index(page) {
            }
        }
    })

    return app;
});