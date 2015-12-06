require.config({
    baseUrl: 'Scripts',
    shim: {
        '../chitu': {
            deps: ['move', 'jquery', 'crossroads']
        }
    },
    paths: {
        jquery: 'jquery-2.1.1.min',
        crossroads: 'crossroads'
    }
});
requirejs(['../chitu', 'move'], function (c, move) {
    window['move'] = move;
    var app = new chitu.Application({
        container: document.getElementById('main'),
        openSwipe: function () {
            return chitu.SwipeDirection.None;
            return chitu.SwipeDirection.Left;
        },
        scrollType: function () {
            return chitu.ScrollType.Document
        }
    });
    //function (options) {
    //options.actionPath = 'http://localhost:62632/Modules/{controller}/{action}.js';
    //options.viewPath = 'http://localhost:62632/Modules/{controller}/{action}.html';


    
    app.pageCreated.add(function (sender, page) {

    });

    app.routes().mapRoute({
        name: 'default',
        url: '{controller}/{action}',
        viewPath: '../Modules/{controller}/{action}.html',
        actionPath: '../Modules/{controller}/{action}.js'
    });

    //app.routes().mapRoute({
    //    name: 'remote',
    //    url: '{controller}/{action}',
    //    rules: {
    //        controller: ['Remote']
    //    },
    //    viewPath: 'http://localhost:17354/Samples/{controller}_{action}.html',
    //    actionPath: 'http://localhost:17354/Samples/{controller}_{action}.js'
    //});

    //});
    
    app.run();
});
