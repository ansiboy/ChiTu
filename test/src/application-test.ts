import chitu = require('chitu');

var app = new chitu.Application();

QUnit.test("Application.parseUrl 路径、名称、参数测试", (assert) => {
    assert.notEqual(app.config, null);

    let routeData = app.parseUrl('#home/index');

    console.log(routeData.actionPath);
    console.log(routeData.viewPath);
    console.log(routeData.pageName);

    let actionPath = 'modules/home/index';
    let viewPath = 'modules/home/index.html';
    let pageName = 'home.index';

    assert.equal(routeData.actionPath, actionPath);
    assert.equal(routeData.viewPath, viewPath);
    assert.equal(routeData.pageName, pageName);

    routeData = app.parseUrl('#user/security/setting');
    actionPath = 'modules/user/security/setting';
    viewPath = 'modules/user/security/setting.html';
    pageName = 'user.security.setting';

    assert.equal(routeData.actionPath, actionPath);
    assert.equal(routeData.viewPath, viewPath);
    assert.equal(routeData.pageName, pageName);

    routeData = app.parseUrl('#user/security/setting?');
    assert.equal(routeData.actionPath, actionPath);
    assert.equal(routeData.viewPath, viewPath);
    assert.equal(routeData.pageName, pageName);

    routeData = app.parseUrl('#user/security/setting?name=maishu');
    assert.equal(routeData.actionPath, actionPath);
    assert.equal(routeData.viewPath, viewPath);
    assert.equal(routeData.pageName, pageName);
    assert.equal(routeData.values.name, 'maishu');
});

QUnit.asyncTest('Application.showPage 显示页面', (assert) => {
    app.showPage('#user/security/setting?name=maishu').done(page => {
        var element = document.getElementById('user.security.setting');
        assert.notEqual(element, null, "断言页面元素");
        page.load.add((sender, args) => {
            assert.equal(args.name, "maishu", "load 事件获取参数");
            QUnit.start();
        });

    });
});

QUnit.asyncTest('Application.showPage 显示无视图页面', (assert) => {

    let parseUrl = app.parseUrl;
    app.parseUrl = (url: string): chitu.RouteData => {
        var result = <chitu.RouteData>parseUrl.apply(app, [url]);
        if (result.pageName == 'user.index') {
            result.viewPath = null;
        }
        return result;
    };

    app.showPage('#user/index').done(() => {
        let page = app.getPage('user.index');

        assert.notEqual(page, null);
        QUnit.start();
    });
});


