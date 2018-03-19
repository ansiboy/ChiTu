define(['chitu'], function (c) {
    let app = new chitu.Application({
        siteMap: {
            index: 'modules/index'
        }
    })

    return app
})