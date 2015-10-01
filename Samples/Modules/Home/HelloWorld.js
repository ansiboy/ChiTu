chitu.action(function (page, move) {
    /// <param name="page" type="chitu.Page"/>

    //page.node().firstChild('')

    //$('div').html('Hello Everyone！');
    //$('<div>').appendTo(page.node()).html('Good Bye');
    window.setTimeout(function () {
        page.close();

    }, 3000);
});