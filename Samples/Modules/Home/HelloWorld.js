define(function () {
    return function (page, move) {
        /// <param name="page" type="chitu.Page"/>

        //page.node().firstChild('')

        //$('div').html('Hello Everyone！');
        //$('<div>').appendTo(page.node()).html('Good Bye');
        //window.setTimeout(function () {
        //    page.close();

        //}, 3000);
        page.load.add(function () {
            var result = $.Deferred();
            window.setTimeout(function () {
                //result.resolve();
            }, 3000);
            alert('hello');
            //.resolve();
            return result;
        });
    }
});