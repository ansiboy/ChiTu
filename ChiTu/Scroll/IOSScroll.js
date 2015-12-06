var _this = this;
var IOSScroll = (function () {
    function IOSScroll(page) {
        var options = {
            tap: true,
            useTransition: false,
            HWCompositing: false,
            preventDefault: true,
            probeType: 1,
        };
        var iscroller = this.iscroller = page['iscroller'] = new IScroll(page.nodes().body, options);
        iscroller.on('scrollEnd', function () {
            var scroller = this;
            var args = {
                scrollTop: 0 - scroller.y,
                scrollHeight: scroller.scrollerHeight,
                clientHeight: scroller.wrapperHeight
            };
            console.log('directionY:' + scroller.directionY);
            console.log('startY:' + scroller.startY);
            console.log('scroller.y:' + scroller.y);
            page.on_scrollEnd(args);
        });
        iscroller.on('scroll', function () {
            var scroller = this;
            var args = {
                scrollTop: 0 - scroller.y,
                scrollHeight: scroller.scrollerHeight,
                clientHeight: scroller.wrapperHeight
            };
            console.log('directionY:' + scroller.directionY);
            console.log('startY:' + scroller.startY);
            console.log('scroller.y:' + scroller.y);
            page.on_scroll(args);
        });
        (function (scroller, wrapperNode) {
            $(wrapperNode).on('tap', function (event) {
                if (page['iscroller'].enabled == false)
                    return;
                var MAX_DEEPH = 4;
                var deeph = 1;
                var node = event.target;
                while (node != null) {
                    if (node.tagName == 'A')
                        return window.open($(node).attr('href'), '_self');
                    node = node.parentNode;
                    deeph = deeph + 1;
                    if (deeph > MAX_DEEPH)
                        return;
                }
            });
        })(iscroller, page.nodes().body);
        page.closed.add(function () { return iscroller.destroy(); });
        $(window).on('resize', function () {
            window.setTimeout(function () { return iscroller.refresh(); }, 500);
        });
    }
    IOSScroll.prototype.refresh = function () {
        this.iscroller.refresh();
    };
    return IOSScroll;
})();
chitu.scroll = function (page, config) {
    $(page.nodes().body).addClass('wrapper');
    $(page.nodes().content).addClass('scroller');
    var wrapperNode = page['_wrapperNode'] = page.nodes().body;
    page['_scrollerNode'] = page.nodes().content;
    $.extend(page, {
        scrollEnd: chitu.Callbacks(),
        on_scrollEnd: function (args) {
            return chitu.fireCallback(this.scrollEnd, [this, args]);
        },
        scrollTop: $.proxy(function (value) {
            if (value === undefined)
                return (0 - page['iscroller'].y) + 'px';
            if (typeof value === 'string')
                value = new Number(value.substr(0, value.length - 2)).valueOf();
            var scroller = _this['iscroller'];
            if (scroller) {
                scroller.scrollTo(0, value);
            }
        }, page)
    });
};
