var ScrollArguments = (function () {
    function ScrollArguments() {
    }
    return ScrollArguments;
})();
var DisScroll = (function () {
    function DisScroll(page) {
        var cur_scroll_args = new ScrollArguments();
        var pre_scroll_top;
        var checking_num;
        var CHECK_INTERVAL = 300;
        var scrollEndCheck = function (page) {
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
        };
        var wrapper_node = page.nodes().body;
        wrapper_node.onscroll = function () {
            var args = {
                scrollTop: wrapper_node.scrollTop,
                scrollHeight: wrapper_node.scrollHeight,
                clientHeight: wrapper_node.clientHeight
            };
            page.on_scroll(args);
            cur_scroll_args.clientHeight = args.clientHeight;
            cur_scroll_args.scrollHeight = args.scrollHeight;
            cur_scroll_args.scrollTop = args.scrollTop;
            scrollEndCheck(page);
        };
    }
    return DisScroll;
})();
