
$.ajaxSetup({ cache: false });
require.config({
    //baseUrl: '/Scripts',
    waitSeconds: 700,
    urlArgs: "bust=" + new Date().getTime(),
    paths: {
        text: '../Scripts/require.text',
        jquery: '../Scripts/jquery-2.1.1',
        knockout: '../Scripts/knockout-3.1.0.debug.js',
        crossroads: '../Scripts/crossroads'
    }
});

window.app = new chitu.Application(function (options) {
    options.routes.mapRoute({ name: 'default', url: '{controller}/{action}' });
    options.viewPath = '../App/{action}.html';
    options.actionPath = '../App/{action}.js';
});


app.run();


require(['Filters'], function () {
    var controller = app.controllerFactory.getController({ controller: 'Test' });

    var pageContainerTests = ['PageContainer/showPage', 'PageContainer/back'];
    var controllerTests = [];//['Controller/Filters'];
    var applicationTests = ['Application/createPage'];
    var routeTests = ['Route/mapRoute'];
    var tests = [];
    tests = tests.concat(controllerTests);
    tests = tests.concat(applicationTests);
    tests = tests.concat(routeTests);
    tests = tests.concat(pageContainerTests);
    require(tests);
});

chitu.buildModul('Product', function () {

});

