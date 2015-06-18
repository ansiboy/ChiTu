(function (ns) {

    ns.PageContainer = function (app, node) {
        /// <field name="_app" type="chitu.Application"/>
        /// <field name="_node" type="HTMLElement"/>

        this.pageCreating = ns.Callbacks();
        this.pageCreated = ns.Callbacks();
        this.pageShowing = ns.Callbacks();
        this.pageShown = ns.Callbacks();

        this.init(app, node);
    };

    ns.PageContainer.prototype = {
        init: function (app, node) {
            this._app = app;
            this._node = node;
            this._pageStack = [];
        },
        on_pageCreating: function (context) {
            return ns.fireCallback(this.pageCreating, [this, context]);
        },
        on_pageCreated: function (page) {
            //this.pageCreated.fire(this, page);
            return ns.fireCallback(this.pageCreated, [this, page]);
        },
        on_pageShowing: function (page, args) {
            //this.pageShowing.fire(this, page, args);
            return ns.fireCallback(this.pageShowing, [this, page, args]);
        },
        on_pageShown: function (page, args) {
            //this.pageShown.fire(this, page, args);
            return ns.fireCallback(this.pageShown, [this, page, args]);
        },
        application: function () {
            /// <returns type="chitu.Application"/>
            return this._app;
        },
        node: function () {
            /// <returns type="HTMLElement"/>
            return this._node;
        },
        currentPage: function () {
            /// <returns type="chitu.Page"/>
            return this._currentPage;
        },
        _createPage: function (url, element) {
            if (!url) throw e.argumentNull('url');
            if (typeof url != 'string') throw e.paramTypeError('url', 'String');

            if (!element) {
                element = document.createElement('div');
                document.body.appendChild(element);
            }

            var routeData = this.application().routes().getRouteData(url);
            if (routeData == null) {
                throw e.noneRouteMatched(url);
            }

            var controllerName = routeData.controller;
            var actionName = routeData.action;
            var controller = this.application().controller(routeData);
            var view = this.application().viewEngineFactory.getViewEngine(controllerName).view(actionName, routeData.viewPath);
            var context = new ns.ControllerContext(controller, view, routeData);

            this.on_pageCreating(context);
            var page = new ns.Page(context, element);
            this.on_pageCreated(page);
            return page;
        },
        showPage: function (url, args) {
            /// <param name="container" type="HTMLElement" canBeNull="false"/>
            /// <param name="url" type="String" canBeNull="false"/>
            /// <param name="args" type="object" canBeNull="true"/>
            /// <returns type="jQuery.Deferred"/>

            args = args || {};

            if (!url) throw e.argumentNull('url');

            var routeData = this.application().routes().getRouteData(url);
            if (routeData == null) {
                throw e.noneRouteMatched(url);
            }

            var container = this.node();

            var controllerName = routeData.controller;
            var actionName = routeData.action;
            var name = controllerName + '.' + actionName;

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

            this._currentPage = page;
            for (var name in pages) {
                if (pages[name] != this._currentPage) {
                    pages[name].visible(false);
                }
            }

            $.extend(args, routeData);

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
        },
        back: function (args) {
            /// <param name="args" type="Object"/>
            /// <returns type="jQuery.Deferred"/>

            var stack = this._pageStack;
            var current = this.currentPage();
            if (stack.length == 0 || current == null) {
                return $.Deferred().reject();
            }

            stack.pop();
            var item = stack[stack.length - 1];
            if (item == null)
                return $.Deferred().reject();

            var hash = '#' + item.url.toLowerCase()
            if (hash.localeCompare(window.location.hash.toLowerCase()) != 0) {
                window.location.hash = item.url;
                window.location.skip = true;
            }

            current.visible(false);
            if (args)
                item.page.open(args)
            else
                item.page.visible(true);

            //new chitu.Page().open
            //document.body.scrollTop = item.page.scrollTop || '0px';



            this._currentPage = item.page;
            return $.Deferred().resolve();
        }
    };

})(chitu);