QUnit.test('路由测试', (assert) => {
    let routeParser = new chitu.RouteParser();
    let routeData = routeParser.parseRouteString('home/index/?pageId=10&name=index');
    
    assert.notEqual(routeData, null);
    assert.equal(routeData.actionPath, `home/index`);
    assert.equal(routeData.values.pageId, '10');
    assert.equal(routeData.values.name, 'index');
});
