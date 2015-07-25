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
        private _runned: boolean = false

        controllerFactory: chitu.ControllerFactory;
        viewFactory: any;

        constructor(func) {
            /// <field name="func" type="Function"/>

            if (!func) throw e.argumentNull('func');
            if (!$.isFunction(func)) throw e.paramTypeError('func', 'Function');

            var options = {
                container: document.body,
                routes: new ns.RouteCollection(),
                actionPath: ACTION_LOCATION_FORMATER,
                viewPath: VIEW_LOCATION_FORMATER
            };

            $.proxy(func, this)(options);

            this.controllerFactory = new ns.ControllerFactory(options.actionPath);
            this.viewFactory = new ns.ViewFactory(options.viewPath);

            this._pages = {};
            this._stack = [];
            this._routes = options.routes;
            this._container = options.container;

        };

        public on_pageCreating(context) {
            this.pageCreating.fire(this, context);
        }
        public on_pageCreated(page) {
            this.pageCreated.fire(this, page);
        }
        public on_pageShowing(page, args) {
            this.pageShowing.fire(this, page, args);
        }
        public on_pageShown(page, args) {
            this.pageShown.fire(page, args);
        }
        public routes(): chitu.RouteCollection {
            return this._routes;
        }

        public controller(routeData) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="chitu.Controller"/>
            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');

            if (!routeData)
                throw e.argumentNull('routeData');
            
            //if (typeof name != 'string') throw e.paramTypeError('name', 'String');

            return this.controllerFactory.getController(routeData);
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

            var self = this;

            var pc = <chitu.PageContainer> $(element).data('PageContainer');
            if (pc == null) {
                pc = new ns.PageContainer(this, element);

                pc.pageCreating.add(function (sender, context) {
                    self.on_pageCreating(context);
                });

                pc.pageCreated.add(function (sender, page) {
                    self.on_pageCreated(page);
                });

                pc.pageShowing.add(function (sender, page, args) {
                    self.on_pageShowing(page, args);
                });

                pc.pageShown.add(function (sender, page, args) {
                    self.on_pageShown(page, args);
                });

                $(element).data('PageContainer', pc);
            }

            var self = this;
            return pc.showPage(url, args);
        }
        public showPage(url, args) {
            /// <param name="url" type="String" canBeNull="true"/>
            /// <param name="args" type="object" canBeNull="true"/>
            /// <returns type="jQuery.Deferred"/>

            return this.showPageAt(this._container, url, args);
        }
        public redirect(url, args) {
            window.location['arguments'] = args;
            window.location.hash = url;
        }
        public back(args) {
            /// <returns type="jQuery.Deferred"/>
            var pc = $(this._container).data('PageContainer');
            if (pc == null)
                return $.Deferred().reject();

            return pc.back(args);
        }
    }
} 