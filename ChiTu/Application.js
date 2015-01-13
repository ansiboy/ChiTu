(function (ns) {
    var u = ns.utility;
    var e = ns.Error;

    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';

    function combinePaths(path1, path2) {
        /// <param name="path1" type="String"/>
        /// <param name="path2" type="String"/>
        var path1 = path1.trim();
        var path2 = path2.trim();
        if (path1[path1.length - 1] == '/' || path1[path1.length - 1] == '\\') {
            path1 = path1.substr(0, path1.length - 1);
        }
        if (path2[0] == '/' || path2[0] == '\\') {
            path2 = path2.substr(1, path2.length - 1);
        }
        return path1 + '/' + path2;
    };

    function on_pageCreated(sender, page) {
        page.shown.add(function (sender) {
            if ($(document.body).scrollTop() != null) {
                $(document.body).scrollTop(sender.scrollTop || '0px');
            }
            else {
                $(document).scrollTop(sender.scrollTop || '0px');
            }
        });

        // 记录 page 滚动的位置，返回到该页时，能滚动到指定位置
        //page.scroll.add(function (sender, event) {
        //    sender.scrollTop = $(document.body).scrollTop() || $(document).scrollTop();
        //});
    };

    ns.Application = function (func) {
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
        this.viewEngineFactory = new ns.ViewEngineFacotry(options.viewPath);

        this._pages = {};
        this._stack = [];
        this._routes = options.routes;
        this._container = options.container;
        this.pageCreating = ns.Callbacks();
        this.pageCreated = ns.Callbacks();
        this.pageShowing = ns.Callbacks();
        this.pageShown = ns.Callbacks();
    };

    ns.Application.prototype = {
        on_pageCreating: function (context) {
            this.pageCreating.fire(this, context);
        },
        on_pageCreated: function (page) {
            this.pageCreated.fire(this, page);
        },
        on_pageShowing: function (page, args) {
            this.pageShowing.fire(this, page, args);
        },
        on_pageShown: function (page, args) {
            this.pageShown.fire(this, page, args);
        },
        routes: function () {
            return this._routes;
        },

        controller: function (name) {
            /// <param name="name" type="string"/>
            /// <returns type="chitu.Controller"/>
            if (!name) throw e.argumentNull('name');
            if (typeof name != 'string') throw e.paramTypeError('name', 'String');

            return this.controllerFactory.getController(name);
        },
        action: function (controllerName, actionName) {
            /// <param name="controllerName" type="String"/>
            /// <param name="actionName" type="String"/>
            if (!controllerName) throw e.argumentNull('name');
            if (typeof controllerName != 'string') throw e.paramTypeError('name', 'String');

            if (!actionName) throw e.argumentNull('name');
            if (typeof actionName != 'string') throw e.paramTypeError('name', 'String');

            var controller = this.controller(controllerName);
            return controller.action(actionName);
        },
        run: function () {
            if (this._runned) return;

            var app = this;
            var hashchange = function (event) {
                var hash = window.location.hash;
                if (!hash) {
                    u.log('The url is not contains hash.');
                    return;
                }

                var args = window.location.arguments || {};
                var container = window.location.container || app._container;
                window.location.arguments = null;
                window.location.container = null;
                if (window.location.skip == null || window.location.skip == false)
                    app.showPageAt(container, hash.substr(1), args);

                window.location.skip = false;
            };
            $.proxy(hashchange, this)();
            $(window).bind('hashchange', $.proxy(hashchange, this));

            //$(document).scroll(function (event) {
            //    var pc = $(app._container).data('PageContainer');
            //    if (!pc || !pc.currentPage() || !($(pc.currentPage().node()).is(':visible')))
            //        return;

            //    pc.currentPage().on_scroll(event);
            //});

            this._runned = true;
        },



        showPageAt: function (element, url, args) {
            /// <param name="element" type="HTMLElement" canBeNull="false"/>
            /// <param name="url" type="String" canBeNull="false"/>
            /// <param name="args" type="object" canBeNull="true"/>
            /// <returns type="jQuery.Deferred"/>

            args = args || {};

            if (!element) throw e.argumentNull('element');
            if (!url) throw e.argumentNull('url');

            var self = this;

            var pc = $(element).data('PageContainer');
            if (pc == null) {
                pc = new ns.PageContainer(this, element);

                if (element === this._container) {
                    pc.pageCreated.add(on_pageCreated);
                }

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
            //self.on_pageShowing();
            return pc.showPage(url, args);
            //.done(function (page) {
            //    self.on_pageShown(page);
            //});
        },
        showPage: function (url, args) {
            /// <param name="url" type="String" canBeNull="true"/>
            /// <param name="args" type="object" canBeNull="true"/>
            /// <returns type="jQuery.Deferred"/>

            return this.showPageAt(this._container, url, args);
        },
        redirect: function (url, args) {
            window.location.arguments = args;
            window.location.hash = url;
        },
        back: function (args) {
            /// <returns type="jQuery.Deferred"/>
            var pc = $(this._container).data('PageContainer');
            if (pc == null)
                return $.Deferred().reject();

            return pc.back(args);
        }
    };

})(chitu);