var chitu;
(function (chitu) {
    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;
    function eventDeferred(callback, sender, args) {
        if (args === void 0) { args = {}; }
        return chitu.fireCallback(callback, [sender, args]);
    }
    ;
    var PAGE_CLASS_NAME = 'page-node';
    var PAGE_HEADER_CLASS_NAME = 'page-header';
    var PAGE_BODY_CLASS_NAME = 'page-body';
    var PAGE_FOOTER_CLASS_NAME = 'page-footer';
    var PAGE_LOADING_CLASS_NAME = 'page-loading';
    //var zindex: number;
    var ShowTypes;
    (function (ShowTypes) {
        ShowTypes[ShowTypes["swipeLeft"] = 0] = "swipeLeft";
        ShowTypes[ShowTypes["swipeRight"] = 1] = "swipeRight";
        ShowTypes[ShowTypes["none"] = 2] = "none";
    })(ShowTypes || (ShowTypes = {}));
    var PageNodeParts;
    (function (PageNodeParts) {
        PageNodeParts[PageNodeParts["header"] = 1] = "header";
        PageNodeParts[PageNodeParts["body"] = 2] = "body";
        PageNodeParts[PageNodeParts["loading"] = 4] = "loading";
        PageNodeParts[PageNodeParts["footer"] = 8] = "footer";
    })(PageNodeParts || (PageNodeParts = {}));
    var PageStatus;
    (function (PageStatus) {
        PageStatus[PageStatus["open"] = 0] = "open";
        PageStatus[PageStatus["closed"] = 1] = "closed";
    })(PageStatus || (PageStatus = {}));
    var PageNode = (function () {
        function PageNode(node) {
            node.className = PAGE_CLASS_NAME;
            this.node = node;
            this.headerNode = document.createElement('div');
            this.headerNode.className = PAGE_HEADER_CLASS_NAME;
            //this.headerNode.style.display = 'none';
            node.appendChild(this.headerNode);
            this.bodyNode = document.createElement('div');
            this.bodyNode.className = PAGE_BODY_CLASS_NAME;
            $(this.bodyNode).hide();
            node.appendChild(this.bodyNode);
            this.loadingNode = document.createElement('div');
            this.loadingNode.className = PAGE_LOADING_CLASS_NAME;
            this.loadingNode.innerHTML = '<div><i class="icon-spinner icon-spin"></i><div>';
            $(this.loadingNode).hide();
            node.appendChild(this.loadingNode);
            this.footerNode = document.createElement('div');
            this.footerNode.className = PAGE_FOOTER_CLASS_NAME;
            //this.footerNode.style.display = 'none';
            node.appendChild(this.footerNode);
        }
        return PageNode;
    })();
    var Page = (function () {
        function Page(context, container) {
            //_node: HTMLElement;
            //_visible = true;
            this._loadViewModelResult = null;
            this._openResult = null;
            this._hideResult = null;
            this._showDelay = 100;
            this._moveTime = 1000;
            this.swipe = true;
            this.init = ns.Callbacks();
            this.preLoad = ns.Callbacks();
            this.load = ns.Callbacks();
            this.closing = ns.Callbacks();
            this.closed = ns.Callbacks();
            this.scroll = ns.Callbacks();
            this.showing = ns.Callbacks();
            this.shown = ns.Callbacks();
            this.hiding = ns.Callbacks();
            this.hidden = ns.Callbacks();
            if (!context)
                throw e.argumentNull('context');
            if (!container)
                throw e.argumentNull('container');
            //if (!zindex) {
            //    zindex = new Number(container.style.zIndex || '0').valueOf();
            //    zindex = zindex + 1;
            //}
            this._container = container;
            var element = document.createElement('div');
            //element.style.zIndex = (zindex + 1).toString();
            container.appendChild(element);
            this._context = context;
            var controllerName = context.routeData().values().controller;
            var actionName = context.routeData().values().action;
            var name = Page.getPageName(context.routeData());
            var viewDeferred = context.view();
            var actionDeferred = context.controller().action(context.routeData());
            this._pageNode = new PageNode(element);
            this._init(name, viewDeferred, actionDeferred, element);
        }
        Page.getPageName = function (routeData) {
            var name;
            if (routeData.pageName()) {
                var route = window['crossroads'].addRoute(routeData.pageName());
                name = route.interpolate(routeData.values());
            }
            else {
                name = routeData.values().controller + '.' + routeData.values().action;
            }
            return name;
        };
        Page.prototype.context = function () {
            /// <returns type="chitu.ControllerContext"/>
            return this._context;
        };
        Page.prototype.name = function () {
            return this._name;
        };
        Page.prototype.node = function () {
            /// <returns type="HTMLElement"/>
            return this._pageNode.node;
        };
        Page.prototype.hide = function () {
            this.hidePageNode(false);
            this.on_hidden({});
        };
        Page.prototype.show = function () {
            this.on_showing({});
            this.showPageNode(false);
            this.on_shown({});
        };
        Page.prototype.visible = function () {
            return $(this.node()).is(':visible');
        };
        Page.prototype.hidePageNode = function (swipe) {
            var _this = this;
            if (swipe) {
                var container_width = $(this._container).width();
                var times = 1000;
                //====================================================
                // 说明：必须要 setTimeout，移动才有效。
                window.setTimeout(function () {
                    window['move'](_this.node()).set('left', container_width + 'px').duration(times).end();
                }, 100);
                //====================================================
                setTimeout(function () {
                    $(_this.node()).hide();
                    _this.on_hidden({});
                }, times);
            }
            else {
                $(this.node()).hide();
                this.on_hidden({});
            }
        };
        Page.prototype.showPageNode = function (swipe) {
            var _this = this;
            var result = $.Deferred();
            if (swipe) {
                var container_width = $(this._container).width();
                this.node().style.left = container_width + 'px';
                this.node().style.display = 'block';
                //var times = 1000;
                //====================================================
                // 说明：必须要 setTimeout，移动才有效。
                window.setTimeout(function () {
                    window['move'](_this.node()).set('left', '0px').duration(_this._moveTime).end();
                    if (_this._openResult != null) {
                        $(_this._pageNode.loadingNode).show();
                        $(_this._pageNode.bodyNode).hide();
                    }
                    else {
                        $(_this._pageNode.loadingNode).hide();
                        $(_this._pageNode.bodyNode).show();
                    }
                }, this._showDelay);
                //====================================================
                window.setTimeout(function () {
                    result.resolve();
                }, this._moveTime);
            }
            else {
                this.node().style.display = 'block';
                this.node().style.left = '0px';
                if (this._openResult != null) {
                    $(this._pageNode.loadingNode).show();
                    $(this._pageNode.bodyNode).hide();
                }
                else {
                    $(this._pageNode.loadingNode).hide();
                    $(this._pageNode.bodyNode).show();
                }
                result.resolve();
            }
            return result;
        };
        Page.prototype.showBodyNode = function () {
            $(this._pageNode.node).show();
            $(this._pageNode.loadingNode).hide();
            $(this._pageNode.bodyNode).show();
        };
        //private showLoadingNode() {
        //    $(this._pageNode.node).show();
        //    $(this._pageNode.bodyNode).hide();
        //    $(this._pageNode.loadingNode).show();
        //}
        Page.prototype._init = function (name, viewDeferred, actionDeferred, node) {
            if (!name)
                throw e.argumentNull('name');
            if (!viewDeferred)
                throw e.argumentNull('viewDeferred');
            if (!actionDeferred)
                throw e.argumentNull('actionDeferred');
            if (!node)
                throw e.argumentNull('node');
            this._name = name;
            this._viewDeferred = viewDeferred;
            this._actionDeferred = actionDeferred;
        };
        Page.prototype.on_init = function () {
            return eventDeferred(this.init, this);
        };
        Page.prototype.on_load = function (args) {
            return eventDeferred(this.load, this, args);
        };
        Page.prototype.on_closed = function (args) {
            return eventDeferred(this.closed, this, args);
        };
        Page.prototype.on_scroll = function (event) {
            return eventDeferred(this.scroll, this, event);
        };
        Page.prototype.on_showing = function (args) {
            return eventDeferred(this.showing, this, args);
        };
        Page.prototype.on_shown = function (args) {
            return eventDeferred(this.shown, this, args);
        };
        Page.prototype.on_hiding = function (args) {
            return eventDeferred(this.hiding, this, args);
        };
        Page.prototype.on_hidden = function (args) {
            return eventDeferred(this.hidden, this, args);
        };
        Page.prototype._loadViewModel = function () {
            var _this = this;
            if (this._loadViewModelResult)
                return this._loadViewModelResult;
            this._loadViewModelResult = this._viewDeferred.pipe(function (html) {
                u.log('Load view success, page:{0}.', [_this.name()]);
                $(_this.node()).find('.' + PAGE_BODY_CLASS_NAME).html(html);
                return _this._actionDeferred;
            }).pipe(function (action) {
                /// <param name="action" type="chitu.Action"/>
                var result = action.execute(_this);
                _this.on_init();
                if (u.isDeferred(result))
                    return result;
                return $.Deferred().resolve();
            }).fail(function () {
                _this._loadViewModelResult = null;
                u.log('Load view or action fail, page：{0}.', [_this.name()]);
            });
            return this._loadViewModelResult;
        };
        Page.prototype.open = function (values) {
            var _this = this;
            /// <summary>
            /// Show the page.
            /// </summary>
            /// <param name="args" type="Object">
            /// The value passed to the show event functions.
            /// </param>
            /// <returns type="jQuery.Deferred"/>
            if (this._openResult)
                return this._openResult;
            var args = values;
            this._openResult = $.Deferred();
            //var self = this;
            this.on_showing(args);
            var pageNodeShown = this.showPageNode(this.swipe);
            this._loadViewModel()
                .pipe(function () {
                return _this.on_load(args);
            })
                .done(function () {
                _this._openResult.resolve();
                _this.showBodyNode();
                pageNodeShown.done(function () {
                    _this.on_shown(args);
                });
            })
                .fail(function () {
                this._openResult.reject();
            });
            return this._openResult.always(function () {
                _this._openResult = null;
            });
        };
        Page.prototype.close = function (args) {
            /// <summary>
            /// Hide the page.
            /// </summary>
            /// <param name="args" type="Object" canBeNull="true">
            /// The value passed to the hide event functions.
            /// </param>
            /// <returns type="jQuery.Deferred"/>
            var _this = this;
            if (args === void 0) { args = undefined; }
            args = args || {};
            this.hidden.add(function () {
                _this.node().remove();
            });
            this.hidePageNode(this.swipe);
            this.on_closed(args);
        };
        return Page;
    })();
    chitu.Page = Page;
})(chitu || (chitu = {}));
;
//# sourceMappingURL=Page.js.map