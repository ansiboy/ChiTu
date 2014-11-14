chitu.register(['jquery'], function (page) {
    /// <param name="page" type="chitu.Page"/>
    //debugger;
    var model = {
        name: ko.observable('View2')
    };
    page.model(model);
});