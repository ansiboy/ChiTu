asyncTest('RouteTest', function () {
    var app = new chitu.Application();
    var route1 = app.routes().mapRoute({ name: 'Default', url: '{controller}/{action}' });
    var route2 = app.routes().mapRoute({
        name: 'Home',
        url: 'Home/{action}',
        defaults: { action: 'Home' }
    });

    var routeData = app.routes().getRouteData('Home/Index');
    ok(routeData != null);
});
