// TODO:
// 1，关闭当页面容器并显示之前容器时，更新URL
// 2, 侧滑时，底容器带有遮罩效果。
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
        private _currentPage: Page;
        private _previous: PageContainer;
        private _app: Application;
        private _previousOffsetRate = 0.5; // 前一个页面，相对当前页面移动的比率
        private _routeData: RouteData;

        showing = Callbacks<PageContainer, any>();
        shown = Callbacks<PageContainer, any>();

        closing = Callbacks<PageContainer, any>();
        closed = Callbacks<PageContainer, any>();

        //gesture: Gesture;
        pageCreated: chitu.Callback<PageContainer, Page> = Callbacks<PageContainer, Page>();

        constructor(params: {
            app: Application,
            routeData: RouteData,
            previous?: PageContainer,
        }) {

            params = $.extend({ enableGesture: true, enableSwipeClose: true }, params)

            this._node = this.createNode();
            this._loading = this.createLoading(this._node);
            this._previous = params.previous;
            this._app = params.app;
            this._routeData = params.routeData;

            this.createPage(params.routeData);
        }

        on_pageCreated(page: chitu.Page) {
            return chitu.fireCallback(this.pageCreated, this, page);
        }

        on_showing(args) {
            return fireCallback(this.showing, this, args);
        }
        on_shown(args) {
            return fireCallback(this.shown, this, args);
        }
        on_closing(args) {
            return fireCallback(this.closing, this, args);
        }
        on_closed(args) {
            return fireCallback(this.closed, this, args);
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

        show(): void {
            if (this.visible == true)
                return;

            $(this._node).show();
        }

        hide() {
            if (this.visible == false)
                return;

            $(this._node).hide();
        }

        private is_closing = false;
        close() {

            this.on_closing(this.routeData.values);

            this.is_closing = true;
            $(this._node).remove();
            this.on_closed(this.routeData.values);
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
        get page(): Page {
            return this._currentPage;
        }
        get previous(): PageContainer {
            return this._previous;
        }
        get routeData(): RouteData {
            return this._routeData;
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

        private createViewDeferred(url: string): JQueryPromise<string> {

            //var url = pageInfo.viewPath;
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
            let view_deferred: JQueryPromise<string>;
            if (routeData.viewPath)
                view_deferred = this.createViewDeferred(routeData.viewPath);
            else
                view_deferred = $.Deferred().resolve("");

            var action_deferred = this.createActionDeferred(routeData);
            var result = $.Deferred();

            $.when<any>(action_deferred, view_deferred).done((pageType: PageConstructor, html: string) => {
                let pageElement = document.createElement('page');
                pageElement.innerHTML = html;
                pageElement.setAttribute('name', routeData.pageName);

                var page: Page = new pageType({ container: this, element: pageElement, routeData });
                if (!(page instanceof chitu.Page))
                    throw Errors.actionTypeError(routeData.pageName);

                this._currentPage = page;
                this.element.appendChild(page.element);

                this.on_pageCreated(page);
                result.resolve(page);
                page.on_load(routeData.values).done(() => {
                    this.hideLoading();
                });
            }).fail((err) => {
                result.reject();
                console.error(err);
                throw Errors.createPageFail(routeData.pageName);
            });

            if (routeData.resource != null && routeData.resource.length > 0) {
                Utility.loadjs.apply(Utility, routeData.resource);
            }

            return result;
        }
    }

    export class PageContainerFactory {
        private _app: Application;
        constructor(app: Application) {
            this._app = app;
        }
        static createInstance(params: {
            app: Application,
            routeData: RouteData,
            previous?: PageContainer,
            enableGesture?: boolean,
            enableSwipeClose?: boolean,
        }): PageContainer {
            let c = new PageContainer(params);
            return c;
        }
    }

    // export class Pan {

    //     cancel: boolean;
    //     start: (e: Hammer.PanEvent) => void;
    //     left: (e: Hammer.PanEvent) => void;
    //     right: (e: Hammer.PanEvent) => void;
    //     up: (e: Hammer.PanEvent) => void;
    //     down: (e: Hammer.PanEvent) => void;
    //     end: (e: Hammer.PanEvent) => void;

    //     constructor(gesture: Gesture) {
    //         this.cancel = false;
    //     }
    // }

    // export class Gesture {
    //     private executedCount: number;
    //     private hammersCount: number;
    //     private hammer: Hammer.Manager;
    //     private _pans: Array<Pan>;

    //     private _prevent = {
    //         pan: Hammer.DIRECTION_NONE
    //     }
    //     prevent = {
    //         pan: (direction: number) => {
    //             this._prevent.pan = direction;
    //         }
    //     }
    //     constructor(element: HTMLElement) {
    //         this.executedCount = 0;
    //         this.hammersCount = 0;
    //         // var myCustomBehavior: Hammer.Behavior = Hammer.extend({}, Hammer.defaults.behavior);
    //         // myCustomBehavior.touchAction = 'pan-y';
    //         this.hammer = new Hammer.Manager(element);
    //     }
    //     private on_pan(e: Hammer.PanEvent) {
    //         var pans = this.pans;
    //         for (var i = pans.length - 1; i >= 0; i--) {

    //             var state = this.hammer.get('pan').state;
    //             if (pans[i]['started'] == null && (state & Hammer.STATE_BEGAN) == Hammer.STATE_BEGAN) {
    //                 pans[i]['started'] = <any>pans[i].start(e);
    //             }

    //             var exected = false;
    //             var started = pans[i]['started'];
    //             if (started == true) {
    //                 if ((e.direction & Hammer.DIRECTION_LEFT) == Hammer.DIRECTION_LEFT && pans[i].left != null)
    //                     pans[i].left(e);
    //                 else if ((e.direction & Hammer.DIRECTION_RIGHT) == Hammer.DIRECTION_RIGHT && pans[i].right != null)
    //                     pans[i].right(e);
    //                 else if ((e.direction & Hammer.DIRECTION_UP) == Hammer.DIRECTION_UP && pans[i].up != null)
    //                     pans[i].up(e);
    //                 else if ((e.direction & Hammer.DIRECTION_DOWN) == Hammer.DIRECTION_DOWN && pans[i].down != null)
    //                     pans[i].down(e);

    //                 if ((state & Hammer.STATE_ENDED) == Hammer.STATE_ENDED && pans[i].end != null)
    //                     pans[i].end(e);

    //                 exected = true;

    //             }

    //             if ((state & Hammer.STATE_ENDED) == Hammer.STATE_ENDED) {
    //                 pans[i]['started'] = null;
    //             }

    //             //Pan 只执行一个，所以这里 break
    //             if (exected == true)
    //                 break;

    //         }
    //     }

    //     private get pans(): Array<Pan> {
    //         if (this._pans == null) {
    //             this._pans = new Array<Pan>();
    //             this.hammer.add(new Hammer.Pan({ direction: Hammer.DIRECTION_ALL }));
    //             this.hammer.on('pan', $.proxy(this.on_pan, this));
    //         }

    //         return this._pans;
    //     }
    //     createPan(): Pan {

    //         var pan = new Pan(this);
    //         this.pans.push(pan);

    //         return pan;
    //     }
    // }
}