/// <reference path="../Scripts/typings/hammer.d.ts"/>
/// <reference path="../Scripts/typings/jquery.d.ts"/>
/// <reference path="../Scripts/typings/QUnit.d.ts"/>
/// <reference path="../Scripts/typings/chitu.d.ts"/>

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


