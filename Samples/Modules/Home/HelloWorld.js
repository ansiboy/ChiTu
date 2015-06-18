chitu.action(function (page) {
    /// <param name="page" type="chitu.Page"/>

    $('div').html('Hello Everyone！');
    $('<div>').appendTo(page.node()).html('Good Bye');

});