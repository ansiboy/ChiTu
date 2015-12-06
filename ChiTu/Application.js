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
            if (!config.container) {
                throw new Error('The config has not a container property.');
            }
            if (!$.isFunction(config.container) && !config.container['tagName'])
                throw new Error('Parameter container is not a function or html element.');
            config.openSwipe = config.openSwipe || function (routeData) { return chitu.SwipeDirection.None; };
            config.closeSwipe = config.closeSwipe || function (routeData) { return chitu.SwipeDirection.None; };
            config.scrollType = config.scrollType || function (routeData) { return chitu.ScrollType.Document; };
            this.config = config;
        }
        Application.prototype.on_pageCreating = function (context) {
            return chitu.fireCallback(this.pageCreating, [this, context]);
        };
        Application.prototype.on_pageCreated = function (page) {
            return chitu.fireCallback(this.pageCreated, [this, page]);
        };
        Application.prototype.routes = function () {
            return this._routes;
        };
        Application.prototype.controller = function (routeData) {
            if (typeof routeData !== 'object')
                throw chitu.Errors.paramTypeError('routeData', 'object');
            if (!routeData)
                throw chitu.Errors.argumentNull('routeData');
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
                throw chitu.Errors.paramTypeError('routeData', 'object');
            if (!routeData)
                throw chitu.Errors.argumentNull('routeData');
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
            return controller.getAction(actionName);
        };
        Application.prototype.hashchange = function () {
            if (window.location['skip'] == true) {
                window.location['skip'] = false;
                return;
            }
            var hash = window.location.hash;
            if (!hash) {
                chitu.Utility.log('The url is not contains hash.');
                return;
            }
            var current_page_url = '';
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
                if (this.page_stack[i].name == name)
                    return this.page_stack[i];
            }
            return null;
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
            var container;
            if ($.isFunction(this.config.container)) {
                container = this.config.container(routeData.values());
                if (container == null)
                    throw new Error('The result of continer function cannt be null');
            }
            else {
                container = this.config.container;
            }
            var page_node = document.createElement('div');
            container.appendChild(page_node);
            var page = this._createPage(url, page_node, this.currentPage());
            this.page_stack.push(page);
            console.log('page_stack lenght:' + this.page_stack.length);
            if (this.page_stack.length > PAGE_STACK_MAX_SIZE) {
                var p = this.page_stack.shift();
                p.close({});
            }
            var swipe = this.config.openSwipe(routeData);
            $.extend(args, routeData.values());
            page.open(args, swipe);
            return page;
        };
        Application.prototype.createPageNode = function () {
            var element = document.createElement('div');
            return element;
        };
        Application.prototype.closeCurrentPage = function () {
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
            var view_deferred = this.viewFactory.getView(routeData);
            var action_deferred = controller.getAction(routeData);
            var context = new ns.ControllerContext(controller, view_deferred, routeData);
            this.on_pageCreating(context);
            var scrollType = this.config.scrollType(routeData);
            var page = new ns.Page(container, scrollType, previous);
            page.routeData = routeData;
            this.on_pageCreated(page);
            $.when(view_deferred, action_deferred).done(function (html, action) {
                page.nodes().content.innerHTML = html;
                action.execute(page);
                page.init(routeData);
            });
            return page;
        };
        Application.prototype.redirect = function (url, args) {
            if (args === void 0) { args = {}; }
            window.location['skip'] = true;
            window.location.hash = url;
            this.showPage(url, args);
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
