asyncTest('PageContainer.back', function () {
    var node = document.createElement('div');
    document.body.appendChild(node);
    var c = new chitu.PageContainer(app, node);

    var text1, text2;
    c.showPage('Test/View1').pipe(function () {
        text1 = $(c.node()).text();
        return c.showPage('Test/View3')
    })
    .done(function () {
        c.back().done(function () {
            text2 = $(c.node()).children(':visible').text();
            equal(text1, text2);
            start();
        })
        .fail(function () {

        });
    });


});