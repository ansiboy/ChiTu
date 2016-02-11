namespace chitu {

    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;
    //var zindex = 500;
    var PAGE_STACK_MAX_SIZE = 10;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';

    export interface ApplicationConfig {
        container?: (routeData: chitu.RouteData, previous?: Page | PageContainer) => PageContainer,
        openSwipe?: (routeData: chitu.RouteData) => SwipeDirection,
        closeSwipe?: (route: chitu.RouteData) => SwipeDirection,
    }

    export class Application {
        pageCreating: chitu.Callback = ns.Callbacks();
        pageCreated: chitu.Callback = ns.Callbacks();

        private page_stack: chitu.Page[] = [];
        private _config: ApplicationConfig;
        private _routes: chitu.RouteCollection = new RouteCollection();
        private _runned: boolean = false;
        private zindex: number;
        private back_deferred: JQueryDeferred<any>;
        private start_flag_hash: string;
        private start_hash: string;

        constructor(config: ApplicationConfig) {
            if (config == null)
                throw e.argumentNull('container');


            //this._container = config['container'];
            this._config = config;
            this._config.openSwipe = config.openSwipe || function(routeData: chitu.RouteData) { return SwipeDirection.None; };
            this._config.closeSwipe = config.closeSwipe || function(routeData: chitu.RouteData) { return SwipeDirection.None; };
            this._config.container = config.container || function(routeData: chitu.RouteData, previous: Page | PageContainer): PageContainer {
                return PageContainerFactory.createPageContainer(routeData, previous);
            };




        }

        private page_closed = (sender: chitu.Page) => {
            // 将页面从栈中移除  
            var item_index = -1;
            for (var i = 0; i < this.page_stack.length; i++) {
                if (sender == this.page_stack[i]) {
                    item_index = i;
                    break;
                }
            }

            if (item_index < 0)
                return;

            this.page_stack.splice(item_index, 1);
        }

        private page_shown = (sender: chitu.Page) => {
            this.setCurrentPage(sender);
        }

        get config(): chitu.ApplicationConfig {
            return this._config;
        }

        get pages(): Array<chitu.Page> {
            return this.page_stack;
        }

        on_pageCreating(context: chitu.PageContext) {
            return chitu.fireCallback(this.pageCreating, [this, context]);
        }
        on_pageCreated(page: chitu.Page, context: chitu.PageContext) {
            //this.pageCreated.fire(this, page);
            return chitu.fireCallback(this.pageCreated, [this, page]);
        }
        public routes(): RouteCollection {
            return this._routes;
        }
        private setCurrentPage(value: chitu.Page) {
            if (value == this.page_stack[this.page_stack.length - 1])
                return;

            var item_index = -1;
            for (var i = 0; i < this.page_stack.length; i++) {
                if (value == this.page_stack[i]) {
                    item_index = i;
                    break;
                }
            }

            if (item_index >= 0) {
                this.page_stack.splice(item_index, 1);
            }

            this.page_stack.push(value);
        }
        public currentPage(): chitu.Page {
            if (this.page_stack.length > 0)
                return this.page_stack[this.page_stack.length - 1];

            return null;
        }
        private previousPage(): chitu.Page {
            if (this.page_stack.length > 1)
                return this.page_stack[this.page_stack.length - 2];

            return null;
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

            var previous_url: string = '';
            if (this.previousPage() != null)
                previous_url = this.previousPage().routeData.url();

            if (previous_url.toLowerCase() == hash.substr(1).toLowerCase()) {
                this.closeCurrentPage();
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
            for (var i = this.page_stack.length - 1; i >= 0; i--) {
                if (this.page_stack[i].name == name)
                    return this.page_stack[i];
            }
            return null;
        }
        public showPage(url: string, args): chitu.Page {

            args = args || {};

            if (!url) throw e.argumentNull('url');

            var routeData = this.routes().getRouteData(url);
            if (routeData == null) {
                throw e.noneRouteMatched(url);
            }

            //var container: HTMLElement;
            // if ($.isFunction(this.config.container)) {
            //     container = (<Function>this.config.container)(routeData.values());
            //     if (container == null)
            //         throw new Error('The result of continer function cannt be null');
            // }
            // else {
            //     container = <any>this.config.container;
            // }

            var previous = this.currentPage();

            // var page_node = document.createElement('div');
            // container.appendChild(page_node);
            var page = this.createPage(url, previous);
            this.page_stack.push(page);
            console.log('page_stack lenght:' + this.page_stack.length);
            if (this.page_stack.length > PAGE_STACK_MAX_SIZE) {
                var p = this.page_stack.shift();
                p.close({});
            }

            var swipe = this.config.openSwipe(routeData);
            $.extend(args, routeData.values());

            page.show(swipe);
            //
            // .done(() => {
            //     if (previous)
            //         previous.hide(SwipeDirection.None);
            // });

            return page;
        }
        protected createPageNode(): HTMLElement {
            var element = document.createElement('div');
            return element;
        }
        public closeCurrentPage() {
            var current = this.currentPage();
            var previous = this.previousPage();

            if (current == null) {
                return;
            }

            var swipe = this.config.closeSwipe(current.routeData);
            if (swipe == chitu.SwipeDirection.None) {
                current.close({}, swipe);
                if (previous != null)
                    previous.show(SwipeDirection.None);
            }
            else {
                if (previous != null)
                    previous.show(SwipeDirection.None);

                current.close({}, swipe);
            }

            console.log('page_stack lenght:' + this.page_stack.length);
        }
        private createPage(url: string, previousPage?: chitu.Page) {
            if (!url)
                throw e.argumentNull('url');

            // if (!container)
            //     throw e.argumentNull('element');

            var routeData = this.routes().getRouteData(url);
            if (routeData == null) {
                throw e.noneRouteMatched(url);
            }

            var controllerName = routeData.values().controller;
            var actionName = routeData.values().action;
            var view_deferred = createViewDeferred(routeData);
            var action_deferred = createActionDeferred(routeData);
            var context = new ns.PageContext(view_deferred, routeData);

            this.on_pageCreating(context);
            //var scrollType = this.config.scrollType(routeData);
            var container = this.config.container(routeData);
            var page = new ns.Page(container, routeData, action_deferred, view_deferred, previousPage);
            page.routeData = routeData;
            // page.view = view_deferred;
            // page.action = action_deferred;

            this.on_pageCreated(page, context);
            page.closed.add(this.page_closed);
            page.shown.add(this.page_shown);
            return page;
        }
        public redirect(url: string, args = {}): chitu.Page {
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
