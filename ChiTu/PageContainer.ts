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

        //private _topBar: HTMLElement;
        //private _bottomBar: HTMLElement;
        private _node: HTMLElement;
        private _loading: HTMLElement;
        private _pages: Array<Page>;
        private _currentPage: Page;
        private _previous: PageContainer;


        gesture: Gesture;
        pageCreated: chitu.Callback = Callbacks();

        constructor(previous?: PageContainer) {

            this._node = this.createNode();
            this._loading = this.createLoading(this._node);
            this._pages = new Array<Page>();
            this._previous = previous;

            this.gesture = new Gesture();
        }

        on_pageCreated(page: chitu.Page) {
            return chitu.fireCallback(this.pageCreated, [this, page]);
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
        private createPage(routeData: RouteData): Page {
            var controllerName = routeData.values().controller;
            var actionName = routeData.values().action;
            var view_deferred = createViewDeferred(routeData);
            var action_deferred = createActionDeferred(routeData);
            var context = new PageContext(view_deferred, routeData);

            var previousPage: Page;
            if (this._pages.length > 0)
                previousPage = this._pages[this._pages.length - 1];

            var page = new Page(this, routeData, action_deferred, view_deferred, previousPage);
            this.on_pageCreated(page);
            //page.shown.add(this.page_shown);
            
            this._pages.push(page);
            this._pages[page.name] = page;
            return page;
        }

        showPage(routeData: RouteData, swipe: SwipeDirection): Page {
            var page = this.createPage(routeData);
            this.element.appendChild(page.node);
            this._currentPage = page;

            page.on_showing(routeData.values());
            this.show(swipe).done(() => {
                page.on_shown(routeData.values());
            });
            page.loadCompleted.add(() => this.hideLoading());

            return page;
        }
    }

    export class PageContainerFactory {
        static createInstance(routeData: RouteData, previous: PageContainer): PageContainer {
            return new PageContainer(previous);
        }
    }

    export class Pan {

        cancel: boolean;
        start: (e: PanEvent) => void;
        left: (e: PanEvent) => void;
        right: (e: PanEvent) => void;
        up: (e: PanEvent) => void;
        down: (e: PanEvent) => void;
        end: (e: PanEvent) => void;

        constructor(gesture: Gesture) {
            this.cancel = false;
        }
    }

    export class Gesture {
        private executedCount: number;
        private hammersCount: number;
        private _prevent = {
            pan: Hammer.DIRECTION_NONE
        }
        prevent = {
            pan: (direction: number) => {
                this._prevent.pan = direction;
            }
        }
        constructor() {
            this.executedCount = 0;
            this.hammersCount = 0;
        }
        private getHammer(element): Hammer.Manager {
            var hammer: Hammer.Manager = <any>$(element).data('hammer');
            if (hammer == null) {
                hammer = new Hammer.Manager(element);
                hammer.add(new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL | Hammer.DIRECTION_VERTICAL }));
                $(element).data('hammer', hammer);
                this.hammersCount = this.hammersCount + 1;

                hammer.on('pan', (e: PanEvent) => {
                    var pans = this.getPans(hammer.element);
                    for (var i = pans.length - 1; i >= 0; i--) {
                        //var is_continue: any;

                        var state = hammer.get('pan').state;
                        if (pans[i]['started'] == null && (state & Hammer.STATE_BEGAN) == Hammer.STATE_BEGAN) {
                            pans[i]['started'] = <any>pans[i].start(e);
                            // if (started == false)
                            //     continue;
                        }

                        if (pans[i]['started'] == true) {
                            if ((e.direction & Hammer.DIRECTION_LEFT) == Hammer.DIRECTION_LEFT && pans[i].left != null)
                                pans[i].left(e);
                            else if ((e.direction & Hammer.DIRECTION_RIGHT) == Hammer.DIRECTION_RIGHT && pans[i].right != null)
                                pans[i].right(e);
                            else if ((e.direction & Hammer.DIRECTION_UP) == Hammer.DIRECTION_UP && pans[i].up != null)
                                pans[i].up(e);
                            else if ((e.direction & Hammer.DIRECTION_DOWN) == Hammer.DIRECTION_DOWN && pans[i].down != null)
                                pans[i].down(e);


                        }
                        
                        var extected = pans[i]['started'] == true;
                        if ((state & Hammer.STATE_ENDED) == Hammer.STATE_ENDED) {
                            pans[i]['started'] = null;
                            if (pans[i].end != null)
                                pans[i].end(e);
                        }

                        //Pan 只执行一个，所以这里 break
                        if (extected == true)
                            break;
                    }
                });
            }
            return hammer;
        }
        private getPans(element: HTMLElement): Array<Pan> {
            var pans: Array<Pan> = <any>$(element).data('pans');
            if (pans == null) {
                pans = new Array<Pan>();
                $(element).data('pans', pans);
            }
            return pans;
        }
        private clear() {
            this._prevent.pan = Hammer.DIRECTION_NONE;
        }
        createPan(element: HTMLElement): Pan {
            if (element == null) throw Errors.argumentNull('element');
            var hammer = this.getHammer(element);

            var pan = new Pan(this);
            var pans = this.getPans(element);
            pans.push(pan);

            return pan;
        }
    }

}