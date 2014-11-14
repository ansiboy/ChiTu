chitu.action(function (page) {
    /// <param name="page" type="chitu.Page"/>
    page.model({
        user: {
            username: ko.observable(),
            password: ko.observable()
        }
    });
});