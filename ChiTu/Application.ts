module chitu {

    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;

    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';

    export class Application {
        pageCreating: chitu.Callback = ns.Callbacks();
        pageCreated: chitu.Callback = ns.Callbacks();

        private page_stack: chitu.Page[] = [];

        private _routes: chitu.RouteCollection = new RouteCollection();
        private _container: HTMLElement|Function;
        private _runned: boolean = false;
        private _currentPage: chitu.Page;


        private zindex: number;

        controllerFactory: chitu.ControllerFactory = new chitu.ControllerFactory();
        viewFactory: chitu.ViewFactory = new chitu.ViewFactory();

        constructor(config: Object) {
            if (config == null)
                throw e.argumentNull('container');

            if (!config['container']) {
                throw new Error('The config has not a container property.');
            }

            if (!$.isFunction(config['container']) && !config['container'].tagName)
                throw new Error('Parameter container is not a function or html element.');

            this._container = config['container'];
        }

        on_pageCreating(context) {
            return ns.fireCallback(this.pageCreating, [this, context]);
        }
        on_pageCreated(page) {
            //this.pageCreated.fire(this, page);
            return ns.fireCallback(this.pageCreated, [this, page]);
        }
        public routes(): chitu.RouteCollection {
            return this._routes;
        }

        public controller(routeData: RouteData) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="chitu.Controller"/>
            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');

            if (!routeData)
                throw e.argumentNull('routeData');

            return this.controllerFactory.getController(routeData);
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
        public action(routeData) {
            /// <param name="routeData" type="Object"/>
            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');

            if (!routeData)
                throw e.argumentNull('routeData');

            var controllerName = routeData.controller;
            if (!controllerName) throw e.argumentNull('name');
            if (typeof controllerName != 'string') throw e.routeDataRequireController();

            var actionName = routeData.action;
            if (!actionName) throw e.argumentNull('name');
            if (typeof actionName != 'string') throw e.routeDataRequireAction();

            var controller = this.controller(routeData);
            return controller.action(actionName);
        }

        hashchange(): any {
            var hash = window.location.hash;
            if (!hash) {
                u.log('The url is not contains hash.');
                return;
            }

            if (this.previousPage() != null && this.previousPage().context().routeData().url() == hash.substr(1)) {
                this.closeCurrentPage();
            }
            else {
                var args = window.location['arguments'] || {};
                window.location['arguments'] = null;

                this.showPage(hash.substr(1), args);

                window.location['skip'] = false;
            }

        }

        public run() {
            if (this._runned) return;

            var app = this;

            $.proxy(this.hashchange, this)();
            $(window).bind('hashchange', $.proxy(this.hashchange, this));

            this._runned = true;
        }

        public showPage(url: string, args): JQueryDeferred<any> {
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

            //================================================================
            // 判断是为返回操作
            var name = Page.getPageName(routeData);
            if (this.previousPage() != null && (this.previousPage().name() == name)) {
            }


            var container: HTMLElement;
            if ($.isFunction(this._container)) {
                container = (<Function>this._container)(routeData.values());
                if (container == null)
                    throw new Error('The result of continer function cannt be null');
            }
            else {
                container = <HTMLElement>this._container;
            }

            var page = this._createPage(url, container);
            this.page_stack.push(page);


            $.extend(args, routeData.values());
            var result = $.Deferred();
            page.open(args)
                .done(() => {
                    result.resolve();
                    var f = () => {
                        if (this.previousPage())
                            this.previousPage().hide();

                        page.shown.remove(f);
                    }
                    page.shown.add(f);
                })
                .fail((error) => {
                    result.reject(this, error);
                });

            return result;
        }
        protected createPageNode(): HTMLElement {
            var element = document.createElement('div');
            return element;
        }
        private closeCurrentPage() {
            if (this.currentPage() != null) {
                this.currentPage().close();
                if (this.previousPage() != null)
                    this.previousPage().show();

                this.page_stack.pop();
            }
        }
        private _createPage(url: string, container: HTMLElement) {
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
            var controller = this.controller(routeData);
            var view_deferred = this.viewFactory.view(routeData); //this.application().viewEngineFactory.getViewEngine(controllerName).view(actionName, routeData.viewPath);
            var context = new ns.ControllerContext(controller, view_deferred, routeData);

            this.on_pageCreating(context);
            var page = new ns.Page(context, container);
            this.on_pageCreated(page);
            return page;
        }
        public redirect(url: string, args = {}) {
            window.location['arguments'] = args;
            window.location.hash = url;
        }
        public back(args = undefined) {
            /// <returns type="jQuery.Deferred"/>
            if (window.history.length == 0)
                return $.Deferred().reject();

            window.location['skip'] = true;
            window.history.back();


            this._currentPage.close();


            return $.Deferred().resolve();
        }
    }
} 