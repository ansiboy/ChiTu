require.config({
    //baseUrl: '/Scripts',
    //paths: {
    //    jquery: 'jquery-2.1.1',
    //    knockout: 'knockout-3.1.0.debug.js',
    //    crossroads: 'crossroads'
    //}
});

window.app = new chitu.Application();
app.routes().mapRoute({ name: 'Default', url: '{controller}/{action}/:id:' });
app.run(function () {
    app.redirect('Account/Index');
});

