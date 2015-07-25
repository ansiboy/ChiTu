require.config({
    baseUrl: 'Scripts',
    paths: {
        jquery: 'jquery-2.1.1.min',
        crossroads: 'crossroads'
    }
});
requirejs(['chitu'], function () {
    var app = new chitu.Application(function () { });
    app.routes().mapRoute({
        name: 'default',
        url: '{controller}/{action}',
        viewPath: 'http://localhost:62632/{controller}_{action}.html',
        actionPath: 'http://localhost:62632/{controller}_{action}.js'
    });
    app.routes().mapRoute({});
    app.run();
});
//# sourceMappingURL=app.js.map