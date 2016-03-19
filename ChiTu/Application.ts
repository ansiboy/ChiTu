namespace chitu {

    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;
    //var zindex = 500;
    var PAGE_STACK_MAX_SIZE = 10;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';

    export interface ApplicationConfig {
        container?: (routeData: chitu.RouteData, prevous: PageContainer) => PageContainer,
        openSwipe?: (routeData: chitu.RouteData) => SwipeDirection,
        closeSwipe?: (route: chitu.RouteData) => SwipeDirection,
    }

    export class Application {
        pageCreating: chitu.Callback = ns.Callbacks();
        pageCreated: chitu.Callback = ns.Callbacks();

        //private page_stack: chitu.Page[] = [];
        private _config: ApplicationConfig;
        private _routes: chitu.RouteCollection = new RouteCollection();
        private _runned: boolean = false;
        private zindex: number;
        private back_deferred: JQueryDeferred<any>;
        private start_flag_hash: string;
        private start_hash: string;
        private container_stack = new Array<PageContainer>();

        constructor(config: ApplicationConfig) {
            if (config == null)
                throw e.argumentNull('container');

            this._config = config;
            this._config.openSwipe = config.openSwipe || function(routeData: chitu.RouteData) { return SwipeDirection.None; };
            this._config.closeSwipe = config.closeSwipe || function(routeData: chitu.RouteData) { return SwipeDirection.None; };
            this._config.container = config.container || $.proxy(function(routeData: chitu.RouteData, previous: PageContainer) {
                return PageContainerFactory.createInstance(this.app, routeData, previous);
            }, { app: this });
        }

        on_pageCreating(context: chitu.PageContext) {
            return chitu.fireCallback(this.pageCreating, [this, context]);
        }
        on_pageCreated(page: chitu.Page) {
            return chitu.fireCallback(this.pageCreated, [this, page]);
        }
        get config(): chitu.ApplicationConfig {
            return this._config;
        }
        routes(): RouteCollection {
            return this._routes;
        }

        currentPage(): chitu.Page {
            if (this.container_stack.length > 0)
                return this.container_stack[this.container_stack.length - 1].currentPage;

            return null;
        }
        get pageContainers(): Array<PageContainer> {
            return this.container_stack;
        }
        private createPageContainer(routeData: RouteData): PageContainer {
            var container = this.config.container(routeData, this.pageContainers[this.pageContainers.length - 1]);

            this.container_stack.push(container);
            if (this.container_stack.length > PAGE_STACK_MAX_SIZE) {
                var c = this.container_stack.shift();
                c.close(SwipeDirection.None);
            }

            return container;
        }
        protected hashchange() {
            if (window.location['skip'] == true) {
                window.location['skip'] = false;
                return;
            }

            var back_deferred: JQueryDeferred<any>
            if (this.back_deferred && this.back_deferred['processed'] == null) {
                back_deferred = this.back_deferred;
                back_deferred['processed'] = true;
            }

            var hash = window.location.hash;
            if (!hash || hash == this.start_flag_hash) {
                if (!hash)
                    console.log('The url is not contains hash.url is ' + window.location.href);

                if (hash == this.start_flag_hash) {
                    window.history.pushState({}, '', this.start_hash);
                    console.log('The hash is start url, the hash is ' + hash);
                }

                if (back_deferred)
                    back_deferred.reject();

                return;
            }

            if (!this.start_flag_hash) {
                //TODO:生成随机字符串
                this.start_flag_hash = '#AABBCCDDEEFF';
                this.start_hash = hash;
                window.history.replaceState({}, '', this.start_flag_hash);
                window.history.pushState({}, '', hash);
            }

            var url = hash.substr(1);
            var routeData = this.routes().getRouteData(url);
            var pageName = Page.getPageName(routeData);
            var page = this.getPage(pageName);
            var container: PageContainer = page != null ? page.container : null;
            if (container != null && $.inArray(container, this.container_stack) == this.container_stack.length - 2) {
                var c = this.container_stack.pop();
                var swipe = this.config.closeSwipe(c.currentPage.routeData);
                if (c.previous != null) {
                    c.previous.visible = true;
                }
                c.close(swipe);
            }
            else {
                var args = window.location['arguments'] || {};
                window.location['arguments'] = null;
                this.showPage(hash.substr(1), args);
            }

            if (back_deferred)
                back_deferred.resolve();
        }

        public run() {
            if (this._runned) return;

            var app = this;

            $.proxy(this.hashchange, this)();
            $(window).bind('hashchange', $.proxy(this.hashchange, this));

            this._runned = true;
        }
        public getPage(name: string): chitu.Page {
            for (var i = this.container_stack.length - 1; i >= 0; i--) {
                var page = this.container_stack[i].pages[name];
                if (page != null)
                    return page;
            }
            return null;
        }
        public showPage(url: string, args: Array<any>): chitu.Page {
            if (!url) throw e.argumentNull('url');

            //args = args || {};

            var routeData = this.routes().getRouteData(url);
            if (routeData == null) {
                throw e.noneRouteMatched(url);
            }

            //var routeValues = $.extend(args, routeData.values() || {});
            //routeData.values(routeValues);
            var container = this.createPageContainer(routeData);
            container.pageCreated.add((sender, page: Page) => this.on_pageCreated(page));
            var swipe = this.config.openSwipe(routeData);
            var page = container.showPage(routeData, args, swipe);

            return page;
        }
        protected createPageNode(): HTMLElement {
            var element = document.createElement('div');
            return element;
        }
        public redirect(url: string, args: Array<any>): chitu.Page {
            window.location['skip'] = true;
            window.location.hash = url;
            return this.showPage(url, args);
        }
        public back(args = undefined): JQueryPromise<any> {
            this.back_deferred = $.Deferred();
            if (window.history.length == 0) {
                this.back_deferred.reject();
                return this.back_deferred;
            }

            window.history.back();
            return this.back_deferred;
        }
    }
} 
