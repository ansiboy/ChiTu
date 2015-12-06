
var cur_scroll_args: ScrollArguments = new ScrollArguments();
var pre_scroll_top: number;
var checking_num: number;
var CHECK_INTERVAL = 300;

function scrollEndCheck(page: chitu.Page) {
    if (checking_num != null) return;
    //======================
    // 锁定，不让滚动期内创建二次，因setInterval有一定的时间。
    checking_num = 0;
    //======================
    checking_num = window.setInterval(() => {
        if (pre_scroll_top == cur_scroll_args.scrollTop) {
            window.clearInterval(checking_num);
            checking_num = null;
            pre_scroll_top = null;

            page.on_scrollEnd(cur_scroll_args);

            return;
        }
        pre_scroll_top = cur_scroll_args.scrollTop;

    }, CHECK_INTERVAL);
}


class DocumentScroll {
    constructor(page: chitu.Page) {
        $(document).scroll(function (event) {
            if (!page.visible())
                return;

            var args = {
                scrollTop: $(document).scrollTop(),
                scrollHeight: document.body.scrollHeight,
                clientHeight: $(window).height()
            };

            cur_scroll_args.clientHeight = args.clientHeight;
            cur_scroll_args.scrollHeight = args.scrollHeight;
            cur_scroll_args.scrollTop = args.scrollTop;

            $(page.node()).data(page.name + '_scroll_top', args.scrollTop);
            scrollEndCheck(page);
        });

        page.shown.add((sender: chitu.Page) => {
            var value = $(page.node()).data(page.name + '_scroll_top');
            if (value != null)
                $(document).scrollTop(new Number(value).valueOf());
        });

        //page.shown.add(function (sender) {
        //    // 说明：显示页面，scrollTop 定位
        //    sender.scrollTop($(sender.node()).data(scroll_top_data_name) || '0px');
        //});

        //page.scroll.add(function (sender, args) {
        //    $(sender.node()).data(scroll_top_data_name, sender.scrollTop());
        //});

    }
}
