var cur_scroll_args = new ScrollArguments();
var pre_scroll_top;
var checking_num;
var CHECK_INTERVAL = 300;
function scrollEndCheck(page) {
    if (checking_num != null)
        return;
    checking_num = 0;
    checking_num = window.setInterval(function () {
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
var DocumentScroll = (function () {
    function DocumentScroll(page) {
        $(document).scroll(function (event) {
            var args = {
                scrollTop: $(document).scrollTop(),
                scrollHeight: document.body.scrollHeight,
                clientHeight: $(window).height()
            };
            cur_scroll_args.clientHeight = args.clientHeight;
            cur_scroll_args.scrollHeight = args.scrollHeight;
            cur_scroll_args.scrollTop = args.scrollTop;
            $(page.node()).data(page.name + '_scroll_top', args.scrollTop);
            if (page.visible())
                scrollEndCheck(page);
        });
        page.shown.add(function (sender) {
            debugger;
            var value = $(page.node()).data(page.name + '_scroll_top');
            if (value)
                $(document).scrollTop(new Number(value).valueOf());
        });
    }
    return DocumentScroll;
})();
