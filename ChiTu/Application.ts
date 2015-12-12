namespace chitu {

    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;
    //var zindex = 500;
    var PAGE_STACK_MAX_SIZE = 10;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';

    interface ApplicationConfig {
        container: () => HTMLElement | HTMLElement,
        openSwipe?: (page: chitu.RouteData) => SwipeDirection,
        scrollType?: (page: chitu.RouteData) => ScrollType,
        closeSwipe?: (page: chitu.RouteData) => SwipeDirection,
    }

    export class Application {
        pageCreating: chitu.Callback = ns.Callbacks();
        pageCreated: chitu.Callback = ns.Callbacks();

        private page_stack: chitu.Page[] = [];
        private config: ApplicationConfig;
        private _routes: chitu.RouteCollection = new RouteCollection();
        private _runned: boolean = false;
        private zindex: number;

        constructor(config: ApplicationConfig) {
            if (config == null)
                throw e.argumentNull('container');

            if (!config.container) {
                throw new Error('The config has not a container property.');
            }

            if (!$.isFunction(config.container) && !config.container['tagName'])
                throw new Error('Parameter container is not a function or html element.');

            //this._container = config['container'];
            config.openSwipe = config.openSwipe || function (routeData: chitu.RouteData) { return SwipeDirection.None; };
            config.closeSwipe = config.closeSwipe || function (routeData: chitu.RouteData) { return SwipeDirection.None; };
            config.scrollType = config.scrollType || function (routeData: chitu.RouteData) { return ScrollType.Document };
            this.config = config;
        }

        on_pageCreating(context) {
            return chitu.fireCallback(this.pageCreating, [this, context]);
        }
        on_pageCreated(page) {
            //this.pageCreated.fire(this, page);
            return chitu.fireCallback(this.pageCreated, [this, page]);
        }
        public routes(): RouteCollection {
            return this._routes;
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
        hashchange(): any {

            if (window.location['skip'] == true) {
                window.location['skip'] = false;
                return;
            }

            var hash = window.location.hash;
            if (!hash) {
                chitu.Utility.log('The url is not contains hash.');
                return;
            }

            var current_page_url: string = '';
            if (this.previousPage() != null)
                current_page_url = this.previousPage().routeData.url();

            if (current_page_url.toLowerCase() == hash.substr(1).toLowerCase()) {
                this.closeCurrentPage();
            }
            else {
                var args = window.location['arguments'] || {};
                window.location['arguments'] = null;
                this.showPage(hash.substr(1), args);
            }

        }

        public run() {
            if (this._runned) return;

            var app = this;

            $.proxy(this.hashchange, this)();
            $(window).bind('hashchange', $.proxy(this.hashchange, this));

            this._runned = true;
        }
        public getCachePage(name: string): chitu.Page {
            for (var i = this.page_stack.length - 1; i >= 0; i--) {
                if (this.page_stack[i].name == name)
                    return this.page_stack[i];
            }
            return null;
        }
        public showPage(url: string, args): chitu.Page {
            /// <param name="container" type="HTMLElement" canBeNull="false"/>
            /// <param name="url" type="String" canBeNull="false"/>
            /// <param name="args" type="object" canBeNull="true"/>
            /// <returns type="jQuery.Deferred"/>

            args = args || {};

            if (!url) throw e.argumentNull('url');

            var routeData = this.routes().getRouteData(url);
            if (routeData == null) {
                throw e.noneRouteMatched(url);
            }

            var container: HTMLElement;
            if ($.isFunction(this.config.container)) {
                container = (<Function>this.config.container)(routeData.values());
                if (container == null)
                    throw new Error('The result of continer function cannt be null');
            }
            else {
                container = <any>this.config.container;
            }

            var previous = this.currentPage();

            var page_node = document.createElement('div');
            container.appendChild(page_node);
            var page = this.createPage(url, page_node);
            this.page_stack.push(page);
            console.log('page_stack lenght:' + this.page_stack.length);
            if (this.page_stack.length > PAGE_STACK_MAX_SIZE) {
                var p = this.page_stack.shift();
                p.close({});
            }

            var swipe = this.config.openSwipe(routeData);
            $.extend(args, routeData.values());


            page.open(args, swipe).done(() => {
                if (previous)
                    previous.hide();
            });

            return page;
        }
        protected createPageNode(): HTMLElement {
            var element = document.createElement('div');
            return element;
        }
        private closeCurrentPage() {
            var current = this.currentPage();
            var previous = this.previousPage();

            if (current != null) {
                var swipe = this.config.closeSwipe(current.routeData);
                current.close({}, swipe);

                if (previous != null)
                    previous.show();

                this.page_stack.pop();
                console.log('page_stack lenght:' + this.page_stack.length);
            }
        }
        private createPage(url: string, container: HTMLElement, parent?: chitu.Page) {
            if (!url)
                throw e.argumentNull('url');

            if (!container)
                throw e.argumentNull('element');

            var routeData = this.routes().getRouteData(url);
            if (routeData == null) {
                throw e.noneRouteMatched(url);
            }

            var controllerName = routeData.values().controller;
            var actionName = routeData.values().action;
            //var controller = this.controller(routeData);
            var view_deferred = createViewDeferred(routeData); //this.viewFactory.getView(routeData);
            var action_deferred = createActionDeferred(routeData); //chitu.createActionDeferred(routeData); //controller.getActionDeferred(routeData);
            var context = new ns.ControllerContext(view_deferred, routeData);

            this.on_pageCreating(context);
            var scrollType = this.config.scrollType(routeData);
            var page = new ns.Page(container, scrollType, parent);
            page.routeData = routeData;
            page.viewDeferred = view_deferred;
            page.actionDeferred = action_deferred;

            this.on_pageCreated(page);

            //$.when<string | chitu.Action>(view_deferred, action_deferred).done(function (html: string, action: chitu.Action) {
            //    //page.nodes().content.innerHTML = html
            //    page.view = html;
            //    action.execute(page);
            //})
            //action_deferred.done((action) => action.execute(page));
            //view_deferred.done((html) => page.view = html);

            return page;
        }
        public redirect(url: string, args = {}): chitu.Page {
            //window.location['arguments'] = args;
            window.location['skip'] = true;
            window.location.hash = url;
            return this.showPage(url, args);
        }
        public back(args = undefined) {
            /// <returns type="jQuery.Deferred"/>
            if (window.history.length == 0)
                return $.Deferred().reject();

            window.history.back();
            return $.Deferred().resolve();
        }
    }
} 