// 页面显示次序
asyncTest('PageContainer.showPage -- 页面显示次序', function () {
    var node = document.createElement('div');
    document.body.appendChild(node);
    var c = new chitu.PageContainer(app, node);

    var arr = [];
    c.pageCreated.add(function (sender, page) {
        /// <param name="context" type="chitu.ControllerContext"/>
        /// <param name="page" type="chitu.Page"/>
        page.shown.add(function (sender) {
            arr.push(sender.name() + ' show');
        });

        page.hidden.add(function (sender) {
            arr.push(sender.name() + ' hide');
        });
    });
    c.showPage('Test/View1');
    var node1 = c.node();
    c.showPage('Test/View2').done(function () {
        var node2 = c.node();
        equal(node1, node2);
        equal(arr[0], ['Test.View1 show']);
        equal(arr[1], ['Test.View1 hide']);
        equal(arr[2], ['Test.View2 show']);
        start();
    });
});

asyncTest('PageContainer.showPage -- 显示内容', function () {

    var node = document.createElement('div');
    document.body.appendChild(node);

    var text1, text2;
    var c = new chitu.PageContainer(app, node);
    c.showPage('Test/View1').pipe(function () {
        equal(c.currentPage().name(), 'Test.View1');

        return c.showPage('Test/View2');
    })
    .done(function (page) {
        /// <param name="page" type="chitu.Page"/>

        text2 = $(c.node()).children(':visible').text().trim();
        equal(text2, 'View2');
        start();
    });






});