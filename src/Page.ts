// TODO:
// 1，关闭当页面容器并显示之前容器时，更新URL
// 2, 侧滑时，底容器带有遮罩效果。
namespace chitu {

    // class ScrollArguments {
    //     scrollTop: number
    //     scrollHeight: number
    //     clientHeight: number
    // }

    // class PageContainerTypeClassNames {
    //     Div = 'div'
    //     IScroll = 'iscroll'
    //     Document = 'doc'
    // }

    export class Page {
        private animationTime: number = 300;
        private num: Number;

        private _node: HTMLElement;
        //private _loading: HTMLElement;
        private _currentPage: Pageview;
        private _previous: Page;
        private _app: Application;
        private _routeData: RouteData;

        showing = Callbacks<Page, any>();
        shown = Callbacks<Page, any>();
        
        hiding = Callbacks<Page, any>();
        hidden = Callbacks<Page, any>();

        closing = Callbacks<Page, any>();
        closed = Callbacks<Page, any>();

        pageCreated: chitu.Callback<Page, Pageview> = Callbacks<Page, Pageview>();

        constructor(params: {
            app: Application,
            routeData: RouteData,
            previous?: Page,
        }) {

            this._node = this.createNode();
            //this._loading = this.createLoading(this._node);
            this._previous = params.previous;
            this._app = params.app;
            this._routeData = params.routeData;

            this.createPage(params.routeData);
        }

        on_pageCreated(page: chitu.Pageview) {
            return chitu.fireCallback(this.pageCreated, this, page);
        }

        on_showing(args) {
            return fireCallback(this.showing, this, args);
        }
        on_shown(args) {
            return fireCallback(this.shown, this, args);
        }
        on_hiding(args) {
            return fireCallback(this.hiding, this, args);
        }
        on_hidden(args) {
            return fireCallback(this.hidden, this, args);
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

        // protected createLoading(parent: HTMLElement): HTMLElement {
        //     var loading_element = document.createElement('div');
        //     loading_element.className = 'page-loading';
        //     loading_element.innerHTML = '<div class="spin"><i class="icon-spinner icon-spin"></i><div>';
        //     parent.appendChild(loading_element);

        //     return loading_element;
        // }

        show(): void {
            if (this.visible == true)
                return;

            this.on_showing(this.routeData.values);
            $(this._node).show();
            this.on_shown(this.routeData.values);
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
        // private showLoading() {
        //     this._loading.style.display = 'block';
        // }
        // private hideLoading() {
        //     this._loading.style.display = 'none';
        // }
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
        get page(): Pageview {
            return this._currentPage;
        }
        get previous(): Page {
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

        private createPage(routeData: RouteData): JQueryPromise<Pageview> {
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

                var page: Pageview = new pageType({ container: this, element: pageElement, routeData });
                if (!(page instanceof Pageview))
                    throw Errors.actionTypeError(routeData.pageName);

                this._currentPage = page;
                this.element.appendChild(page.element);

                this.on_pageCreated(page);
                result.resolve(page);
                page.on_load(routeData.values).done(() => {
                    //this.hideLoading();
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

    export class PageFactory {
        private _app: Application;
        constructor(app: Application) {
            this._app = app;
        }
        static createInstance(params: {
            app: Application,
            routeData: RouteData,
            previous?: Page,
        }): Page {
            let c = new Page(params);
            return c;
        }
    }
}