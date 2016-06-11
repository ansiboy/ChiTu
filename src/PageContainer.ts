// TODO:
// 1，关闭当页面容器并显示之前容器时，更新URL
// 2, 侧滑时，底容器带有遮罩效果。
//import Hammer = require('hammer');

namespace chitu {

    class ScrollArguments {
        scrollTop: number
        scrollHeight: number
        clientHeight: number
    }

    class PageContainerTypeClassNames {
        Div = 'div'
        IScroll = 'iscroll'
        Document = 'doc'
    }

    export class PageContainer {
        private animationTime: number = 300;
        private num: Number;

        private _node: HTMLElement;
        private _loading: HTMLElement;
        private _pages: Array<Page>;
        private _currentPage: Page;
        private _previous: PageContainer;
        private _app: Application;
        private _previousOffsetRate = 0.5; // 前一个页面，相对当前页面移动的比率
        private open_swipe: chitu.SwipeDirection;

        public enableSwipeClose = true;

        gesture: Gesture;
        pageCreated: chitu.Callback<PageContainer, Page> = Callbacks<PageContainer, Page>();

        constructor(app: Application, previous?: PageContainer) {

            this._node = this.createNode();
            this._loading = this.createLoading(this._node);
            this._pages = new Array<Page>();
            this._previous = previous;
            this._app = app;

            this.gesture = new Gesture(this._node);
            this._enableSwipeBack();
        }

        on_pageCreated(page: chitu.Page) {
            return chitu.fireCallback(this.pageCreated, this, page);
        }

        /** 启用滑动返回 */
        private _enableSwipeBack() {
            var container = this;
            if (container.previous == null || this.enableSwipeClose == false)
                return;

            var previous_start_x: number;
            var previous_visible: boolean;
            var node = container.element;
            var colse_position = $(window).width() / 2; // 关闭的位置，只有过了这个位置，才关闭。
            var horizontal_swipe_angle = 35;            // 水平滑动角度，角度不大于20度时，才认为是水平移动

            var pan = container.gesture.createPan();
            pan.start = (e: Hammer.PanEvent) => {
                node.style.webkitTransform = '';
                node.style.transform = ''
                var martix = new WebKitCSSMatrix(container.previous.element.style.webkitTransform);
                previous_start_x = martix.m41;
                if (ScrollView.scrolling == true)
                    return false;

                //==================================================
                // 说明：计算角度，超过了水平滑动角度，则认为不是水平滑动。
                var d = Math.atan(Math.abs(e.deltaY / e.deltaX)) / 3.14159265 * 180;
                if (d > horizontal_swipe_angle)
                    return false;
                //==================================================

                var result = (container.previous != null && (e.direction & Hammer.DIRECTION_RIGHT) != 0) &&
                    (this.open_swipe == SwipeDirection.Left || this.open_swipe == SwipeDirection.Right);

                if (result == true) {
                    previous_visible = this.previous.visible;
                    this.previous.visible = true;
                }

                return result;
            };

            pan.left = (e: Hammer.PanEvent) => {
                if (e.deltaX <= 0) {


                    move(node).x(0).duration(0).end();
                    move(this.previous.element).x(previous_start_x).duration(0).end();
                    return;
                }
                move(node).x(e.deltaX).duration(0).end();
                move(this.previous.element).x(previous_start_x + e.deltaX * this._previousOffsetRate).duration(0).end();
            }
            pan.right = (e: Hammer.PanEvent) => {
                move(node).x(e.deltaX).duration(0).end();
                move(this.previous.element).x(previous_start_x + e.deltaX * this._previousOffsetRate).duration(0).end();
            }
            pan.end = (e: Hammer.PanEvent) => {
                if (e.deltaX > colse_position) {
                    this._app.back();
                    return;
                }

                move(node).x(0).duration(Page.animationTime).end();
                move(container.previous.element).x(previous_start_x).duration(Page.animationTime)
                    .end(() => this.previous.visible = previous_visible);
            }
        }

        protected createNode(): HTMLElement {
            this._node = document.createElement('div');
            this._node.className = 'page-container';
            this._node.style.display = 'none';

            document.body.appendChild(this._node);

            return this._node;
        }

        protected createLoading(parent: HTMLElement): HTMLElement {
            var loading_element = document.createElement('div');
            loading_element.className = 'page-loading';
            loading_element.innerHTML = '<div class="spin"><i class="icon-spinner icon-spin"></i><div>';
            parent.appendChild(loading_element);

            return loading_element;
        }

