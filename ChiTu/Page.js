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
    var PAGE_CONTENT_CLASS_NAME = 'page-content';
    var LOAD_MORE_HTML = '<span>上拉加载更多数据</span>';
    var LOADDING_HTML = '<i class="icon-spinner icon-spin"></i><span style="padding-left:10px;">数据正在加载中...</span>';
    var LOAD_COMPLETE_HTML = '<span style="padding-left:10px;"></span>';
    (function (PageLoadType) {
        PageLoadType[PageLoadType["start"] = 0] = "start";
        PageLoadType[PageLoadType["scroll"] = 1] = "scroll";
        PageLoadType[PageLoadType["pullDown"] = 2] = "pullDown";
        PageLoadType[PageLoadType["pullUp"] = 3] = "pullUp";
    })(chitu.PageLoadType || (chitu.PageLoadType = {}));
    var PageLoadType = chitu.PageLoadType;
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
    (function (SwipeDirection) {
        SwipeDirection[SwipeDirection["None"] = 0] = "None";
        SwipeDirection[SwipeDirection["Left"] = 1] = "Left";
        SwipeDirection[SwipeDirection["Right"] = 2] = "Right";
        SwipeDirection[SwipeDirection["Up"] = 3] = "Up";
        SwipeDirection[SwipeDirection["Donw"] = 4] = "Donw";
    })(chitu.SwipeDirection || (chitu.SwipeDirection = {}));
    var SwipeDirection = chitu.SwipeDirection;
    (function (ScrollType) {
        ScrollType[ScrollType["IScroll"] = 0] = "IScroll";
        ScrollType[ScrollType["Div"] = 1] = "Div";
        ScrollType[ScrollType["Document"] = 2] = "Document";
    })(chitu.ScrollType || (chitu.ScrollType = {}));
    var ScrollType = chitu.ScrollType;
    var PageNodes = (function () {
        function PageNodes(node) {
            node.className = PAGE_CLASS_NAME;
            this.container = node;
            this.header = document.createElement('div');
            this.header.className = PAGE_HEADER_CLASS_NAME;
            node.appendChild(this.header);
            this.body = document.createElement('div');
            this.body.className = PAGE_BODY_CLASS_NAME;
            node.appendChild(this.body);
            this.content = document.createElement('div');
            this.content.className = PAGE_CONTENT_CLASS_NAME;
            $(this.content).hide();
            this.body.appendChild(this.content);
            this.loading = document.createElement('div');
            this.loading.className = PAGE_LOADING_CLASS_NAME;
            this.loading.innerHTML = '<div class="spin"><i class="icon-spinner icon-spin"></i><div>';
            this.body.appendChild(this.loading);
            this.footer = document.createElement('div');
            this.footer.className = PAGE_FOOTER_CLASS_NAME;
            node.appendChild(this.footer);
        }
        return PageNodes;
    })();
    var Page = (function () {
        function Page(element, scrollType, previous) {
            this._loadViewModelResult = null;
            this._openResult = null;
            this._hideResult = null;
            this._showTime = Page.animationTime;
            this._hideTime = Page.animationTime;
            this._isLoadAllData = true;
            this.preLoad = ns.Callbacks();
            this.load = ns.Callbacks();
            this.closing = ns.Callbacks();
            this.closed = ns.Callbacks();
            this.scroll = ns.Callbacks();
            this.showing = ns.Callbacks();
            this.shown = ns.Callbacks();
            this.hiding = ns.Callbacks();
            this.hidden = ns.Callbacks();
            this.scrollEnd = ns.Callbacks();
            if (!element)
                throw e.argumentNull('element');
            if (scrollType == null)
                throw e.argumentNull('scrollType');
            this._prevous = previous;
            this._pageNode = new PageNodes(element);
            if (scrollType == ScrollType.IScroll) {
                $(this.nodes().container).addClass('ios');
                this.ios_scroller = new IOSScroll(this);
            }
            else if (scrollType == ScrollType.Div) {
                $(this.nodes().container).addClass('div');
                new DisScroll(this);
            }
            else if (scrollType == ScrollType.Document) {
                $(this.nodes().container).addClass('doc');
                new DocumentScroll(this);
            }
            this.scrollEnd.add(Page.page_scrollEnd);
        }
        Page.prototype.init = function (routeData) {
            var controllerName = routeData.values().controller;
            var actionName = routeData.values().action;
            var q = this.nodes().content.querySelector('[ch-part="header"]');
            if (q)
                this.nodes().header.appendChild(q);
            q = this.nodes().content.querySelector('[ch-part="footer"]');
            if (q)
                this.nodes().footer.appendChild(q);
            var args = routeData.values();
            args.loadType = PageLoadType.start;
            args.loadCompleted = Page.createLoadCompletedFunc(this);
            this.on_load(args);
        };
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
        Object.defineProperty(Page.prototype, "routeData", {
            get: function () {
                return this._routeData;
            },
            set: function (value) {
                this._routeData = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Page.prototype, "name", {
            get: function () {
                if (!this._name)
                    this._name = Page.getPageName(this.routeData);
                return this._name;
            },
            enumerable: true,
            configurable: true
        });
        Page.prototype.node = function () {
            return this._pageNode.container;
        };
        Page.prototype.nodes = function () {
            return this._pageNode;
        };
        Object.defineProperty(Page.prototype, "parent", {
            get: function () {
                return this._prevous;
            },
            enumerable: true,
            configurable: true
        });
        Page.prototype.hide = function (swipe) {
            if (!$(this.node()).is(':visible'))
                return;
            swipe = swipe || SwipeDirection.None;
            this.hidePageNode(swipe);
        };
        Page.prototype.show = function (swipe) {
            if ($(this.node()).is(':visible'))
                return;
            swipe = swipe || SwipeDirection.None;
            this.showPageNode(swipe);
        };
        Page.prototype.visible = function () {
            return $(this.node()).is(':visible');
        };
        Page.prototype.hidePageNode = function (swipe) {
            var _this = this;
            if (!window['move']) {
                swipe = SwipeDirection.None;
                console.warn('Move is not loaded and swipe is auto disabled.');
            }
            var result = $.Deferred();
            var container_width = $(this.nodes().container).width();
            var container_height = $(this.nodes().container).height();
            var on_end = function () {
                $(_this.node()).hide();
                result.resolve();
                _this.on_hidden({});
            };
            switch (swipe) {
                case SwipeDirection.None:
                default:
                    on_end();
                    break;
                case SwipeDirection.Up:
                    move(this.nodes().container).y(container_height).end()
                        .y(0 - container_height).duration(this._hideTime).end(on_end);
                    break;
                case SwipeDirection.Donw:
                    move(this.nodes().container).y(container_height).duration(this._hideTime).end(on_end);
                    break;
                case SwipeDirection.Right:
                    move(this.node())
                        .x(container_width)
                        .duration(this._hideTime)
                        .end(on_end);
                    break;
                case SwipeDirection.Left:
                    move(this.node())
                        .x(0 - container_width)
                        .duration(this._hideTime)
                        .end(on_end);
                    break;
            }
            return result;
        };
        Page.prototype.showPageNode = function (swipe) {
            var _this = this;
            if (!window['move']) {
                swipe = SwipeDirection.None;
                console.warn('Move is not loaded and swipe is auto disabled.');
            }
            this.on_showing({});
            var result = $.Deferred();
            this.node().style.display = 'block';
            var container_width = $(this.nodes().container).width();
            var container_height = $(this.nodes().container).height();
            var on_end = function () {
                result.resolve();
            };
            switch (swipe) {
                case SwipeDirection.None:
                default:
                    on_end();
                    break;
                case SwipeDirection.Donw:
                    move(this.node()).y(0 - container_height).duration(0).end(on_end);
                    move(this.node()).y(0).duration(0).end(on_end);
                    break;
                case SwipeDirection.Up:
                    move(this.node()).y(container_height).duration(0).end();
                    move(this.node()).y(0).duration(this._showTime).end(on_end);
                    break;
                case SwipeDirection.Right:
                    move(this.node()).x(0 - container_width).duration(0).end();
                    move(this.node()).x(0).duration(this._showTime).end(on_end);
                    break;
                case SwipeDirection.Left:
                    move(this.node()).x(container_width).duration(0).end();
                    move(this.node()).x(0).duration(this._showTime).end(on_end);
                    break;
            }
            result.done(function () {
                if (_this._prevous != null)
                    _this._prevous.hide();
            });
            return result;
        };
        Page.prototype.showBodyNode = function () {
            $(this._pageNode.container).show();
            $(this._pageNode.loading).hide();
            $(this._pageNode.body).show();
            this.on_shown({});
        };
        Page.prototype.on_load = function (args) {
            var _this = this;
            var result = eventDeferred(this.load, this, args);
            if (args.loadType == PageLoadType.start) {
                result.done(function () {
                    $(_this.nodes().loading).hide();
                    $(_this.nodes().content).show();
                });
            }
            result.done(function () {
                if (_this.ios_scroller) {
                    window.setTimeout(function () { return _this.ios_scroller.refresh(); }, 100);
                }
            });
            return result;
        };
        Page.prototype.on_closed = function (args) {
            return eventDeferred(this.closed, this, args);
        };
        Page.prototype.on_scroll = function (args) {
            return eventDeferred(this.scroll, this, args);
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
        Page.prototype.on_scrollEnd = function (args) {
            return eventDeferred(this.scrollEnd, this, args);
        };
        Page.prototype.open = function (args, swipe) {
            if (this._openResult)
                return this._openResult;
            args = args || {};
            swipe = swipe || SwipeDirection.None;
            this.showPageNode(swipe);
        };
        Page.prototype.close = function (args, swipe) {
            /// <summary>
            /// Colse the page.
            /// </summary>
            /// <param name="args" type="Object" canBeNull="true">
            /// The value passed to the hide event functions.
            /// </param>
            /// <returns type="jQuery.Deferred"/>
            var _this = this;
            this.hidePageNode(swipe).done(function () {
                $(_this.node()).remove();
            });
            args = args || {};
            this.on_closed(args);
        };
        Page.page_scrollEnd = function (sender, args) {
            //scrollStatus = ScrollStatus.ScrollEnd;
            var scrollTop = args.scrollTop;
            var scrollHeight = args.scrollHeight;
            var clientHeight = args.clientHeight;
            var marginBottom = clientHeight / 3;
            if (clientHeight + scrollTop < scrollHeight - marginBottom)
                return;
            if (sender._isLoadAllData == true)
                return;
            var scroll_arg = $.extend(sender.routeData.values(), {
                loadType: PageLoadType.scroll,
                loadCompleted: Page.createLoadCompletedFunc(sender)
            });
            var result = sender.on_load(scroll_arg);
        };
        Page.createLoadCompletedFunc = function (sender) {
            var $scrollLoad_loading = $(sender.nodes().content).find('[name="scrollLoad_loading"]');
            if ($scrollLoad_loading.length == 0) {
                var node = sender.nodes().content;
                $scrollLoad_loading = $('<div name="scrollLoad_loading" style="padding:10px 0px 10px 0px;"><h5 class="text-center"></h5></div>')
                    .appendTo(node)
                    .hide();
            }
            $scrollLoad_loading.find('h5').html(LOADDING_HTML);
            return function (load_completed) {
                sender._isLoadAllData = load_completed;
                if (load_completed && $scrollLoad_loading.is(':visible')) {
                    $scrollLoad_loading.hide();
                    sender.refreshUI();
                }
                else if (!load_completed && !$scrollLoad_loading.is(':visible')) {
                    $scrollLoad_loading.show();
                    sender.refreshUI();
                }
            };
        };
        Page.prototype.refreshUI = function () {
            if (this.ios_scroller) {
                this.ios_scroller.refresh();
            }
        };
        Page.animationTime = 300;
        return Page;
    })();
    chitu.Page = Page;
})(chitu || (chitu = {}));
;
