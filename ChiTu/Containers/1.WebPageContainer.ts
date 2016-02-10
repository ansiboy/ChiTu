namespace chitu {
   export class ScrollArguments {
        scrollTop: number
        scrollHeight: number
        clientHeight: number
    }

    export abstract class WebPageContainer implements PageContainer {
        private animationTime: number = 300;
        private num: Number;

        protected nodes: PageNodes;
        protected previous: PageContainer;

        scrollEnd = $.Callbacks()

        constructor(prevous: PageContainer) {
            //if (!node) throw Errors.argumentNull('node');
            //$(node).hide();
            var node = document.createElement('div');
            document.body.appendChild(node);

            this.previous = prevous;
            this.nodes = new chitu.PageNodes(node);
            this.disableHeaderFooterTouchMove();
        }
        show(swipe: SwipeDirection): JQueryPromise<any> {
            if (this.visible == true)
                return $.Deferred().resolve();

            var container_width = $(this.nodes.container).width();
            var container_height = $(this.nodes.container).height();

            var result = $.Deferred();
            var on_end = () => {
                result.resolve();
            };

            switch (swipe) {
                case SwipeDirection.None:
                    $(this.nodes.container).show();
                    result = $.Deferred().resolve();
                    break;
                case SwipeDirection.Down:
                    this.translateY(0 - container_height, 0);
                    $(this.nodes.container).show();
                    //======================================
                    // 不要问我为什么这里要设置 timeout，反正不设置不起作用。
                    window.setTimeout(() => {
                        this.translateY(0, this.animationTime).done(on_end);
                    }, 30);
                    //======================================
                    break;
                case SwipeDirection.Up:
                    this.translateY(container_height, 0);
                    $(this.nodes.container).show();
                    window.setTimeout(() => {
                        this.translateY(0, this.animationTime).done(on_end);
                    }, 30);
                    break;
                case SwipeDirection.Right:
                    this.translateX(0 - container_width, 0);
                    $(this.nodes.container).show();
                    window.setTimeout(() => {
                        this.translateX(0, this.animationTime).done(on_end)
                    }, 30);
                    break;
                case SwipeDirection.Left:
                    this.translateX(container_width, 0);
                    $(this.nodes.container).show();
                    window.setTimeout(() => {
                        this.translateX(0, this.animationTime).done(on_end);
                    }, 30);
                    break;
            }
            return result;
        }
        
        /// <summary>动画的效果的持续时间，这里使用定时器，是因为 transitionEnd 事件并非都起作用。</summary>
        private translateDuration(duration: number) {
            if (duration < 0)
                throw Errors.paramError('Parameter duration must greater or equal 0, actual is ' + duration + '.');

            var result = $.Deferred();
            if (duration == 0) {
                this.nodes.container.style.transitionDuration =
                    this.nodes.container.style.webkitTransitionDuration = '';

                return result.resolve();
            }

            this.nodes.container.style.transitionDuration =
                this.nodes.container.style.webkitTransitionDuration = duration + 'ms';

            window.setTimeout(() => result.resolve(), duration);
            return result;
        }
        private translateX(x: number, duration?: number): JQueryPromise<any> {

            var result = this.translateDuration(duration);
            this.nodes.container.style.transform = this.nodes.container.style.webkitTransform
                = 'translateX(' + x + 'px)';

            return result;
        }
        private translateY(y: number, duration?: number): JQueryPromise<any> {

            var result = this.translateDuration(duration);
            this.nodes.container.style.transform = this.nodes.container.style.webkitTransform
                = 'translateY(' + y + 'px)';

            return result;
        }
        private disableHeaderFooterTouchMove() {
            $([this.footer, this.header]).on('touchmove', function(e) {
                e.preventDefault();
            })
        }
        hide(swipe: SwipeDirection): JQueryPromise<any> {
            if (this.visible == false)
                return $.Deferred().resolve();

            var container_width = $(this.nodes.container).width();
            var container_height = $(this.nodes.container).height();
            var result: JQueryPromise<any>;
            switch (swipe) {
                case SwipeDirection.None:
                    result = $.Deferred().resolve();
                    break;
                case SwipeDirection.Down:
                    result = this.translateY(container_height, this.animationTime);
                    break;
                case SwipeDirection.Up:
                    result = this.translateY(0 - container_height, this.animationTime);
                    break;
                case SwipeDirection.Right:
                    result = this.translateX(container_width, this.animationTime);
                    break;
                case SwipeDirection.Left:
                    result = this.translateX(0 - container_width, this.animationTime);
                    break;
            }
            result.done(() => $(this.nodes.container).hide());
            return result;
        }

        private is_dispose = false;
        dispose() {
            if (this.is_dispose)
                return;

            this.is_dispose = true;
            this.nodes.container.parentNode.removeChild(this.nodes.container);
        }
        get header() {
            return this.nodes.header;
        }
        get content() {
            return this.nodes.content;
        }
        get footer() {
            return this.nodes.footer;
        }
        get loading() {
            return this.nodes.loading;
        }
        get visible() {
            return $(this.nodes.container).is(':visible');
        }
        set visible(value: boolean) {
            if (value)
                $(this.nodes.container).show();
            else
                $(this.nodes.container).hide();
        }
    }

   

   

}