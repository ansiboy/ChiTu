
requirejs.config({
    paths: {
        chitu: 'Scripts/chitu',
        jquery: 'Scripts/jquery-2.1.1',
        move: 'Scripts/move',
        hammer: 'Scripts/hammer',
        text:'Scripts/text'
    },
    //baseUrl: 'Scripts'
});

requirejs(['chitu'], function (chitu) {
    var app = new chitu.Application({
        openSwipe: function () {
            return chitu.SwipeDirection.Left;
        },
        closeSwipe: function () {
            return chitu.SwipeDirection.Right;
        },
        scrollType: function () {
            return chitu.ScrollType.Div;
        }
        //pathBase: '../Module/'
    });

    app.config.urlParser.pathBase = 'Module/';

    // var viewPath = '../Module/{controller}/{action}.html';
    // var actionPath = '../Module/{controller}/{action}';
    // app.routes().mapRoute({
    //     name: 'Normal',
    //     url: '{controller}_{action}',
    //     viewPath: viewPath,
    //     actionPath: actionPath
    // });

    app.run();
})
