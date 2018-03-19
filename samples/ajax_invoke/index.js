
requirejs.config({
    paths: {
        chitu: 'js/chitu'
    }
})

requirejs(['application'], function (app) {
    app.run()
})