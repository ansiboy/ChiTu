asyncTest('ApplicationTest', function () {
    var app = new chitu.Application();
    app.run(function (routes) {
        /// <param name="routes" type="chitu.RouteCollection"/>
        debugger;
        routes.mapRoute({
            name: 'default',
            url: '{controller}/{action}/:id:',
            defaults: { controller: 'Home', action: 'Index' }
        });
    })
    //window.location.hash = 'Home/Index'
    window.location.href = '#Home/Index';
});