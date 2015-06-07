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



});
