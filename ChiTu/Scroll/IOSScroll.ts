namespace chitu {
    export class IOSScroll {

        private iscroller: IScroll;

        constructor(page: chitu.Page) {
            requirejs(['iscroll'], () => this.init(page));
        }

        private init(page: chitu.Page) {
            var options = {
                tap: true,
                useTransition: false,
                HWCompositing: false,
                preventDefault: true,   // 必须设置为 True，否是在微信环境下，页面位置在上拉，或下拉时，会移动。
                probeType: 1,
                //bounce: true,
                //bounceTime: 600
            }

            var iscroller = this.iscroller = page['iscroller'] = new IScroll(page.nodes().body, options);

            //window.setTimeout(() => iscroller.refresh(), 1000);

            iscroller.on('scrollEnd', function() {
                var scroller = <IScroll>this;
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

            iscroller.on('scroll', function() {
                var scroller = <IScroll>this;
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

            (function(scroller: IScroll, wrapperNode: HTMLElement) {

                $(wrapperNode).on('tap', (event) => {
                    if (page['iscroller'].enabled == false)
                        return;

                    var MAX_DEEPH = 4;
                    var deeph = 1;
                    var node = <HTMLElement>event.target;
                    while (node != null) {
                        if (node.tagName == 'A')
                            return window.open($(node).attr('href'), '_self');

                        node = <HTMLElement>node.parentNode;
                        deeph = deeph + 1;
                        if (deeph > MAX_DEEPH)
                            return;
                    }
                })

            })(iscroller, page.nodes().body);

            page.closing.add(() => iscroller.destroy());

            $(window).on('resize', () => {
                window.setTimeout(() => iscroller.refresh(), 500);
            });
        }

        refresh() {
            if (this.iscroller)
                this.iscroller.refresh();
        }
    }

    (<any>chitu).scroll = (page: chitu.Page, config) => {


        $(page.nodes().body).addClass('wrapper');
        $(page.nodes().content).addClass('scroller');

        var wrapperNode = page['_wrapperNode'] = page.nodes().body;
        page['_scrollerNode'] = page.nodes().content;

        //$.extend(page, {
        //    scrollEnd: chitu.Callbacks(),
        //    on_scrollEnd: function (args) {
        //        return chitu.fireCallback(this.scrollEnd, [this, args]);
        //    },
        //    scrollTop: $.proxy((value: number | string) => {
        //        if (value === undefined)
        //            return (0 - page['iscroller'].y) + 'px';

        //        if (typeof value === 'string')
        //            value = new Number((<string>value).substr(0, (<string>value).length - 2)).valueOf();

        //        var scroller = this['iscroller'];
        //        if (scroller) {
        //            scroller.scrollTo(0, value);
        //        }
        //    }, page)
        //})

        //var page_shown = (sender: chitu.Page) => {
        //    window.setTimeout(() => {
        //        sender['iscroller'].refresh();
        //    }, 500);
        //}

        //page.shown.add(page_shown);
        //if (page.visible())
        //    page_shown(page);



    }
}