        show(swipe: SwipeDirection): JQueryPromise<any> {
            if (this.visible == true)
                return $.Deferred().resolve();

            let container_width = $(this._node).width();
            var container_height = $(this._node).height();
            if (container_width <= 0 || container_height <= 0)
                swipe = SwipeDirection.None;

            let interval = 30;
            var result = $.Deferred();
            var on_end = () => {
                if (this.previous != null)
                    this.previous.visible = false;

                result.resolve();
            };

            this.open_swipe = swipe;
            switch (swipe) {
                case SwipeDirection.None:
                default:
                    $(this._node).show();
                    on_end();
                    break;
                case SwipeDirection.Down:
                    move(this.element).y(0 - container_height).duration(0).end();
                    $(this._node).show();
                    //======================================
                    // 不要问我为什么这里要设置 timeout，反正不设置不起作用。
                    window.setTimeout(() => {
                        move(this.element).y(0).duration(this.animationTime).end(on_end);
                    }, interval);
                    //======================================
                    break;
                case SwipeDirection.Up:
                    move(this.element).y(container_height).duration(0).end();
                    $(this._node).show();
                    window.setTimeout(() => {
                        move(this.element).y(0).duration(this.animationTime).end(on_end);
                    }, interval);
                    break;
                case SwipeDirection.Right:
                    move(this.element).x(0 - container_width).duration(0).end();
                    $(this._node).show();
                    window.setTimeout(() => {
                        if (this.previous != null)
                            move(this.previous.element).x(container_width * this._previousOffsetRate).duration(this.animationTime).end();

                        move(this.element).x(0).duration(this.animationTime).end(on_end);
                    }, interval);
                    break;
                case SwipeDirection.Left:
                    move(this.element).x(container_width).duration(0).end();
                    $(this._node).show();
                    window.setTimeout(() => {
                        if (this.previous != null)
                            move(this.previous.element).x(0 - container_width * this._previousOffsetRate).duration(this.animationTime).end();

                        move(this.element).x(0).duration(this.animationTime).end(on_end);
                    }, interval);
                    break;
            }
            return result;
        }

        hide(swipe: SwipeDirection): JQueryPromise<any> {
            if (this.visible == false)
                return $.Deferred().resolve();

            var container_width = $(this._node).width();
            var container_height = $(this._node).height();
            var result = $.Deferred();
            switch (swipe) {
                case SwipeDirection.None:
                default:
                    if (this.previous != null)
                        move(this.previous.element).x(0).duration(this.animationTime).end();

                    result.resolve();
                    break;
                case SwipeDirection.Down:
                    move(this.element).y(container_height).duration(this.animationTime).end(() => result.resolve())
                    break;
                case SwipeDirection.Up:
                    move(this.element).y(0 - container_height).duration(this.animationTime).end(() => result.resolve());
                    break;
                case SwipeDirection.Right:
                    if (this.previous != null)
                        move(this.previous.element).x(0).duration(this.animationTime).end();

                    move(this.element).x(container_width).duration(this.animationTime).end(() => result.resolve());
                    break;
                case SwipeDirection.Left:
                    if (this.previous != null)
                        move(this.previous.element).x(0).duration(this.animationTime).end();

                    move(this.element).x(0 - container_width).duration(this.animationTime).end(() => result.resolve());
                    break;
            }
            return result;
        }

        private is_closing = false;
        close(swipe: SwipeDirection) {
            if (this.is_closing)
                return;

            this.is_closing = true;
            this.hide(swipe).done(() => {
                $(this._node).remove();
            })
        }
        private showLoading() {
            this._loading.style.display = 'block';
        }
        private hideLoading() {
            this._loading.style.display = 'none';
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
        get element(): HTMLElement {
            return this._node;
        }
        get currentPage(): Page {
            return this._currentPage;
        }
        get pages(): Array<Page> {
            return this._pages;
        }
        get previous(): PageContainer {
            return this._previous;
        }
        private createActionDeferred(routeData: RouteData): JQueryPromise<PageConstructor> {

            var url = routeData.actionPath;
            var result = $.Deferred<PageConstructor>();
            requirejs([url], (Type: PageConstructor) => {
                //加载脚本失败
                if (!Type) {
                    console.warn(chitu.Utility.format('加载活动“{0}”失败。', routeData.pageName));
                    result.reject();
                    return;
                }

                if (!$.isFunction(Type) || Type.prototype == null)
                    throw chitu.Errors.actionTypeError(routeData.pageName);

                result.resolve(Type);
            },

                (err) => result.reject(err)
            );

            return result;
        }

        private createViewDeferred(pageInfo: RouteData): JQueryPromise<string> {

            var url = pageInfo.viewPath;
            var self = this;
            var result = $.Deferred();
            var http = 'http://';
            if (url.substr(0, http.length).toLowerCase() == http) {
                //=======================================================
                // 说明：不使用 require text 是因为加载远的 html 文件，会作
                // 为 script 去解释而导致错误 
                $.ajax({ url: url })
                    .done((html) => {
                        if (html != null)
                            result.resolve(html);
                        else
                            result.reject();
                    })
                    .fail((err) => result.reject(err));
                //=======================================================
            }
            else {
                requirejs(['text!' + url],
                    function (html) {
                        if (html != null)
                            result.resolve(html);
                        else
                            result.reject();
                    },
                    function (err) {
                        result.reject(err)
                    });
            }

            return result;
        }
        private createPage(routeData: RouteData): JQueryPromise<Page> {
            var view_deferred = this.createViewDeferred(routeData);
            var action_deferred = this.createActionDeferred(routeData);
            var result = $.Deferred();

            var previousPage: Page;
            if (this._pages.length > 0)
                previousPage = this._pages[this._pages.length - 1];

            $.when<any>(action_deferred, view_deferred).done((pageType: PageConstructor, html: string) => {

                var page: Page = new pageType(html);
                if (!(page instanceof chitu.Page))
                    throw Errors.actionTypeError(routeData.pageName);

                page.initialize(this, routeData, previousPage);

                this.on_pageCreated(page);

                this._pages.push(page);
                this._pages[page.name] = page;

                result.resolve(page);

                page.on_load(routeData.values).done(() => {
                    this.hideLoading();
                });
            }).fail((err) => {
                result.reject();
                console.log(err);
                throw Errors.createPageFail(routeData.pageName);
            });

            if (routeData.resource != null && routeData.resource.length > 0) {
                Utility.loadjs.apply(Utility, routeData.resource);
            }

            return result;
        }

        showPage<T extends Page>(routeData: RouteData, swipe: SwipeDirection): JQueryPromise<T> {
            return this.createPage(routeData)
                .done((page: Page) => {
                    this.element.appendChild(page.element);
                    this._currentPage = page;

                    page.on_showing(page.routeData.values);
                    this.show(swipe).done(() => {
                        page.on_shown(page.routeData.values);
                    });
                });

        }
    }

