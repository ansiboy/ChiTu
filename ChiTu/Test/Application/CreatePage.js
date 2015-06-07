(function () {

    asyncTest('单视图，单脚本', function () {
        var $node = $('<div>').appendTo(document.body);
        //var p = app.showPageAt($node[0], 'Test/View1');
        app.showPageAt($node[0], 'Test/View1').done($.proxy(function (p) {
            var text = $(p.node()).text();
            ok(text.indexOf('View1') >= 0);
            //ok(text.indexOf('model1') >= 0);
            start();
        }, self));
    });

    asyncTest('单视图绑定', function () {
        var $node = $('<div>').appendTo(document.body);
        app.showPageAt($node[0], 'Test/View2').done($.proxy(function (p) {
            var text = $(p.node()).text();
            ok(text.indexOf('View2') >= 0);
            start();
        }, self));
    });
    asyncTest('测试加载', function () {
        //debugger;
        var $node = $('<div>').appendTo(document.body);
        //var p = app.showPageAt($node[0], 'Test/View3');
        app.showPageAt($node[0], 'Test/View3').done($.proxy(function (p) {
            var $node = $(p.node());
            ok($node.text() == 'View3');
            p.open().done(function () {
                var text = $(p.node()).text();
                ok(text == 'View3');
            });
            start();
        }, self));

    });
    asyncTest('测试显示事件', function () {
        var $node = $('<div>').appendTo(document.body);
        app.showPageAt($node[0], 'Test/View4').done(function (p) {
            var text = $(p.node()).text();
            ok(text.indexOf('View4') >= 0);
            start();
        });
    });

    test('controller', function () {
        var ctrl1 = app.controller({ controller: 'Test' });
        var ctrl2 = app.controller({ controller: 'Test' });
        equal(ctrl1, ctrl2);
    });

    asyncTest('action', function () {
        $.when(app.action({ controller: 'Test', action: 'View1' }), app.action({ controller: 'Test', action: 'View1' })).done(function (action1, action2) {
            equal(action1, action2);
            start();
        })
    });

    asyncTest('action', function () {
        var ctrl = app.controller({ controller: 'Test' });
        $.when(ctrl.action('View1'), ctrl.action('View1')).done(function (action1, action2) {
            equal(action1, action2);
            start();
        });
    });

    asyncTest('测试加载失败', function () {
        app.showPage('Test/ViewXXXX')
           .done(function () {
               ok(false, '错误');
               start();
           })
           .fail(function () {
               ok(true, '成功');
               start();
           });


    });

})();