define(['chitu'], function (c) {
    let app = new chitu.Application({
        siteMap: {
            index: {
                action: 'modules/page1',
                children: {
                    page2: 'modules/page2'
                }
            }
        }
    })

    return app;
});