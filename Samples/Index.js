require.config({
    baseUrl: 'Scripts',
    paths: {
        jquery: 'jquery-2.1.1.min',
    }
});
requirejs(['jquery-2.1.1.min', 'crossroads', 'chitu'], function () {
    var app = new chitu.Application(function (options) {
        options.actionPath = '../Modules/{controller}/{action}';
        options.viewPath = '../Modules/{controller}/{action}';

        options.routes.mapRoute({
            name: 'default',
            url: '{controller}/{action}'
        })

    });

    app.run();
});