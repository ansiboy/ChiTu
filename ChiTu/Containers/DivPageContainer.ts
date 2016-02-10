namespace chitu{
     export class DivPageContainer extends WebPageContainer {

        private cur_scroll_args: ScrollArguments = new ScrollArguments();
        private pre_scroll_top: number;
        private checking_num: number;
        private CHECK_INTERVAL = 300;

        constructor(previous: DivPageContainer) {
            super(previous);
            $(this.nodes.container).addClass('div');
            var wrapper_node = this.nodes.body;
            wrapper_node.onscroll = () => {
                var args = {
                    scrollTop: wrapper_node.scrollTop,
                    scrollHeight: wrapper_node.scrollHeight,
                    clientHeight: wrapper_node.clientHeight
                };

                //this.on_scroll(args);
                this.scrollEndCheck();
            };
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
                // 当 scrollTop 不发生变化，则可以认为滚动已经停止。
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
    }

    
}