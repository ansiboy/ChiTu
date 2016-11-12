QUnit.test('路由测试', (assert) => {
    let routeParser = new chitu.RouteParser();
    let routeData = routeParser.parseRouteString('home/index/?pageId=10&name=index');
    
    assert.notEqual(routeData, null);
    assert.equal(routeData.actionName, '');
    assert.equal(routeData.actionPath, `${routeParser.basePath}/home/index`);
    assert.equal(routeData.values.pageId, '10');
    assert.equal(routeData.values.name, 'index');
    // app.showPage('home/index/').then((page) => {
    //     assert.equal(page.name, 'home.index.index');
    //     let element = document.querySelector(`page[name='${page.name}']`);
    //     assert.notEqual(element, null);
    //     QUnit.start();
    // });

});
