"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var chitu;
(function (chitu) {
    var PageMaster = function () {
        function PageMaster(container, parser) {
            _classCallCheck(this, PageMaster);

            this.pageCreated = chitu.Callbacks();
            this.pageLoad = chitu.Callbacks();
            this.pageType = chitu.Page;
            this.pageDisplayType = PageDisplayerImplement;
            this.cachePages = {};
            this.page_stack = new Array();
            this.nodes = {};
            this.error = chitu.Callbacks();
            this.parser = parser || this.defaultPageNodeParser();
            if (!container) throw chitu.Errors.argumentNull("container");
            this.parser.actions = this.parser.actions || {};
            this.container = container;
        }

        _createClass(PageMaster, [{
            key: "defaultPageNodeParser",
            value: function defaultPageNodeParser() {
                var _this = this;

                var nodes = {};
                var p = {
                    actions: {},
                    parse: function parse(pageName) {
                        var node = nodes[pageName];
                        if (node == null) {
                            var path = ("modules_" + pageName).split('_').join('/');
                            node = { action: _this.createDefaultAction(path, chitu.loadjs), name: pageName };
                            nodes[pageName] = node;
                        }
                        return node;
                    }
                };
                return p;
            }
        }, {
            key: "createDefaultAction",
            value: function createDefaultAction(url, loadjs) {
                var _this2 = this;

                return function (page) {
                    return __awaiter(_this2, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                        var actionExports, _action, result, action, _action2;

                        return regeneratorRuntime.wrap(function _callee$(_context) {
                            while (1) {
                                switch (_context.prev = _context.next) {
                                    case 0:
                                        _context.next = 2;
                                        return loadjs(url);

                                    case 2:
                                        actionExports = _context.sent;

                                        if (actionExports) {
                                            _context.next = 5;
                                            break;
                                        }

                                        throw chitu.Errors.exportsCanntNull(url);

                                    case 5:
                                        _action = actionExports.default;

                                        if (!(_action == null)) {
                                            _context.next = 8;
                                            break;
                                        }

                                        throw chitu.Errors.canntFindAction(page.name);

                                    case 8:
                                        result = void 0;

                                        if (PageMaster.isClass(_action)) {
                                            action = _action;

                                            result = new action(page, this);
                                        } else {
                                            _action2 = _action;

                                            result = _action2(page, this);
                                        }
                                        return _context.abrupt("return", result);

                                    case 11:
                                    case "end":
                                        return _context.stop();
                                }
                            }
                        }, _callee, this);
                    }));
                };
            }
        }, {
            key: "on_pageCreated",
            value: function on_pageCreated(page) {
                return this.pageCreated.fire(this, page);
            }
        }, {
            key: "getPage",
            value: function getPage(node, values) {
                console.assert(node != null);
                values = values || {};
                var pageName = node.name;
                var cachePage = this.cachePages[pageName];
                if (cachePage != null) {
                    cachePage.data = Object.assign(cachePage.data || {}, values);
                    return { page: cachePage, isNew: false };
                }
                var page = this.createPage(pageName, values);
                this.cachePages[pageName] = page;
                this.on_pageCreated(page);
                return { page: page, isNew: true };
            }
        }, {
            key: "createPage",
            value: function createPage(pageName, values) {
                if (!pageName) throw chitu.Errors.argumentNull('pageName');
                values = values || {};
                var element = this.createPageElement(pageName);
                var displayer = new this.pageDisplayType(this);
                console.assert(this.pageType != null);
                var page = new this.pageType({
                    app: this,
                    name: pageName,
                    data: values,
                    displayer: displayer,
                    element: element
                });
                return page;
            }
        }, {
            key: "createPageElement",
            value: function createPageElement(pageName) {
                var element = document.createElement(chitu.Page.tagName);
                this.container.appendChild(element);
                return element;
            }
        }, {
            key: "showPage",
            value: function showPage(pageName, args, rerender) {
                args = args || {};
                rerender = rerender == null ? false : true;
                if (!pageName) throw chitu.Errors.argumentNull('pageName');
                var node = this.findSiteMapNode(pageName);
                if (node == null) throw chitu.Errors.pageNodeNotExists(pageName);
                if (this.currentPage != null && this.currentPage.name == pageName) return this.currentPage;
                args = args || {};

                var _getPage = this.getPage(node, args),
                    page = _getPage.page,
                    isNew = _getPage.isNew;

                if (isNew || rerender) {
                    var siteMapNode = this.findSiteMapNode(pageName);
                    if (siteMapNode == null) throw chitu.Errors.pageNodeNotExists(pageName);
                    var action = siteMapNode.action;
                    if (action == null) throw chitu.Errors.actionCanntNull(pageName);
                    action(page, this);
                }
                page.show();
                this.pushPage(page);
                console.assert(page == this.currentPage, "page is not current page");
                return page;
            }
        }, {
            key: "closePage",
            value: function closePage(page) {
                if (page == null) throw chitu.Errors.argumentNull('page');
                page.close();
                delete this.cachePages[page.name];
                this.page_stack = this.page_stack.filter(function (o) {
                    return o != page;
                });
            }
        }, {
            key: "pushPage",
            value: function pushPage(page) {
                this.page_stack.push(page);
            }
        }, {
            key: "findSiteMapNode",
            value: function findSiteMapNode(pageName) {
                if (this.nodes[pageName]) return this.nodes[pageName];
                var node = null;
                var action = this.parser.actions ? this.parser.actions[pageName] : null;
                if (action != null) {
                    node = { action: action, name: pageName };
                }
                if (node == null && this.parser.parse != null) {
                    node = this.parser.parse(pageName);
                    console.assert(node.action != null);
                }
                if (node != null) this.nodes[pageName] = node;
                return node;
            }
        }, {
            key: "closeCurrentPage",
            value: function closeCurrentPage(passData) {
                var page = this.page_stack.pop();
                if (page == null) return;
                this.closePage(page);
                if (this.currentPage) {
                    if (passData) {
                        console.assert(this.currentPage.data != null);
                        this.currentPage.data = Object.assign(this.currentPage.data, passData);
                    }
                    this.currentPage.show();
                }
            }
        }, {
            key: "currentPage",
            get: function get() {
                if (this.page_stack.length > 0) return this.page_stack[this.page_stack.length - 1];
                return null;
            }
        }, {
            key: "pageStack",
            get: function get() {
                return this.page_stack;
            }
        }]);

        return PageMaster;
    }();

    PageMaster.isClass = function () {
        var toString = Function.prototype.toString;
        function fnBody(fn) {
            return toString.call(fn).replace(/^[^{]*{\s*/, '').replace(/\s*}[^}]*$/, '');
        }
        function isClass(fn) {
            return typeof fn === 'function' && (/^class(\s|\{\}$)/.test(toString.call(fn)) || /^.*classCallCheck\(/.test(fnBody(fn)));
        }
        return isClass;
    }();
    chitu.PageMaster = PageMaster;
})(chitu || (chitu = {}));
var chitu;
(function (chitu) {
    var EmtpyStateData = "";
    var DefaultPageName = "index";
    function _parseUrl(app, url) {
        var sharpIndex = url.indexOf('#');
        if (sharpIndex < 0) {
            var _pageName = DefaultPageName;
            return { pageName: _pageName, values: {} };
        }
        var routeString = url.substr(sharpIndex + 1);
        if (!routeString) throw chitu.Errors.canntParseRouteString(url);
        if (routeString.startsWith('!')) {
            throw chitu.Errors.canntParseRouteString(routeString);
        }
        var routePath = void 0;
        var search = null;
        var param_spliter_index = routeString.indexOf('?');
        if (param_spliter_index > 0) {
            search = routeString.substr(param_spliter_index + 1);
            routePath = routeString.substring(0, param_spliter_index);
        } else {
            routePath = routeString;
        }
        if (!routePath) throw chitu.Errors.canntParseRouteString(routeString);
        var values = {};
        if (search) {
            values = pareeUrlQuery(search);
        }
        var pageName = routePath;
        return { pageName: pageName, values: values };
    }
    function pareeUrlQuery(query) {
        var match = void 0,
            pl = /\+/g,
            search = /([^&=]+)=?([^&]*)/g,
            decode = function decode(s) {
            return decodeURIComponent(s.replace(pl, " "));
        };
        var urlParams = {};
        while (match = search.exec(query)) {
            urlParams[decode(match[1])] = decode(match[2]);
        }return urlParams;
    }
    function _createUrl(pageName, params) {
        var path_parts = pageName.split('.');
        var path = path_parts.join('/');
        if (!params) return "#" + path;
        var paramsText = '';
        for (var key in params) {
            var value = params[key];
            var type = _typeof(params[key]);
            if (type != 'string' || value == null) {
                continue;
            }
            paramsText = paramsText == '' ? "?" + key + "=" + params[key] : paramsText + ("&" + key + "=" + params[key]);
        }
        return "#" + path + paramsText;
    }

    var Application = function (_chitu$PageMaster) {
        _inherits(Application, _chitu$PageMaster);

        function Application(args) {
            _classCallCheck(this, Application);

            var _this3 = _possibleConstructorReturn(this, (Application.__proto__ || Object.getPrototypeOf(Application)).call(this, (args || {}).container || document.body, (args || {}).parser));

            _this3._runned = false;
            _this3.closeCurrentOnBack = null;
            _this3.tempPageData = undefined;
            return _this3;
        }

        _createClass(Application, [{
            key: "parseUrl",
            value: function parseUrl(url) {
                var routeData = _parseUrl(this, url);
                return routeData;
            }
        }, {
            key: "createUrl",
            value: function createUrl(pageName, values) {
                return _createUrl(pageName, values);
            }
        }, {
            key: "run",
            value: function run() {
                var _this4 = this;

                if (this._runned) return;
                this.showPageByUrl(location.href, false);
                window.addEventListener('popstate', function () {
                    var url = location.href;
                    var sharpIndex = url.indexOf('#');
                    var routeString = url.substr(sharpIndex + 1);
                    if (sharpIndex < 0 || routeString.startsWith('!')) {
                        return;
                    }
                    _this4.showPageByUrl(url, true);
                });
                this._runned = true;
            }
        }, {
            key: "showPageByUrl",
            value: function showPageByUrl(url, fromCache) {
                if (!url) throw chitu.Errors.argumentNull('url');
                var routeData = this.parseUrl(url);
                if (routeData == null) {
                    throw chitu.Errors.noneRouteMatched(url);
                }
                var tempPageData = this.fetchTemplatePageData();
                var result = null;
                if (this.closeCurrentOnBack == true) {
                    this.closeCurrentOnBack = null;
                    if (tempPageData == null) this.closeCurrentPage();else this.closeCurrentPage(tempPageData);
                    result = this.currentPage;
                } else if (this.closeCurrentOnBack == false) {
                    this.closeCurrentOnBack = null;
                    var page = this.pageStack.pop();
                    if (page == null) throw new Error('page is null');
                    page.hide(this.currentPage);
                    result = this.currentPage;
                }
                if (result == null) {
                    var args = routeData.values || {};
                    if (tempPageData) {
                        args = Object.assign(args, tempPageData);
                    }
                    result = this.showPage(routeData.pageName, args);
                }
                return result;
            }
        }, {
            key: "fetchTemplatePageData",
            value: function fetchTemplatePageData() {
                if (this.tempPageData == null) {
                    return null;
                }
                var data = this.tempPageData;
                this.tempPageData = undefined;
                return data;
            }
        }, {
            key: "setLocationHash",
            value: function setLocationHash(url) {
                history.pushState(EmtpyStateData, "", url);
            }
        }, {
            key: "redirect",
            value: function redirect(pageName, args) {
                var result = this.showPage(pageName, args);
                var url = this.createUrl(pageName, args);
                this.setLocationHash(url);
                return result;
            }
        }, {
            key: "forward",
            value: function forward(pageName, args) {
                var result = this.showPage(pageName, args, true);
                var url = this.createUrl(pageName, args);
                this.setLocationHash(url);
                return result;
            }
        }, {
            key: "reload",
            value: function reload(pageName, args) {
                var result = this.showPage(pageName, args, true);
                return result;
            }
        }, {
            key: "back",
            value: function back(closeCurrentPage, data) {
                var closeCurrentPageDefault = true;
                if ((typeof closeCurrentPage === "undefined" ? "undefined" : _typeof(closeCurrentPage)) == 'object') {
                    data = closeCurrentPage;
                    closeCurrentPage = null;
                }
                this.closeCurrentOnBack = closeCurrentPage == null ? closeCurrentPageDefault : closeCurrentPage;
                this.tempPageData = data;
                history.back();
            }
        }]);

        return Application;
    }(chitu.PageMaster);

    chitu.Application = Application;
})(chitu || (chitu = {}));
var chitu;
(function (chitu) {
    var Errors = function () {
        function Errors() {
            _classCallCheck(this, Errors);
        }

        _createClass(Errors, null, [{
            key: "pageNodeNotExists",
            value: function pageNodeNotExists(pageName) {
                var msg = "Page node named " + pageName + " is not exists.";
                return new Error(msg);
            }
        }, {
            key: "actionCanntNull",
            value: function actionCanntNull(pageName) {
                var msg = "Action of '" + pageName + "' can not be null.";
                return new Error(msg);
            }
        }, {
            key: "argumentNull",
            value: function argumentNull(paramName) {
                var msg = "The argument \"" + paramName + "\" cannt be null.";
                return new Error(msg);
            }
        }, {
            key: "modelFileExpecteFunction",
            value: function modelFileExpecteFunction(script) {
                var msg = "The eval result of script file \"" + script + "\" is expected a function.";
                return new Error(msg);
            }
        }, {
            key: "paramTypeError",
            value: function paramTypeError(paramName, expectedType) {
                var msg = "The param \"" + paramName + "\" is expected \"" + expectedType + "\" type.";
                return new Error(msg);
            }
        }, {
            key: "paramError",
            value: function paramError(msg) {
                return new Error(msg);
            }
        }, {
            key: "pathPairRequireView",
            value: function pathPairRequireView(index) {
                var msg = "The view value is required for path pair, but the item with index \"" + index + "\" is miss it.";
                return new Error(msg);
            }
        }, {
            key: "notImplemented",
            value: function notImplemented(name) {
                var msg = "'The method \"" + name + "\" is not implemented.'";
                return new Error(msg);
            }
        }, {
            key: "routeExists",
            value: function routeExists(name) {
                var msg = "Route named \"" + name + "\" is exists.";
                return new Error(msg);
            }
        }, {
            key: "noneRouteMatched",
            value: function noneRouteMatched(url) {
                var msg = "None route matched with url \"" + url + "\".";
                var error = new Error(msg);
                return error;
            }
        }, {
            key: "emptyStack",
            value: function emptyStack() {
                return new Error('The stack is empty.');
            }
        }, {
            key: "canntParseUrl",
            value: function canntParseUrl(url) {
                var msg = "Can not parse the url \"" + url + "\" to route data.";
                return new Error(msg);
            }
        }, {
            key: "canntParseRouteString",
            value: function canntParseRouteString(routeString) {
                var msg = "Can not parse the route string \"" + routeString + "\" to route data.;";
                return new Error(msg);
            }
        }, {
            key: "routeDataRequireController",
            value: function routeDataRequireController() {
                var msg = 'The route data does not contains a "controller" file.';
                return new Error(msg);
            }
        }, {
            key: "routeDataRequireAction",
            value: function routeDataRequireAction() {
                var msg = 'The route data does not contains a "action" file.';
                return new Error(msg);
            }
        }, {
            key: "viewCanntNull",
            value: function viewCanntNull() {
                var msg = 'The view or viewDeferred of the page cannt null.';
                return new Error(msg);
            }
        }, {
            key: "createPageFail",
            value: function createPageFail(pageName) {
                var msg = "Create page \"" + pageName + "\" fail.";
                return new Error(msg);
            }
        }, {
            key: "actionTypeError",
            value: function actionTypeError(pageName) {
                var msg = "The action in page '" + pageName + "' is expect as function.";
                return new Error(msg);
            }
        }, {
            key: "canntFindAction",
            value: function canntFindAction(pageName) {
                var msg = "Cannt find action in page '" + pageName + "', is the exports has default field?";
                return new Error(msg);
            }
        }, {
            key: "exportsCanntNull",
            value: function exportsCanntNull(pageName) {
                var msg = "Exports of page '" + pageName + "' is null.";
                return new Error(msg);
            }
        }, {
            key: "scrollerElementNotExists",
            value: function scrollerElementNotExists() {
                var msg = "Scroller element is not exists.";
                return new Error(msg);
            }
        }, {
            key: "resourceExists",
            value: function resourceExists(resourceName, pageName) {
                var msg = "Rosource '" + resourceName + "' is exists in the resources of page '" + pageName + "'.";
                return new Error(msg);
            }
        }, {
            key: "siteMapRootCanntNull",
            value: function siteMapRootCanntNull() {
                var msg = "The site map root node can not be null.";
                return new Error(msg);
            }
        }, {
            key: "duplicateSiteMapNode",
            value: function duplicateSiteMapNode(name) {
                var msg = "The site map node " + name + " is exists.";
                return new Error(name);
            }
        }]);

        return Errors;
    }();

    chitu.Errors = Errors;
})(chitu || (chitu = {}));
var chitu;
(function (chitu) {
    var Callback = function () {
        function Callback() {
            _classCallCheck(this, Callback);

            this.funcs = new Array();
        }

        _createClass(Callback, [{
            key: "add",
            value: function add(func) {
                this.funcs.push(func);
            }
        }, {
            key: "remove",
            value: function remove(func) {
                this.funcs = this.funcs.filter(function (o) {
                    return o != func;
                });
            }
        }, {
            key: "fire",
            value: function fire() {
                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                this.funcs.forEach(function (o) {
                    return o.apply(undefined, args);
                });
            }
        }]);

        return Callback;
    }();

    chitu.Callback = Callback;
    function Callbacks() {
        return new Callback();
    }
    chitu.Callbacks = Callbacks;

    var ValueStore = function () {
        function ValueStore(value) {
            _classCallCheck(this, ValueStore);

            this.items = new Array();
            this._value = value === undefined ? null : value;
        }

        _createClass(ValueStore, [{
            key: "add",
            value: function add(func, sender) {
                this.items.push({ func: func, sender: sender });
                return func;
            }
        }, {
            key: "remove",
            value: function remove(func) {
                this.items = this.items.filter(function (o) {
                    return o.func != func;
                });
            }
        }, {
            key: "fire",
            value: function fire(value) {
                this.items.forEach(function (o) {
                    return o.func(value, o.sender);
                });
            }
        }, {
            key: "value",
            get: function get() {
                if (this._value === undefined) return null;
                return this._value;
            },
            set: function set(value) {
                this._value = value;
                this.fire(value);
            }
        }]);

        return ValueStore;
    }();

    chitu.ValueStore = ValueStore;
    function loadjs(path) {
        return new Promise(function (reslove, reject) {
            require([path], function (result) {
                reslove(result);
            }, function (err) {
                reject(err);
            });
        });
    }
    chitu.loadjs = loadjs;
})(chitu || (chitu = {}));
var chitu;
(function (chitu) {
    var Page = function () {
        function Page(params) {
            _classCallCheck(this, Page);

            this.data = {};
            this.showing = chitu.Callbacks();
            this.shown = chitu.Callbacks();
            this.hiding = chitu.Callbacks();
            this.hidden = chitu.Callbacks();
            this.closing = chitu.Callbacks();
            this.closed = chitu.Callbacks();
            this._element = params.element;
            this._app = params.app;
            this._displayer = params.displayer;
            this.data = params.data;
            this._name = params.name;
        }

        _createClass(Page, [{
            key: "on_showing",
            value: function on_showing() {
                return this.showing.fire(this, this.data);
            }
        }, {
            key: "on_shown",
            value: function on_shown() {
                return this.shown.fire(this, this.data);
            }
        }, {
            key: "on_hiding",
            value: function on_hiding() {
                return this.hiding.fire(this, this.data);
            }
        }, {
            key: "on_hidden",
            value: function on_hidden() {
                return this.hidden.fire(this, this.data);
            }
        }, {
            key: "on_closing",
            value: function on_closing() {
                return this.closing.fire(this, this.data);
            }
        }, {
            key: "on_closed",
            value: function on_closed() {
                return this.closed.fire(this, this.data);
            }
        }, {
            key: "show",
            value: function show() {
                var _this5 = this;

                this.on_showing();
                var currentPage = this._app.currentPage;
                if (this == currentPage) {
                    currentPage = null;
                }
                return this._displayer.show(this, currentPage).then(function (o) {
                    _this5.on_shown();
                });
            }
        }, {
            key: "hide",
            value: function hide(currentPage) {
                var _this6 = this;

                this.on_hiding();
                return this._displayer.hide(this, currentPage).then(function (o) {
                    _this6.on_hidden();
                });
            }
        }, {
            key: "close",
            value: function close() {
                this.on_closing();
                this._element.remove();
                this.on_closed();
                return Promise.resolve();
            }
        }, {
            key: "createService",
            value: function createService(type) {
                var _this7 = this;

                type = type || chitu.Service;
                var service = new type();
                service.error.add(function (ender, error) {
                    _this7._app.error.fire(_this7._app, error, _this7);
                });
                return service;
            }
        }, {
            key: "element",
            get: function get() {
                return this._element;
            }
        }, {
            key: "name",
            get: function get() {
                return this._name;
            }
        }, {
            key: "app",
            get: function get() {
                return this._app;
            }
        }]);

        return Page;
    }();

    Page.tagName = 'div';
    chitu.Page = Page;
})(chitu || (chitu = {}));

