
class Application extends chitu.Application {
    constructor() {
        super(); this.parseRouteString
    }

    parseRouteString(routeString) {
        let routeData = super.parseRouteString(routeString);
        routeData.resource = [
            `text!${routeData.actionPath}.html`
        ];
        return routeData;
    }
}

var app = new Application();
QUnit.asyncTest('测试 resource 的加载', function (assert) {
    app.showPage('user/security/setting/').then(function (page) {
        page.load.add((sender, html) => {
            assert.notEqual(html, null);
            QUnit.start();
        })
    });
});
// QUnit.test("Application.parseUrl 路径、名称、参数测试", function (assert) {
//     assert.notEqual(app.config, null);
//     var routeData = app.parseUrl('#home/index');
//     console.log(routeData.actionPath);
//     console.log(routeData.pageName);
//     var actionPath = 'modules/home/index';
//     var viewPath = 'modules/home/index.html';
//     var pageName = 'home.index';
//     assert.equal(routeData.actionPath, actionPath);
//     assert.equal(routeData.pageName, pageName);
//     routeData = app.parseUrl('#user/security/setting');
//     actionPath = 'modules/user/security/setting';
//     viewPath = 'modules/user/security/setting.html';
//     pageName = 'user.security.setting';
//     assert.equal(routeData.actionPath, actionPath);
//     assert.equal(routeData.pageName, pageName);
//     routeData = app.parseUrl('#user/security/setting?');
//     assert.equal(routeData.actionPath, actionPath);
//     assert.equal(routeData.pageName, pageName);
//     routeData = app.parseUrl('#user/security/setting?name=maishu');
//     assert.equal(routeData.actionPath, actionPath);
//     assert.equal(routeData.pageName, pageName);
//     assert.equal(routeData.values.name, 'maishu');
// });
// QUnit.asyncTest('Application.showPage 显示页面', function (assert) {
//     app.showPage('#user/security/setting?name=maishu').done(function (page) {
//         var element = document.getElementById('user.security.setting');
//         assert.notEqual(element, null, "断言页面元素");
//         page.load.add(function (sender, args) {
//             assert.equal(args.name, "maishu", "load 事件获取参数");
//             QUnit.start();
//         });
//     });
// });
// QUnit.asyncTest('Application.showPage 显示无视图页面', function (assert) {
//     var parseUrl = app.parseUrl;
//     app.parseUrl = function (url) {
//         var result = parseUrl.apply(app, [url]);
//         return result;
//     };
//     app.showPage('#user/index').done(function () {
//         var page = app.getPage('user.index');
//         assert.notEqual(page, null);
//         QUnit.start();
//     });
// });
// QUnit.asyncTest('Application.pageCreated 事件', function (assert) {
//     var app = new chitu.Application();
//     app.pageCreated.add(function (s, p) {
//         assert.equal(p.name, 'home.index');
//         QUnit.start();
//     });
//     app.showPage('#home/index');
// });
// QUnit.asyncTest('Page 关闭事件', function (assert) {
//     var app = new chitu.Application();
//     app.showPage('#home/index').done(function (page) {
//         var closing_called = false;
//         var closed_called = false;
//         page.closing.add(function () {
//             closing_called = true;
//         });
//         page.closed.add(function () {
//             closed_called = true;
//         });
//         page.close();
//         setTimeout(function () {
//             assert.equal(closing_called, true, 'closing 事件已调用');
//             assert.equal(closed_called, true, 'closed 事件已调用');
//             QUnit.start();
//         }, 100);
//     });
// });
