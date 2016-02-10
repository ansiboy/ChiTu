namespace chitu {
    export class DocumentPageContainer extends WebPageContainer {

        private cur_scroll_args = new ScrollArguments();
        private checking_num: number;
        private pre_scroll_top: number;
        private CHECK_INTERVAL = 300;

        constructor(previous: DocumentPageContainer) {
            super(previous);

            $(this.nodes.container).addClass('doc');
            $(document).scroll((event) => {
                // if (!page.visible())
                //     return;

                var args = {
                    scrollTop: $(document).scrollTop(),
                    scrollHeight: document.body.scrollHeight,
                    clientHeight: $(window).height()
                };

                this.cur_scroll_args.clientHeight = args.clientHeight;
                this.cur_scroll_args.scrollHeight = args.scrollHeight;
                this.cur_scroll_args.scrollTop = args.scrollTop;
                this.scrollEndCheck();
            });
        }

        private on_scrollEnd(args: ScrollArguments) {
            this.scrollEnd.fire(this, args);
        }

        private scrollEndCheck() {
            if (this.checking_num != null) return;
            //======================
            // 锁定，不让滚动期内创建二次，因setInterval有一定的时间。
            this.checking_num = 0;
            //======================
            this.checking_num = window.setInterval(() => {
                if (this.pre_scroll_top == this.cur_scroll_args.scrollTop) {
                    window.clearInterval(this.checking_num);
                    this.checking_num = null;
                    this.pre_scroll_top = null;

                    this.on_scrollEnd(this.cur_scroll_args);

                    return;
                }
                this.pre_scroll_top = this.cur_scroll_args.scrollTop;

            }, this.CHECK_INTERVAL);
        }

        show(swipe: SwipeDirection) {
            if (this.previous != null)
                this.previous.hide(SwipeDirection.None);

            return super.show(swipe);
        }

        hide(swipe: SwipeDirection) {
            var result = super.hide(swipe);
            if (this.previous != null)
                this.previous.show(SwipeDirection.None);

            return result;
        }
    }
}