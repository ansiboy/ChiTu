var chitu;
(function (chitu) {
    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';
    var Application = (function () {
        function Application(container) {
            this.pageCreating = ns.Callbacks();
            this.pageCreated = ns.Callbacks();
            this.pageShowing = ns.Callbacks();
            this.pageShown = ns.Callbacks();
            this._pages = {};
            this._runned = false;
            //private _currentPage: chitu.Page;
            this._pageStack = [];
            if (container == null)
                throw e.argumentNull('container');
            if (!container.tagName)
                throw new Error('Parameter container is not a html element.');
            this.controllerFactory = new ns.ControllerFactory();
            this.viewFactory = new ns.ViewFactory();
            this._pages = {};
            this._stack = [];
            this._routes = new chitu.RouteCollection();
            this._container = container;
        }
        ;
        Application.prototype.on_pageCreating = function (context) {
            return ns.fireCallback(this.pageCreating, [this, context]);
        };
        Application.prototype.on_pageCreated = function (page) {
            //this.pageCreated.fire(this, page);
            return ns.fireCallback(this.pageCreated, [this, page]);
        };
        Application.prototype.on_pageShowing = function (page, args) {
            //this.pageShowing.fire(this, page, args);
            return ns.fireCallback(this.pageShowing, [this, page, args]);
        };
        Application.prototype.on_pageShown = function (page, args) {
            //this.pageShown.fire(this, page, args);
            return ns.fireCallback(this.pageShown, [this, page, args]);
        };
        Application.prototype.routes = function () {
            return this._routes;
        };
        Application.prototype.controller = function (routeData) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="chitu.Controller"/>
            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');
            if (!routeData)
                throw e.argumentNull('routeData');
            return this.controllerFactory.getController(routeData);
        };
        Application.prototype.currentPage = function () {
            return this._$currentPage;
        };
        Application.prototype.action = function (routeData) {
            /// <param name="routeData" type="Object"/>
            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');
            if (!routeData)
                throw e.argumentNull('routeData');
            var controllerName = routeData.controller;
            if (!controllerName)
                throw e.argumentNull('name');
            if (typeof controllerName != 'string')
                throw e.routeDataRequireController();
            var actionName = routeData.action;
            if (!actionName)
                throw e.argumentNull('name');
            if (typeof actionName != 'string')
                throw e.routeDataRequireAction();
            var controller = this.controller(routeData);
            return controller.action(actionName);
        };
        Application.prototype.run = function () {
            if (this._runned)
                return;
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
        };
        Application.prototype.showPageAt = function (element, url, args) {
            /// <param name="element" type="HTMLElement" canBeNull="false"/>
            /// <param name="url" type="String" canBeNull="false"/>
            /// <param name="args" type="object" canBeNull="true"/>
            /// <returns type="jQuery.Deferred"/>
            args = args || {};
            if (!element)
                throw e.argumentNull('element');
            if (!url)
                throw e.argumentNull('url');
            return this.showPage(url, args);
        };
        Application.prototype.showPage = function (url, args) {
            /// <param name="container" type="HTMLElement" canBeNull="false"/>
            /// <param name="url" type="String" canBeNull="false"/>
            /// <param name="args" type="object" canBeNull="true"/>
            /// <returns type="jQuery.Deferred"/>
            args = args || {};
            if (!url)
                throw e.argumentNull('url');
            var routeData = this.routes().getRouteData(url);
            if (routeData == null) {
                throw e.noneRouteMatched(url);
            }
            var container = this._container;
            var controllerName = routeData.values().controller;
            var actionName = routeData.values().action;
            var name = chitu.Page.getPageName(routeData);
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
                .done($.proxy(function () {
                self._pageStack.push({ page: this.page, url: this.url });
                //=======================================================
                // 说明：由于只能显示一个页面，只有为 currentPage 才显示
                if (this.page != self.currentPage())
                    this.page.visible(false);
                //=======================================================
                this.result.resolve(this.page);
                self.on_pageShown(this.page, args);
            }, { page: page, result: result, url: url }))
                .fail($.proxy(function (error) {
                this.result.reject(this.page, error);
            }, { page: page, result: result, url: url }));
            return result;
        };
        Application.prototype._createPage = function (url, element) {
            if (!url)
                throw e.argumentNull('url');
            if (typeof url != 'string')
                throw e.paramTypeError('url', 'String');
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
        };
        Application.prototype._setCurrentPage = function (value) {
            this._$currentPage = value;
        };
        Application.prototype.redirect = function (url, args) {
            if (args === void 0) { args = {}; }
            window.location['arguments'] = args;
            window.location.hash = url;
        };
        Application.prototype.back = function (args) {
            if (args === void 0) { args = undefined; }
            /// <returns type="jQuery.Deferred"/>
            var pc = $(this._container).data('PageContainer');
            if (pc == null)
                return $.Deferred().reject();
            return pc.back(args);
        };
        return Application;
    })();
    chitu.Application = Application;
})(chitu || (chitu = {}));
//# sourceMappingURL=Application.js.map