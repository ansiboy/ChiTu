var chitu;
(function (chitu) {
    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;
    var PAGE_STACK_MAX_SIZE = 10;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';
    var Application = (function () {
        function Application(config) {
            this.pageCreating = ns.Callbacks();
            this.pageCreated = ns.Callbacks();
            this.page_stack = [];
            this._routes = new chitu.RouteCollection();
            this._runned = false;
            this.controllerFactory = new chitu.ControllerFactory();
            this.viewFactory = new chitu.ViewFactory();
            if (config == null)
                throw e.argumentNull('container');
            if (!config['container']) {
                throw new Error('The config has not a container property.');
            }
            if (!$.isFunction(config['container']) && !config['container'].tagName)
                throw new Error('Parameter container is not a function or html element.');
            this._container = config['container'];
        }
        Application.prototype.on_pageCreating = function (context) {
            return ns.fireCallback(this.pageCreating, [this, context]);
        };
        Application.prototype.on_pageCreated = function (page) {
            return ns.fireCallback(this.pageCreated, [this, page]);
        };
        Application.prototype.routes = function () {
            return this._routes;
        };
        Application.prototype.controller = function (routeData) {
            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');
            if (!routeData)
                throw e.argumentNull('routeData');
            return this.controllerFactory.getController(routeData);
        };
        Application.prototype.currentPage = function () {
            if (this.page_stack.length > 0)
                return this.page_stack[this.page_stack.length - 1];
            return null;
        };
        Application.prototype.previousPage = function () {
            if (this.page_stack.length > 1)
                return this.page_stack[this.page_stack.length - 2];
            return null;
        };
        Application.prototype.action = function (routeData) {
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
        Application.prototype.hashchange = function () {
            var hash = window.location.hash;
            if (!hash) {
                u.log('The url is not contains hash.');
                return;
            }
            var current_page_url = '';
            if (this.previousPage() != null)
                current_page_url = this.previousPage().context().routeData().url();
            if (current_page_url.toLowerCase() == hash.substr(1).toLowerCase()) {
                this.closeCurrentPage();
            }
            else {
                var args = window.location['arguments'] || {};
                window.location['arguments'] = null;
                if (window.location['skip'] == true) {
                    window.location['skip'] = false;
                    return;
                }
                this.showPage(hash.substr(1), args);
            }
        };
        Application.prototype.run = function () {
            if (this._runned)
                return;
            var app = this;
            $.proxy(this.hashchange, this)();
            $(window).bind('hashchange', $.proxy(this.hashchange, this));
            this._runned = true;
        };
        Application.prototype.getCachePage = function (name) {
            for (var i = this.page_stack.length - 1; i >= 0; i--) {
                if (this.page_stack[i].name() == name)
                    return this.page_stack[i];
            }
            return null;
        };
        Application.prototype.showPage = function (url, args) {
            /// <param name="container" type="HTMLElement" canBeNull="false"/>
            /// <param name="url" type="String" canBeNull="false"/>
            /// <param name="args" type="object" canBeNull="true"/>
            /// <returns type="jQuery.Deferred"/>
            var _this = this;
            args = args || {};
            if (!url)
                throw e.argumentNull('url');
            var routeData = this.routes().getRouteData(url);
            if (routeData == null) {
                throw e.noneRouteMatched(url);
            }
            var container;
            if ($.isFunction(this._container)) {
                container = this._container(routeData.values());
                if (container == null)
                    throw new Error('The result of continer function cannt be null');
            }
            else {
                container = this._container;
            }
            var page = this._createPage(url, container, this.currentPage());
            this.page_stack.push(page);
            console.log('page_stack lenght:' + this.page_stack.length);
            if (this.page_stack.length > PAGE_STACK_MAX_SIZE) {
                var p = this.page_stack.shift();
                p.close();
            }
            $.extend(args, routeData.values());
            var result = $.Deferred();
            page.open(args)
                .done(function () {
                result.resolve();
            })
                .fail(function (error) {
                result.reject(_this, error);
            });
            return result;
        };
        Application.prototype.createPageNode = function () {
            var element = document.createElement('div');
            return element;
        };
        Application.prototype.closeCurrentPage = function () {
            var current = this.currentPage();
            var previous = this.previousPage();
            if (current != null) {
                current.close();
                if (previous != null)
                    previous.show();
                this.page_stack.pop();
                console.log('page_stack lenght:' + this.page_stack.length);
            }
        };
        Application.prototype._createPage = function (url, container, previous) {
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
            var view_deferred = this.viewFactory.view(routeData);
            var context = new ns.ControllerContext(controller, view_deferred, routeData);
            this.on_pageCreating(context);
            var page = new ns.Page(context, container, previous);
            this.on_pageCreated(page);
            return page;
        };
        Application.prototype.redirect = function (url, args) {
            if (args === void 0) { args = {}; }
            window.location['arguments'] = args;
            window.location.hash = url;
        };
        Application.prototype.back = function (args) {
            if (args === void 0) { args = undefined; }
            if (window.history.length == 0)
                return $.Deferred().reject();
            window.history.back();
            return $.Deferred().resolve();
        };
        return Application;
    })();
    chitu.Application = Application;
})(chitu || (chitu = {}));
