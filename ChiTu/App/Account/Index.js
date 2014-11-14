chitu.action(function (page) {
    /// <param name="page" type="chitu.Page"/>

    var group1 = [{ text: '订单查询', url: 'Account/Orders' },
                  { text: '我的礼券', url: 'Account/Coupons' }];
    var group2 = [{ text: '收货信息', url: 'Account/Receipts' },
                  { text: '修改资料', url: 'Account/UserInfo' }];

    var model = {
        menuGroups: [group1, group2],
        showPage: function (item) {
            app.redirect(item.url);
            //.done(function (page) {
            //    /// <param name="page" type="chitu.Page"/>
            //    //debugger;
            //});
        }
    };

    page.model(model);
});