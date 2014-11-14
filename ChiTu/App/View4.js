chitu.register(function (page) {
    /// <param name="page" type="chitu.Page"/>
    var model = {
        title: ko.observable()
    };
    page.model(model);

    page.load.add(function (title) {
        model.title("Event Test");
    });

});