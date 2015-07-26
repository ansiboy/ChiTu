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
            if (container == null)
                throw e.argumentNull('container');
            if (!container.tagName)
                throw new Error('Parameter container is not a html element.');
            //if (!func) throw e.argumentNull('func');
            //if (!$.isFunction(func)) throw e.paramTypeError('func', 'Function');
            //var options = {
            //    container: document.body,
            //    routes: new ns.RouteCollection()
            //};
            //$.proxy(func, this)(options);
            this.controllerFactory = new ns.ControllerFactory();
            this.viewFactory = new ns.ViewFactory();
            this._pages = {};
            this._stack = [];
            this._routes = new chitu.RouteCollection();
            this._container = container;
        }
        ;
        Application.prototype.on_pageCreating = function (context) {
            this.pageCreating.fire(this, context);
        };
        Application.prototype.on_pageCreated = function (page) {
            this.pageCreated.fire(this, page);
        };
        Application.prototype.on_pageShowing = function (page, args) {
            this.pageShowing.fire(this, page, args);
        };
        Application.prototype.on_pageShown = function (page, args) {
            this.pageShown.fire(page, args);
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
            var self = this;
            var pc = $(element).data('PageContainer');
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
        };
        Application.prototype.showPage = function (url, args) {
            /// <param name="url" type="String" canBeNull="true"/>
            /// <param name="args" type="object" canBeNull="true"/>
            /// <returns type="jQuery.Deferred"/>
            return this.showPageAt(this._container, url, args);
        };
        Application.prototype.redirect = function (url, args) {
            window.location['arguments'] = args;
            window.location.hash = url;
        };
        Application.prototype.back = function (args) {
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