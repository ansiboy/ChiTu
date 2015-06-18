asyncTest('RouteTest', function () {
    var app = new chitu.Application(function (options) {
        var route1 = options.routes.mapRoute({ name: 'Default', url: '{controller}/{action}' });
        var route2 = options.routes.mapRoute({
            name: 'Home',
            url: 'Home/{action}',
            defaults: { action: 'Home' }
        });

        var routeData = options.routes.getRouteData('Home/Index');
        ok(routeData != null);
        //ok(routeData.route() == route2);
        start();
    });

    var route = app.routes().mapRoute({
        name: 'User',
        url: '{controller}/{action}/{part}',
        viewPath: 'http://alinq.cn/{controller}/{action}.html',
        actionPath: 'http://alinq.cn/{controller}/{action}'
    });

    var routeData = app.routes().getRouteData('Home/Index');

});
