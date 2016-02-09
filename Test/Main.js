/// <reference path="../Release/chitu.js"/>

requirejs.config({
    shim: {
        chitu: { deps: ['jquery', 'crossroads'] },
        crossroads: { deps: ['jquery'] }
    },
    paths: {
        chitu: '../Release/chitu',
        jquery: 'jquery-2.1.1'
    },
    baseUrl: 'Scripts'
});

requirejs(['chitu'], function () {
    var app = new chitu.Application({
        container: function () {
            return document.getElementById('main');
        },
        openSwipe: function () {
            return chitu.SwipeDirection.Left;
        },
        closeSwipe: function () {
            return chitu.SwipeDirection.Right;
        },
        scrollType:function(){
            return chitu.ScrollType.Div;
        }
    });


    var viewPath = '../Module/{controller}/{action}.html';
    var actionPath = '../Module/{controller}/{action}';
    app.routes().mapRoute({
        name: 'Normal',
        url: '{controller}_{action}',
        viewPath: viewPath,
        actionPath: actionPath
    });

    app.run();
})
