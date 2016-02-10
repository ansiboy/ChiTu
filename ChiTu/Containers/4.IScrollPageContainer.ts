namespace chitu {
    export class IScrollPageContainer extends WebPageContainer {

        private iscroller: IScroll;

        scroll: JQueryCallback = $.Callbacks();

        constructor( previous: IScrollPageContainer) {
            super(previous);
            $(this.nodes.container).addClass('ios');
            $(this.nodes.body).addClass('wrapper');
            $(this.nodes.content).addClass('scroller');
            requirejs(['iscroll'], () => this.init(this.nodes));
        }

        private on_scroll(args) {
            this.scroll.fire(this, args);
        }

        private on_scrollEnd(args) {
            this.scrollEnd.fire(this, args);
        }

        private init(nodes: PageNodes) {
            var options = {
                tap: true,
                useTransition: false,
                HWCompositing: false,
                preventDefault: true,   // 必须设置为 True，否是在微信环境下，页面位置在上拉，或下拉时，会移动。
                probeType: 1,
                //bounce: true,
                //bounceTime: 600
            }

            var iscroller = this.iscroller = new IScroll(this.nodes.body, options);//= page['iscroller']
            iscroller['page_container'] = this;
            //window.setTimeout(() => iscroller.refresh(), 1000);

            iscroller.on('scrollEnd', function() {
                var scroller = <IScroll>this;
                var args = {
                    scrollTop: 0 - scroller.y,
                    scrollHeight: scroller.scrollerHeight,
                    clientHeight: scroller.wrapperHeight
                };
                (<IScrollPageContainer>scroller['page_container']).on_scrollEnd(args);
            });

            iscroller.on('scroll', function() {
                var scroller = <IScroll>this;
                var args = {
                    scrollTop: 0 - scroller.y,
                    scrollHeight: scroller.scrollerHeight,
                    clientHeight: scroller.wrapperHeight
                };

                (<IScrollPageContainer>scroller['page_container']).on_scroll(args);
            });

            (function(scroller: IScroll, wrapperNode: HTMLElement) {

                $(wrapperNode).on('tap', (event) => {
                    if (scroller.enabled == false)
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

            })(iscroller, this.nodes.body);

            $(window).on('resize', () => {
                window.setTimeout(() => iscroller.refresh(), 500);
            });
        }

        private _is_dispose = false;
        dispose() {
            if (this._is_dispose)
                return;

            this._is_dispose = true;
            this.iscroller.destroy();
            return super.dispose();
        }

        refresh() {
            if (this.iscroller)
                this.iscroller.refresh();
        }
    }
}