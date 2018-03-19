
requirejs.config({
    paths: {
        chitu: 'js/chitu'
    }
})

requirejs(['application'], function (app) {
    app.run()
    if (!location.hash)
        location.hash = '#index'
})