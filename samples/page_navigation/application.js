define(['chitu'], function (c) {
    let app = new chitu.Application({
        siteMap: {
            index: {
                action: 'modules/index',
                children: {
                    newPage: 'modules/newPage'
                }
            }
        }
    })

    return app
})