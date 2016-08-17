(function(factory) { 
        if (typeof define === 'function' && define['amd']) { 
            define(['jquery'], factory);  
        } else { 
            factory($); 
        } 
    })(function($) {var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var chitu;
(function (chitu) {
    var UrlParser = (function () {
        function UrlParser(pathBase) {
            this.path_string = '';
            this.path_spliter_char = '/';
            this.param_spliter = '?';
            this.name_spliter_char = '.';
            this._actionPath = '';
            this._viewPath = '';
            this._cssPath = '';
            this._parameters = {};
            this._pageName = '';
            this.pathBase = '';
            this.HASH_MINI_LENGTH = 2;
            if (pathBase == null)
                pathBase = 'modules/';
            this.pathBase = pathBase;
        }
        UrlParser.prototype.parseUrl = function (url) {
            if (!url)
                throw chitu.Errors.argumentNull('url');
            var a = document.createElement('a');
            a.href = url;
            if (!a.hash || a.hash.length < this.HASH_MINI_LENGTH)
                throw chitu.Errors.canntParseUrl(url);
            var path;
            var search;
            var param_spliter_index = a.hash.indexOf(this.param_spliter);
            if (param_spliter_index > 0) {
                search = a.hash.substr(param_spliter_index + 1);
                path = a.hash.substring(1, param_spliter_index);
            }
            else {
                path = a.hash.substr(1);
            }
            if (!path)
                throw chitu.Errors.canntParseUrl(url);
            if (search) {
                this._parameters = this.pareeUrlQuery(search);
            }
            var page_name = path.split(this.path_spliter_char).join(this.name_spliter_char);
            var result = {
                actionPath: this.pathBase + path,
                viewPath: this.pathBase + path + '.html',
                values: this._parameters,
                pageName: page_name,
            };
            return result;
        };
        UrlParser.prototype.pareeUrlQuery = function (query) {
            var match, pl = /\+/g, search = /([^&=]+)=?([^&]*)/g, decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };
            var urlParams = {};
            while (match = search.exec(query))
                urlParams[decode(match[1])] = decode(match[2]);
            return urlParams;
        };
        return UrlParser;
    }());
    var PAGE_STACK_MAX_SIZE = 10;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';
    var Application = (function () {
        function Application(config) {
            this.pageCreated = chitu.Callbacks();
            this._runned = false;
            this.container_stack = new Array();
            this.backFail = chitu.Callbacks();
            config = config || {};
            this._config = $.extend({
                container: $.proxy(function (routeData, previous) {
                    return chitu.PageContainerFactory.createInstance({ app: this.app, previous: previous, routeData: routeData });
                }, { app: this })
            }, config);
            var urlParser = new UrlParser(this._config.pathBase);
            this.parseUrl = function (url) {
                return urlParser.parseUrl(url);
            };
        }
        Application.prototype.on_pageCreated = function (page) {
            return chitu.fireCallback(this.pageCreated, this, page);
        };
        Object.defineProperty(Application.prototype, "config", {
            get: function () {
                return this._config;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Application.prototype, "currentPage", {
            get: function () {
                if (this.container_stack.length > 0)
                    return this.container_stack[this.container_stack.length - 1].page;
                return null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Application.prototype, "pageContainers", {
            get: function () {
                return this.container_stack;
            },
            enumerable: true,
            configurable: true
        });
        Application.prototype.createPageContainer = function (routeData) {
            var container = this.config.container(routeData, this.pageContainers[this.pageContainers.length - 1]);
            this.container_stack.push(container);
            if (this.container_stack.length > PAGE_STACK_MAX_SIZE) {
                var c = this.container_stack.shift();
                c.close();
            }
            return container;
        };
        Application.prototype.hashchange = function () {
            if (window.location['skip'] == true) {
                window.location['skip'] = false;
                return;
            }
            var back_deferred;
            if (this.back_deferred && this.back_deferred['processed'] == null) {
                back_deferred = this.back_deferred;
                back_deferred['processed'] = true;
            }
            var hash = window.location.hash;
            if (!hash || hash == this.start_flag_hash) {
                if (!hash)
                    console.log('The url is not contains hash.url is ' + window.location.href);
                if (hash == this.start_flag_hash) {
                    window.history.pushState({}, '', this.start_hash);
                    console.log('The hash is start url, the hash is ' + hash);
                }
                if (back_deferred)
                    back_deferred.reject();
                return;
            }
            if (!this.start_flag_hash) {
                this.start_flag_hash = '#AABBCCDDEEFF';
                this.start_hash = hash;
                window.history.replaceState({}, '', this.start_flag_hash);
                window.history.pushState({}, '', hash);
            }
            var url = location.href;
            var pageInfo = this.parseUrl(url);
            var page = this.getPage(pageInfo.pageName);
            var container = page != null ? page.container : null;
            if (container != null && $.inArray(container, this.container_stack) == this.container_stack.length - 2) {
                var c = this.container_stack.pop();
                if (c.previous != null) {
                    c.previous.show();
                }
                c.close();
            }
            else {
                this.showPage(url);
            }
            if (back_deferred)
                back_deferred.resolve();
        };
        Application.prototype.run = function () {
            if (this._runned)
                return;
            var app = this;
            $.proxy(this.hashchange, this)();
            $(window).bind('hashchange', $.proxy(this.hashchange, this));
            this._runned = true;
        };
        Application.prototype.getPage = function (name) {
            for (var i = this.container_stack.length - 1; i >= 0; i--) {
                var page = this.container_stack[i].page;
                if (page != null && page.name == name)
                    return page;
            }
            return null;
        };
        Application.prototype.showPage = function (url, args) {
            var _this = this;
            if (!url)
                throw chitu.Errors.argumentNull('url');
            var routeData = this.parseUrl(url);
            if (routeData == null) {
                throw chitu.Errors.noneRouteMatched(url);
            }
            routeData.values = $.extend(routeData.values, args || {});
            var previous = this.currentPage;
            var result = $.Deferred();
            var container = this.createPageContainer(routeData);
            container.pageCreated.add(function (sender, page) {
                _this.on_pageCreated(page);
                result.resolve(page);
            });
            container.show();
            if (previous != null)
                previous.container.hide();
            return result;
        };
        Application.prototype.createPageNode = function () {
            var element = document.createElement('div');
            return element;
        };
        Application.prototype.redirect = function (url, args) {
            window.location['skip'] = true;
            window.location.hash = url;
            return this.showPage(url, args);
        };
        Application.prototype.back = function (args) {
            if (args === void 0) { args = undefined; }
            this.back_deferred = $.Deferred();
            if (window.history.length == 0) {
                this.back_deferred.reject();
                this.container_stack.pop();
                chitu.fireCallback(this.backFail, this, {});
                return this.back_deferred;
            }
            window.history.back();
            return this.back_deferred;
        };
        return Application;
    }());
    chitu.Application = Application;
})(chitu || (chitu = {}));
var chitu;
(function (chitu) {
    var OS;
    (function (OS) {
        OS[OS["ios"] = 0] = "ios";
        OS[OS["android"] = 1] = "android";
        OS[OS["other"] = 2] = "other";
    })(OS || (OS = {}));
    var scroll_types = {
        div: 'div',
        iscroll: 'iscroll',
        doc: 'doc'
    };
    var Environment = (function () {
        function Environment() {
        }
        Object.defineProperty(Environment, "osVersion", {
            get: function () {
                return this._version;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Environment, "os", {
            get: function () {
                return Environment._os;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Environment, "isIOS", {
            get: function () {
                return this.os == OS.ios;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Environment, "isAndroid", {
            get: function () {
                return this.os == OS.android;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Environment, "isWeiXin", {
            get: function () {
                var ua = navigator.userAgent.toLowerCase();
                return (ua.match(/MicroMessenger/i)) == 'micromessenger';
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Environment, "isIPhone", {
            get: function () {
                return window.navigator.userAgent.indexOf('iPhone') > 0;
            },
            enumerable: true,
            configurable: true
        });
        Environment.init = (function () {
            var userAgent = navigator.userAgent;
            if (userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0) {
                Environment._os = OS.ios;
                var match = userAgent.match(/iPhone OS\s([0-9\-]*)/);
                if (match) {
                    var major_version = parseInt(match[1], 10);
                    Environment._version = major_version;
                }
            }
            else if (userAgent.indexOf('Android') > 0) {
                Environment._os = OS.android;
                var match = userAgent.match(/Android\s([0-9\.]*)/);
                if (match) {
                    var major_version = parseInt(match[1], 10);
                    Environment._version = major_version;
                }
            }
            else {
                Environment._os = OS.other;
            }
        })();
        return Environment;
    }());
    var ControlCollection = (function () {
        function ControlCollection(parent) {
            this.parent = parent;
            this.items = [];
        }
        ControlCollection.prototype.add = function (control) {
            if (control == null)
                throw chitu.Errors.argumentNull('control');
            this[this.length] = this.items[this.items.length] = control;
            control.parent = this.parent;
        };
        Object.defineProperty(ControlCollection.prototype, "length", {
            get: function () {
                return this.items.length;
            },
            enumerable: true,
            configurable: true
        });
        ControlCollection.prototype.item = function (indexOrName) {
            if (typeof (indexOrName) == 'number')
                return this.items[indexOrName];
            var name = indexOrName;
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i].name == name)
                    return this.items[i];
            }
            return null;
        };
        return ControlCollection;
    }());
    chitu.ControlCollection = ControlCollection;
    var Control = (function () {
        function Control(element) {
            this._children = new ControlCollection(this);
            this.load = chitu.Callbacks();
            if (element == null)
                throw chitu.Errors.argumentNull('element');
            this._element = element;
            this._name = $(element).attr('name');
            this.createChildren(element, this);
            $(element).data('control', this);
        }
        ;
        Control.prototype.createChildren = function (element, parent) {
            for (var i = 0; i < element.childNodes.length; i++) {
                if (element.childNodes[i].nodeType != 1)
                    continue;
                var child_control = this.createChild(element.childNodes[i], parent);
                if (child_control == null)
                    continue;
                this.children.add(child_control);
            }
        };
        Control.prototype.createChild = function (element, parent) {
            var child_control = Control.createControl(element);
            if (child_control)
                child_control._parent = parent;
            return child_control;
        };
        Object.defineProperty(Control.prototype, "visible", {
            get: function () {
                var display = this.element.style.display;
                return display != 'none';
            },
            set: function (value) {
                if (value == true)
                    this.element.style.display = 'block';
                else
                    this.element.style.display = 'none';
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "element", {
            get: function () {
                return this._element;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "children", {
            get: function () {
                return this._children;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "name", {
            get: function () {
                return this._name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Control.prototype, "parent", {
            get: function () {
                return this._parent;
            },
            enumerable: true,
            configurable: true
        });
        Control.prototype.on_load = function (args) {
            var promises = new Array();
            promises.push(chitu.fireCallback(this.load, this, args));
            for (var i = 0; i < this.children.length; i++) {
                var promise = this.children.item(i).on_load(args);
                if (chitu.Utility.isDeferred(promise))
                    promises.push(promise);
            }
            var result = $.when.apply($, promises);
            return result;
        };
        Control.register = function (tagName, createControlMethod) {
            Control.ControlTags[tagName] = createControlMethod;
        };
        Control.createControl = function (element) {
            if (element == null)
                throw chitu.Errors.argumentNull('element');
            var tagName = element.tagName;
            var createControlMethod = Control.ControlTags[tagName];
            if (createControlMethod == null)
                return null;
            var instance;
            if (createControlMethod.prototype != null)
                instance = new createControlMethod(element);
            else
                instance = createControlMethod(element);
            return instance;
        };
        Control.ControlTags = {};
        return Control;
    }());
    chitu.Control = Control;
})(chitu || (chitu = {}));
var chitu;
(function (chitu) {
    var Errors = (function () {
        function Errors() {
        }
        Errors.argumentNull = function (paramName) {
            var msg = chitu.Utility.format('The argument "{0}" cannt be null.', paramName);
            return new Error(msg);
        };
        Errors.modelFileExpecteFunction = function (script) {
            var msg = chitu.Utility.format('The eval result of script file "{0}" is expected a function.', script);
            return new Error(msg);
        };
        Errors.paramTypeError = function (paramName, expectedType) {
            var msg = chitu.Utility.format('The param "{0}" is expected "{1}" type.', paramName, expectedType);
            return new Error(msg);
        };
        Errors.paramError = function (msg) {
            return new Error(msg);
        };
        Errors.viewNodeNotExists = function (name) {
            var msg = chitu.Utility.format('The view node "{0}" is not exists.', name);
            return new Error(msg);
        };
        Errors.pathPairRequireView = function (index) {
            var msg = chitu.Utility.format('The view value is required for path pair, but the item with index "{0}" is miss it.', index);
            return new Error(msg);
        };
        Errors.notImplemented = function (name) {
            var msg = chitu.Utility.format('The method "{0}" is not implemented.', name);
            return new Error(msg);
        };
        Errors.routeExists = function (name) {
            var msg = chitu.Utility.format('Route named "{0}" is exists.', name);
            return new Error(msg);
        };
        Errors.ambiguityRouteMatched = function (url, routeName1, routeName2) {
            var msg = chitu.Utility.format('Ambiguity route matched, {0} is match in {1} and {2}.', url, routeName1, routeName2);
            return new Error(msg);
        };
        Errors.noneRouteMatched = function (url) {
            var msg = chitu.Utility.format('None route matched with url "{0}".', url);
            var error = new Error(msg);
            return error;
        };
        Errors.emptyStack = function () {
            return new Error('The stack is empty.');
        };
        Errors.canntParseUrl = function (url) {
            var msg = chitu.Utility.format('Can not parse the url "{0}" to route data.', url);
            return new Error(msg);
        };
        Errors.routeDataRequireController = function () {
            var msg = 'The route data does not contains a "controller" file.';
            return new Error(msg);
        };
        Errors.routeDataRequireAction = function () {
            var msg = 'The route data does not contains a "action" file.';
            return new Error(msg);
        };
        Errors.parameterRequireField = function (fileName, parameterName) {
            var msg = chitu.Utility.format('Parameter {1} does not contains field {0}.', fileName, parameterName);
            return new Error(msg);
        };
        Errors.viewCanntNull = function () {
            var msg = 'The view or viewDeferred of the page cannt null.';
            return new Error(msg);
        };
        Errors.createPageFail = function (pageName) {
            var msg = chitu.Utility.format('Create page "{0}" fail.', pageName);
            return new Error(msg);
        };
        Errors.actionTypeError = function (pageName) {
            var msg = chitu.Utility.format('Export of \'{0}\' page is expect chitu.Page type.', pageName);
            return new Error(msg);
        };
        Errors.scrollerElementNotExists = function () {
            var msg = "Scroller element is not exists.";
            return new Error(msg);
        };
        return Errors;
    }());
    chitu.Errors = Errors;
})(chitu || (chitu = {}));
var chitu;
(function (chitu) {
    var rnotwhite = (/\S+/g);
    var optionsCache = {};
    function createOptions(options) {
        var object = optionsCache[options] = {};
        jQuery.each(options.match(rnotwhite) || [], function (_, flag) {
            object[flag] = true;
        });
        return object;
    }
    var Callback = (function () {
        function Callback(source) {
            this.source = source;
        }
        Callback.prototype.add = function (func) {
            this.source.add(func);
        };
        Callback.prototype.remove = function (func) {
            this.source.remove(func);
        };
        Callback.prototype.has = function (func) {
            return this.source.has(func);
        };
        Callback.prototype.fireWith = function (context, args) {
            return this.source.fireWith(context, args);
        };
        Callback.prototype.fire = function (arg1, arg2, arg3, arg4) {
            return this.source.fire(arg1, arg2, arg3);
        };
        return Callback;
    }());
    chitu.Callback = Callback;
    function Callbacks(options) {
        if (options === void 0) { options = null; }
        options = typeof options === "string" ?
            (optionsCache[options] || createOptions(options)) :
            jQuery.extend({}, options);
        var memory, fired, firing, firingStart, firingLength, firingIndex, list = [], stack = !options.once && [], fire = function (data) {
            memory = options.memory && data;
            fired = true;
            firingIndex = firingStart || 0;
            firingStart = 0;
            firingLength = list.length;
            firing = true;
            for (; list && firingIndex < firingLength; firingIndex++) {
                var result = list[firingIndex].apply(data[0], data[1]);
                if (result != null) {
                    data[0].results.push(result);
                }
                if (result === false && options.stopOnFalse) {
                    memory = false;
                    break;
                }
            }
            firing = false;
            if (list) {
                if (stack) {
                    if (stack.length) {
                        fire(stack.shift());
                    }
                }
                else if (memory) {
                    list = [];
                }
                else {
                    self.disable();
                }
            }
        }, self = {
            results: [],
            add: function () {
                if (list) {
                    var start = list.length;
                    (function add(args) {
                        jQuery.each(args, function (_, arg) {
                            var type = jQuery.type(arg);
                            if (type === "function") {
                                if (!options.unique || !self.has(arg)) {
                                    list.push(arg);
                                }
                            }
                            else if (arg && arg.length && type !== "string") {
                                add(arg);
                            }
                        });
                    })(arguments);
                    if (firing) {
                        firingLength = list.length;
                    }
                    else if (memory) {
                        firingStart = start;
                        fire(memory);
                    }
                }
                return this;
            },
            remove: function () {
                if (list) {
                    jQuery.each(arguments, function (_, arg) {
                        var index;
                        while ((index = jQuery.inArray(arg, list, index)) > -1) {
                            list.splice(index, 1);
                            if (firing) {
                                if (index <= firingLength) {
                                    firingLength--;
                                }
                                if (index <= firingIndex) {
                                    firingIndex--;
                                }
                            }
                        }
                    });
                }
                return this;
            },
            has: function (fn) {
                return fn ? jQuery.inArray(fn, list) > -1 : !!(list && list.length);
            },
            empty: function () {
                list = [];
                firingLength = 0;
                return this;
            },
            disable: function () {
                list = stack = memory = undefined;
                return this;
            },
            disabled: function () {
                return !list;
            },
            lock: function () {
                stack = undefined;
                if (!memory) {
                    self.disable();
                }
                return this;
            },
            locked: function () {
                return !stack;
            },
            fireWith: function (context, args) {
                context.results = [];
                if (list && (!fired || stack)) {
                    args = args || [];
                    args = [context, args.slice ? args.slice() : args];
                    if (firing) {
                        stack.push(args);
                    }
                    else {
                        fire(args);
                    }
                }
                return context.results;
            },
            fire: function () {
                return self.fireWith(this, arguments);
            },
            fired: function () {
                return !!fired;
            },
            count: function () {
                return list.length;
            }
        };
        return new chitu.Callback(self);
    }
    chitu.Callbacks = Callbacks;
    function fireCallback(callback, sender, args) {
        var context = sender;
        var results = callback.fireWith(context, [sender, args]);
        var deferreds = [];
        for (var i = 0; i < results.length; i++) {
            if (chitu.Utility.isDeferred(results[i]))
                deferreds.push(results[i]);
        }
        if (deferreds.length == 0)
            return $.Deferred().resolve();
        return $.when.apply($, deferreds);
    }
    chitu.fireCallback = fireCallback;
})(chitu || (chitu = {}));
var chitu;
(function (chitu) {
    var u = chitu.Utility;
    var e = chitu.Errors;
    var LOAD_COMPLETE_HTML = '<span style="padding-left:10px;">数据已全部加载完毕</span>';
    (function (PageLoadType) {
        PageLoadType[PageLoadType["init"] = 0] = "init";
        PageLoadType[PageLoadType["scroll"] = 1] = "scroll";
        PageLoadType[PageLoadType["pullDown"] = 2] = "pullDown";
        PageLoadType[PageLoadType["pullUp"] = 3] = "pullUp";
        PageLoadType[PageLoadType["custom"] = 4] = "custom";
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
    (function (ScrollType) {
        ScrollType[ScrollType["IScroll"] = 0] = "IScroll";
        ScrollType[ScrollType["Div"] = 1] = "Div";
        ScrollType[ScrollType["Document"] = 2] = "Document";
    })(chitu.ScrollType || (chitu.ScrollType = {}));
    var ScrollType = chitu.ScrollType;
    var Page = (function (_super) {
        __extends(Page, _super);
        function Page(args) {
            var _this = this;
            _super.call(this, args.element);
            this._loadViewModelResult = null;
            this._openResult = null;
            this._hideResult = null;
            this._showTime = Page.animationTime;
            this._hideTime = Page.animationTime;
            this._enableScrollLoad = false;
            this.is_closed = false;
            this.isActionExecuted = false;
            this.closing = chitu.Callbacks();
            this.closed = chitu.Callbacks();
            this.hiding = chitu.Callbacks();
            this.hidden = chitu.Callbacks();
            if (args == null)
                throw chitu.Errors.argumentNull('args');
            $(this.element).data('page', this);
            this._pageContainer = args.container;
            this._routeData = args.routeData;
            this._pageContainer.closing.add(function () { return _this.on_closing(_this.routeData.values); });
            this._pageContainer.closed.add(function () { return _this.on_closed(_this.routeData.values); });
        }
        Object.defineProperty(Page.prototype, "routeData", {
            get: function () {
                return this._routeData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Page.prototype, "name", {
            get: function () {
                if (!this._name)
                    this._name = this.routeData.pageName;
                return this._name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Page.prototype, "visible", {
            get: function () {
                return $(this.element).is(':visible');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Page.prototype, "container", {
            get: function () {
                return this._pageContainer;
            },
            enumerable: true,
            configurable: true
        });
        Page.prototype.hide = function () {
            return this.container.hide();
        };
        Page.prototype.findControl = function (name) {
            if (!name)
                throw chitu.Errors.argumentNull('name');
            var stack = new Array();
            for (var i = 0; i < this.children.length; i++) {
                var control = this.children[i];
                stack.push(control);
            }
            while (stack.length > 0) {
                var control = stack.pop();
                if (control.name == name)
                    return control;
                for (var i = 0; i < control.children.length; i++)
                    stack.push(control.children[i]);
            }
            return null;
        };
        Page.prototype.fireEvent = function (callback, args) {
            return chitu.fireCallback(callback, this, args);
        };
        Page.prototype.on_closing = function (args) {
            return this.fireEvent(this.closing, args);
        };
        Page.prototype.on_closed = function (args) {
            return this.fireEvent(this.closed, args);
        };
        Page.prototype.on_hiding = function (args) {
            return this.fireEvent(this.hiding, args);
        };
        Page.prototype.on_hidden = function (args) {
            return this.fireEvent(this.hidden, args);
        };
        Page.animationTime = 300;
        return Page;
    }(chitu.Control));
    chitu.Page = Page;
})(chitu || (chitu = {}));
;
var chitu;
(function (chitu) {
    var ScrollArguments = (function () {
        function ScrollArguments() {
        }
        return ScrollArguments;
    }());
    var PageContainerTypeClassNames = (function () {
        function PageContainerTypeClassNames() {
            this.Div = 'div';
            this.IScroll = 'iscroll';
            this.Document = 'doc';
        }
        return PageContainerTypeClassNames;
    }());
    var PageContainer = (function () {
        function PageContainer(params) {
            this.animationTime = 300;
            this._previousOffsetRate = 0.5;
            this.showing = chitu.Callbacks();
            this.shown = chitu.Callbacks();
            this.closing = chitu.Callbacks();
            this.closed = chitu.Callbacks();
            this.pageCreated = chitu.Callbacks();
            this.is_closing = false;
            params = $.extend({ enableGesture: true, enableSwipeClose: true }, params);
            this._node = this.createNode();
            this._loading = this.createLoading(this._node);
            this._previous = params.previous;
            this._app = params.app;
            this._routeData = params.routeData;
            this.createPage(params.routeData);
        }
        PageContainer.prototype.on_pageCreated = function (page) {
            return chitu.fireCallback(this.pageCreated, this, page);
        };
        PageContainer.prototype.on_showing = function (args) {
            return chitu.fireCallback(this.showing, this, args);
        };
        PageContainer.prototype.on_shown = function (args) {
            return chitu.fireCallback(this.shown, this, args);
        };
        PageContainer.prototype.on_closing = function (args) {
            return chitu.fireCallback(this.closing, this, args);
        };
        PageContainer.prototype.on_closed = function (args) {
            return chitu.fireCallback(this.closed, this, args);
        };
        PageContainer.prototype.createNode = function () {
            this._node = document.createElement('div');
            this._node.className = 'page-container';
            this._node.style.display = 'none';
            document.body.appendChild(this._node);
            return this._node;
        };
        PageContainer.prototype.createLoading = function (parent) {
            var loading_element = document.createElement('div');
            loading_element.className = 'page-loading';
            loading_element.innerHTML = '<div class="spin"><i class="icon-spinner icon-spin"></i><div>';
            parent.appendChild(loading_element);
            return loading_element;
        };
        PageContainer.prototype.show = function () {
            if (this.visible == true)
                return;
            $(this._node).show();
        };
        PageContainer.prototype.hide = function () {
            if (this.visible == false)
                return;
            $(this._node).hide();
        };
        PageContainer.prototype.close = function () {
            this.on_closing(this.routeData.values);
            this.is_closing = true;
            $(this._node).remove();
            this.on_closed(this.routeData.values);
        };
        PageContainer.prototype.showLoading = function () {
            this._loading.style.display = 'block';
        };
        PageContainer.prototype.hideLoading = function () {
            this._loading.style.display = 'none';
        };
        Object.defineProperty(PageContainer.prototype, "visible", {
            get: function () {
                return $(this._node).is(':visible');
            },
            set: function (value) {
                if (value)
                    $(this._node).show();
                else
                    $(this._node).hide();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PageContainer.prototype, "element", {
            get: function () {
                return this._node;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PageContainer.prototype, "page", {
            get: function () {
                return this._currentPage;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PageContainer.prototype, "previous", {
            get: function () {
                return this._previous;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PageContainer.prototype, "routeData", {
            get: function () {
                return this._routeData;
            },
            enumerable: true,
            configurable: true
        });
        PageContainer.prototype.createActionDeferred = function (routeData) {
            var url = routeData.actionPath;
            var result = $.Deferred();
            requirejs([url], function (Type) {
                if (!Type) {
                    console.warn(chitu.Utility.format('加载活动“{0}”失败。', routeData.pageName));
                    result.reject();
                    return;
                }
                if (!$.isFunction(Type) || Type.prototype == null)
                    throw chitu.Errors.actionTypeError(routeData.pageName);
                result.resolve(Type);
            }, function (err) { return result.reject(err); });
            return result;
        };
        PageContainer.prototype.createViewDeferred = function (url) {
            var self = this;
            var result = $.Deferred();
            var http = 'http://';
            if (url.substr(0, http.length).toLowerCase() == http) {
                $.ajax({ url: url })
                    .done(function (html) {
                    if (html != null)
                        result.resolve(html);
                    else
                        result.reject();
                })
                    .fail(function (err) { return result.reject(err); });
            }
            else {
                requirejs(['text!' + url], function (html) {
                    if (html != null)
                        result.resolve(html);
                    else
                        result.reject();
                }, function (err) {
                    result.reject(err);
                });
            }
            return result;
        };
        PageContainer.prototype.createPage = function (routeData) {
            var _this = this;
            var view_deferred;
            if (routeData.viewPath)
                view_deferred = this.createViewDeferred(routeData.viewPath);
            else
                view_deferred = $.Deferred().resolve("");
            var action_deferred = this.createActionDeferred(routeData);
            var result = $.Deferred();
            $.when(action_deferred, view_deferred).done(function (pageType, html) {
                var pageElement = document.createElement('page');
                pageElement.innerHTML = html;
                pageElement.setAttribute('name', routeData.pageName);
                var page = new pageType({ container: _this, element: pageElement, routeData: routeData });
                if (!(page instanceof chitu.Page))
                    throw chitu.Errors.actionTypeError(routeData.pageName);
                _this._currentPage = page;
                _this.element.appendChild(page.element);
                _this.on_pageCreated(page);
                result.resolve(page);
                page.on_load(routeData.values).done(function () {
                    _this.hideLoading();
                });
            }).fail(function (err) {
                result.reject();
                console.error(err);
                throw chitu.Errors.createPageFail(routeData.pageName);
            });
            if (routeData.resource != null && routeData.resource.length > 0) {
                chitu.Utility.loadjs.apply(chitu.Utility, routeData.resource);
            }
            return result;
        };
        return PageContainer;
    }());
    chitu.PageContainer = PageContainer;
    var PageContainerFactory = (function () {
        function PageContainerFactory(app) {
            this._app = app;
        }
        PageContainerFactory.createInstance = function (params) {
            var c = new PageContainer(params);
            return c;
        };
        return PageContainerFactory;
    }());
    chitu.PageContainerFactory = PageContainerFactory;
})(chitu || (chitu = {}));
var chitu;
(function (chitu) {
    var e = chitu.Errors;
    var Utility = (function () {
        function Utility() {
        }
        Utility.isType = function (targetType, obj) {
            for (var key in targetType.prototype) {
                if (obj[key] === undefined)
                    return false;
            }
            return true;
        };
        Utility.isDeferred = function (obj) {
            if (obj == null)
                return false;
            if (obj.pipe != null && obj.always != null && obj.done != null)
                return true;
            return false;
        };
        Utility.format = function (source) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            for (var i = 0; i < params.length; i++) {
                source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function () {
                    return params[i];
                });
            }
            return source;
        };
        Utility.fileName = function (url, withExt) {
            if (!url)
                throw e.argumentNull('url');
            withExt = withExt || true;
            url = url.replace('http://', '/');
            var filename = url.replace(/^.*[\\\/]/, '');
            if (withExt === true) {
                var arr = filename.split('.');
                filename = arr[0];
            }
            return filename;
        };
        Utility.log = function (msg, args) {
            if (args === void 0) { args = []; }
            if (!window.console)
                return;
            if (args == null) {
                console.log(msg);
                return;
            }
            var txt = this.format.apply(this, arguments);
            console.log(txt);
        };
        Utility.loadjs = function () {
            var modules = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                modules[_i - 0] = arguments[_i];
            }
            var deferred = $.Deferred();
            requirejs(modules, function () {
                var args = [];
                for (var i = 0; i < arguments.length; i++)
                    args[i] = arguments[i];
                deferred.resolve.apply(deferred, args);
            });
            return deferred;
        };
        return Utility;
    }());
    chitu.Utility = Utility;
})(chitu || (chitu = {}));

window['chitu'] = window['chitu'] || chitu 
                    
 return chitu;
    });