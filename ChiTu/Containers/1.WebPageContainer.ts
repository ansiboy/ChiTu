namespace chitu {
    export class ScrollArguments {
        scrollTop: number
        scrollHeight: number
        clientHeight: number
    }

    export abstract class WebPageContainer implements PageContainer {
        private animationTime: number = 300;
        private num: Number;

        private _topBar: HTMLElement;
        private _bottomBar: HTMLElement;
        private _node: HTMLElement;

        nodes: PageNodes;
        protected previous: PageContainer;

        scrollEnd = $.Callbacks()

        constructor(prevous: PageContainer) {

            var node = document.createElement('div');
            node.className = 'page-container';
            document.body.appendChild(node);

            var topBar = document.createElement('div');
            var bottomBar = document.createElement('div');
            var body = document.createElement('div');

            topBar.className = 'page-topBar';
            bottomBar.className = 'page-bottomBar';

            node.appendChild(topBar);
            node.appendChild(body);
            node.appendChild(bottomBar);
            
            this._topBar = topBar;
            this._bottomBar = bottomBar;
            this._node = node;

            this.previous = prevous;
            this.nodes = new chitu.PageNodes(body);
            this.disableHeaderFooterTouchMove();

            $(this._node).hide();

        }
        show(swipe: SwipeDirection): JQueryPromise<any> {
            if (this.visible == true)
                return $.Deferred().resolve();

            var container_width = $(this._node).width();
            var container_height = $(this._node).height();

            var result = $.Deferred();
            var on_end = () => {
                result.resolve();
            };

            switch (swipe) {
                case SwipeDirection.None:
                default:
                    $(this._node).show();
                    result = $.Deferred().resolve();
                    break;
                case SwipeDirection.Down:
                    this.translateY(0 - container_height, 0);
                    $(this._node).show();
                    //======================================
                    // 不要问我为什么这里要设置 timeout，反正不设置不起作用。
                    window.setTimeout(() => {
                        this.translateY(0, this.animationTime).done(on_end);
                    }, 30);
                    //======================================
                    break;
                case SwipeDirection.Up:
                    this.translateY(container_height, 0);
                    $(this._node).show();
                    window.setTimeout(() => {
                        this.translateY(0, this.animationTime).done(on_end);
                    }, 30);
                    break;
                case SwipeDirection.Right:
                    this.translateX(0 - container_width, 0);
                    $(this._node).show();
                    window.setTimeout(() => {
                        this.translateX(0, this.animationTime).done(on_end)
                    }, 30);
                    break;
                case SwipeDirection.Left:
                    this.translateX(container_width, 0);
                    $(this._node).show();
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
               this._node.style.transitionDuration =
                    this._node.style.webkitTransitionDuration = '';

                return result.resolve();
            }

            this._node.style.transitionDuration =
                this._node.style.webkitTransitionDuration = duration + 'ms';

            window.setTimeout(() => result.resolve(), duration);
            return result;
        }
        private translateX(x: number, duration?: number): JQueryPromise<any> {

            var result = this.translateDuration(duration);
            this._node.style.transform = this._node.style.webkitTransform
                = 'translateX(' + x + 'px)';

            return result;
        }
        private translateY(y: number, duration?: number): JQueryPromise<any> {

            var result = this.translateDuration(duration);
            this._node.style.transform = this._node.style.webkitTransform
                = 'translateY(' + y + 'px)';

            return result;
        }
        private disableHeaderFooterTouchMove() {
            $([this.topBar, this.bottomBar]).on('touchmove', function(e) {
                e.preventDefault();
            })
        }
        private wrapPageNode() {

        }
        hide(swipe: SwipeDirection): JQueryPromise<any> {
            if (this.visible == false)
                return $.Deferred().resolve();

            var container_width = $(this._node).width();
            var container_height = $(this._node).height();
            var result: JQueryPromise<any>;
            switch (swipe) {
                case SwipeDirection.None:
                default:
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
            result.done(() => $(this._node).hide());
            return result;
        }

        private is_dispose = false;
        dispose() {
            if (this.is_dispose)
                return;

            this.is_dispose = true;
            $(this._node).remove();
        }
        get topBar() {
            return this._topBar;
        }
        get bottomBar() {
            return this._bottomBar;
        }
        get loading() {
            return this.nodes.loading;
        }
        get visible() {
            return $(this._node).is(':visible');
        }
        set visible(value: boolean) {
            if (value)
                $(this._node).show();
            else
                $(this._node).hide();
        }
    }





}