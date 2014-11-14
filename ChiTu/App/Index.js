(function () {
    require.config({
        baseUrl: '/Scripts',
        paths: {
            jquery: 'jquery-2.1.1',
            knockout: 'knockout-3.1.0.debug.js',
            crossroads: 'crossroads'
        }
    });

    $.ajaxSetup({ cache: false });
    //var app = new chitu.Application({
    //    viewPath: '/',
    //    actionPath: '/'
    //});
    app.routes().mapRoute({ name: 'default', url: '{controller}/{action}' });

    asyncTest('单视图，单脚本', function () {
        app.showPage('/Test/View1').done($.proxy(function () {
            var text = $(p.node()).text();
            ok(text.indexOf('View1') >= 0);
            ok(text.indexOf('model1') >= 0);
            start();
        }, self));
    });

    asyncTest('单视图绑定', function () {
        app.showPage('Test/View2').done($.proxy(function () {
            var text = $(p.node()).text();
            ok(text.indexOf('View2') >= 0);
            start();
        }, self));
    });
    asyncTest('测试加载', function () {
        //debugger;
        app.showPage('Test/View3').done($.proxy(function () {
            var $node = $(p.node());
            ok($node.text() == 'View3');
            p.show().done(function () {
                var text = $(p.node()).text();
                ok(text == 'View3');
            });
            start();
        }, self));

    });
    asyncTest('测试显示事件', function () {
        app.showPage('Test/View4').done(function () {
            var text = $(p.node()).text();
            ok(text.indexOf('Event Test') >= 0);
            start();
        });
    });
})();