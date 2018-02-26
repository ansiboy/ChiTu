
requirejs.config({
    paths: {
        chitu: 'js/chitu'
    }
})

requirejs(['application'], function (app) {
    if (!location.hash)
        location.hash = '#index'

    app.run()
})