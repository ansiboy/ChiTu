module chitu {

    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;

    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';

    export class Application {
        pageCreating = ns.Callbacks();
        pageCreated = ns.Callbacks();
        pageShowing = ns.Callbacks();
        pageShown = ns.Callbacks();

        private _pages = {};
        private _stack: any[];
        private _routes: chitu.RouteCollection;
        private _container: any;
        private _runned: boolean = false;
        //private _currentPage: chitu.Page;
        private _pageStack: any[] = [];

        controllerFactory: chitu.ControllerFactory;
        viewFactory: any;

        constructor(container: HTMLElement) {
            if (container == null)
                throw e.argumentNull('container');

            if (!container.tagName)
                throw new Error('Parameter container is not a html element.');

            this.controllerFactory = new ns.ControllerFactory();
            this.viewFactory = new ns.ViewFactory();

            this._pages = {};
            this._stack = [];
            this._routes = new RouteCollection();
            this._container = container;

        };

        on_pageCreating(context) {
            return ns.fireCallback(this.pageCreating, [this, context]);
        }
        on_pageCreated(page) {
            //this.pageCreated.fire(this, page);
            return ns.fireCallback(this.pageCreated, [this, page]);
        }
        on_pageShowing(page, args) {
            //this.pageShowing.fire(this, page, args);
            return ns.fireCallback(this.pageShowing, [this, page, args]);
        }
        on_pageShown(page, args) {
            //this.pageShown.fire(this, page, args);
            return ns.fireCallback(this.pageShown, [this, page, args]);
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
            return (<any>this)._$currentPage;
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

        public run() {
            if (this._runned) return;

            var app = this;
            var hashchange = function (event) {
                var hash = window.location.hash;
                if (!hash) {
                    u.log('The url is not contains hash.');
                    return;
                }

                var args = window.location['arguments'] || {};
                var container = window.location['container'] || app._container;
                window.location['arguments'] = null;
                window.location['container'] = null;
                if (window.location['skip'] == null || window.location['skip'] == false)
                    app.showPageAt(container, hash.substr(1), args);

                window.location['skip'] = false;
            };
            $.proxy(hashchange, this)();
            $(window).bind('hashchange', $.proxy(hashchange, this));

            this._runned = true;
        }

        public showPageAt(element: HTMLElement, url: string, args: any) {
            /// <param name="element" type="HTMLElement" canBeNull="false"/>
            /// <param name="url" type="String" canBeNull="false"/>
            /// <param name="args" type="object" canBeNull="true"/>
            /// <returns type="jQuery.Deferred"/>

            args = args || {};

            if (!element) throw e.argumentNull('element');
            if (!url) throw e.argumentNull('url');

            return this.showPage(url, args);
        }
        showPage(url: string, args) {
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

            var container = this._container;

            var controllerName = routeData.values().controller;
            var actionName = routeData.values().action;

            var name = Page.getPageName(routeData);

            var pages = $(container).data('pages');
            if (!pages) {
                pages = {};
                $(container).data('pages', pages);
            }

            var self = this;

            var page = pages[name];
            if (page == null) {
                var element = $('<div>').appendTo(container)[0];
                page = this._createPage(url, element);
                pages[name] = page;
            }

            //this._currentPage = page;
            this._setCurrentPage(page);
            for (var key in pages) {
                if (pages[key] != page) {
                    pages[key].visible(false);
                }
            }

            $.extend(args, routeData.values());

            //this.on_pageShowing(page, args);

            var self = this;
            var result = $.Deferred();
            this.on_pageShowing(page, args).pipe(function () {
                return page.open(args);
            })
                .done($.proxy(
                    function () {
                        self._pageStack.push({ page: this.page, url: this.url });

                        //=======================================================
                        // 说明：由于只能显示一个页面，只有为 currentPage 才显示
                        if (this.page != self.currentPage())
                            this.page.visible(false);

                        //=======================================================

                        this.result.resolve(this.page);
                        self.on_pageShown(this.page, args);
                    },
                    { page: page, result: result, url: url })
                    )
                .fail($.proxy(
                    function (error) {
                        this.result.reject(this.page, error);
                    },
                    { page: page, result: result, url: url })
                    );

            return result;
        }
        _createPage(url, element) {
            if (!url) throw e.argumentNull('url');
            if (typeof url != 'string') throw e.paramTypeError('url', 'String');

            if (!element) {
                element = document.createElement('div');
                document.body.appendChild(element);
            }

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
            var page = new ns.Page(context, element);
            this._setCurrentPage(page);
            this.on_pageCreated(page);
            return page;
        }
        _setCurrentPage(value: chitu.Page) {
            (<any>this)._$currentPage = value;
        }
        public redirect(url: string, args = {}) {
            window.location['arguments'] = args;
            window.location.hash = url;
        }
        public back(args = undefined) {
            /// <returns type="jQuery.Deferred"/>
            var pc = $(this._container).data('PageContainer');
            if (pc == null)
                return $.Deferred().reject();

            return pc.back(args);
        }
    }
} 