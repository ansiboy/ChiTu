QUnit.test('路由测试', (assert) => {
    let routeData = new chitu.RouteData('modules','home/index/?pageId=10&name=index');
    
    assert.notEqual(routeData, null);
    assert.equal(routeData.actionPath, `modules/home/index`);
    assert.equal(routeData.values.pageId, '10');
    assert.equal(routeData.values.name, 'index');
});