var PageDisplayerImplement = function () {
    function PageDisplayerImplement() {
        _classCallCheck(this, PageDisplayerImplement);
    }

    _createClass(PageDisplayerImplement, [{
        key: "show",
        value: function show(page, previous) {
            page.element.style.display = 'block';
            if (previous != null) {
                previous.element.style.display = 'none';
            }
            return Promise.resolve();
        }
    }, {
        key: "hide",
        value: function hide(page, previous) {
            page.element.style.display = 'none';
            if (previous != null) {
                previous.element.style.display = 'block';
            }
            return Promise.resolve();
        }
    }]);

    return PageDisplayerImplement;
}();

function ajax(url, options) {
    return __awaiter(this, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var response, responseText, p, text, textObject, isJSONContextType, err;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        _context2.next = 2;
                        return fetch(url, options);

                    case 2:
                        response = _context2.sent;
                        responseText = response.text();
                        p = void 0;

                        if (typeof responseText == 'string') {
                            p = new Promise(function (reslove, reject) {
                                reslove(responseText);
                            });
                        } else {
                            p = responseText;
                        }
                        _context2.next = 8;
                        return responseText;

                    case 8:
                        text = _context2.sent;
                        textObject = void 0;
                        isJSONContextType = (response.headers.get('content-type') || '').indexOf('json') >= 0;

                        if (isJSONContextType) {
                            textObject = JSON.parse(text);
                        } else {
                            textObject = text;
                        }

                        if (!(response.status >= 300)) {
                            _context2.next = 19;
                            break;
                        }

                        err = new Error();

                        err.method = options.method;
                        err.name = "" + response.status;
                        err.message = isJSONContextType ? textObject.Message || textObject.message : textObject;
                        err.message = err.message || response.statusText;
                        throw err;

                    case 19:
                        return _context2.abrupt("return", textObject);

                    case 20:
                    case "end":
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));
}
function callAjax(url, options, service, error) {
    return new Promise(function (reslove, reject) {
        var timeId = void 0;
        if (options.method == 'get') {
            timeId = setTimeout(function () {
                var err = new Error();
                err.name = 'timeout';
                err.message = '网络连接超时';
                reject(err);
                error.fire(service, err);
                clearTimeout(timeId);
            }, chitu.Service.settings.ajaxTimeout * 1000);
        }
        ajax(url, options).then(function (data) {
            reslove(data);
            if (timeId) clearTimeout(timeId);
        }).catch(function (err) {
            reject(err);
            error.fire(service, err);
            if (timeId) clearTimeout(timeId);
        });
    });
}
var chitu;
(function (chitu) {
    var Service = function () {
        function Service() {
            _classCallCheck(this, Service);

            this.error = chitu.Callbacks();
        }

        _createClass(Service, [{
            key: "ajax",
            value: function ajax(url, options) {
                if (options === undefined) options = {};
                var data = options.data;
                var method = options.method;
                var headers = options.headers || {};
                var body = void 0;
                if (data != null) {
                    var is_json = (headers['content-type'] || '').indexOf('json') >= 0;
                    if (is_json) {
                        body = JSON.stringify(data);
                    } else {
                        body = new URLSearchParams();
                        for (var key in data) {
                            body.append(key, data[key]);
                        }
                    }
                }
                return callAjax(url, { headers: headers, body: body, method: method }, this, this.error);
            }
        }]);

        return Service;
    }();

    Service.settings = {
        ajaxTimeout: 30
    };
    chitu.Service = Service;
})(chitu || (chitu = {}));