    export class PageContainerFactory {
        private _app: Application;
        constructor(app: Application) {
            this._app = app;
        }
        static createInstance(app: Application, routeData: RouteData, previous: PageContainer): PageContainer {
            return new PageContainer(app, previous);
        }
    }

    export class Pan {

        cancel: boolean;
        start: (e: Hammer.PanEvent) => void;
        left: (e: Hammer.PanEvent) => void;
        right: (e: Hammer.PanEvent) => void;
        up: (e: Hammer.PanEvent) => void;
        down: (e: Hammer.PanEvent) => void;
        end: (e: Hammer.PanEvent) => void;

        constructor(gesture: Gesture) {
            this.cancel = false;
        }
    }

    export class Gesture {
        private executedCount: number;
        private hammersCount: number;
        private hammer: Hammer.Manager;
        private _pans: Array<Pan>;

        private _prevent = {
            pan: Hammer.DIRECTION_NONE
        }
        prevent = {
            pan: (direction: number) => {
                this._prevent.pan = direction;
            }
        }
        constructor(element: HTMLElement) {
            this.executedCount = 0;
            this.hammersCount = 0;
            // var myCustomBehavior: Hammer.Behavior = Hammer.extend({}, Hammer.defaults.behavior);
            // myCustomBehavior.touchAction = 'pan-y';
            this.hammer = new Hammer.Manager(element);
        }
        private on_pan(e: Hammer.PanEvent) {
            var pans = this.pans;
            for (var i = pans.length - 1; i >= 0; i--) {

                var state = this.hammer.get('pan').state;
                if (pans[i]['started'] == null && (state & Hammer.STATE_BEGAN) == Hammer.STATE_BEGAN) {
                    pans[i]['started'] = <any>pans[i].start(e);
                }

                var exected = false;
                var started = pans[i]['started'];
                if (started == true) {
                    if ((e.direction & Hammer.DIRECTION_LEFT) == Hammer.DIRECTION_LEFT && pans[i].left != null)
                        pans[i].left(e);
                    else if ((e.direction & Hammer.DIRECTION_RIGHT) == Hammer.DIRECTION_RIGHT && pans[i].right != null)
                        pans[i].right(e);
                    else if ((e.direction & Hammer.DIRECTION_UP) == Hammer.DIRECTION_UP && pans[i].up != null)
                        pans[i].up(e);
                    else if ((e.direction & Hammer.DIRECTION_DOWN) == Hammer.DIRECTION_DOWN && pans[i].down != null)
                        pans[i].down(e);

                    if ((state & Hammer.STATE_ENDED) == Hammer.STATE_ENDED && pans[i].end != null)
                        pans[i].end(e);

                    exected = true;

                }

                if ((state & Hammer.STATE_ENDED) == Hammer.STATE_ENDED) {
                    pans[i]['started'] = null;
                }

                //Pan 只执行一个，所以这里 break
                if (exected == true)
                    break;

            }
        }

        private get pans(): Array<Pan> {
            if (this._pans == null) {
                this._pans = new Array<Pan>();
                this.hammer.add(new Hammer.Pan({ direction: Hammer.DIRECTION_ALL }));
                this.hammer.on('pan', $.proxy(this.on_pan, this));
            }

            return this._pans;
        }
        createPan(): Pan {

            var pan = new Pan(this);
            this.pans.push(pan);

            return pan;
        }
    }

}