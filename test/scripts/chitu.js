(function(factory) { 
        if (typeof define === 'function' && define['amd']) { 
            define(['jquery'], factory);  
        } else { 
            factory($); 
        } 
    })(function($) {var chitu;
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
            this._config = config;
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
            var previous_container = this.pageContainers[this.pageContainers.length - 1];
            var container = chitu.PageFactory.createInstance({ app: this, routeData: routeData, previous: previous_container });
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
            var page = this.getPageView(pageInfo.pageName);
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
        Application.prototype.getPageView = function (name) {
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
    var Page = (function () {
        function Page(params) {
            this.animationTime = 300;
            this.showing = chitu.Callbacks();
            this.shown = chitu.Callbacks();
            this.hiding = chitu.Callbacks();
            this.hidden = chitu.Callbacks();
            this.closing = chitu.Callbacks();
            this.closed = chitu.Callbacks();
            this.pageCreated = chitu.Callbacks();
            this.is_closing = false;
            this._node = this.createNode();
            this._previous = params.previous;
            this._app = params.app;
            this._routeData = params.routeData;
            this.createPage(params.routeData);
        }
        Page.prototype.on_pageCreated = function (page) {
            return chitu.fireCallback(this.pageCreated, this, page);
        };
        Page.prototype.on_showing = function (args) {
            return chitu.fireCallback(this.showing, this, args);
        };
        Page.prototype.on_shown = function (args) {
            return chitu.fireCallback(this.shown, this, args);
        };
        Page.prototype.on_hiding = function (args) {
            return chitu.fireCallback(this.hiding, this, args);
        };
        Page.prototype.on_hidden = function (args) {
            return chitu.fireCallback(this.hidden, this, args);
        };
        Page.prototype.on_closing = function (args) {
            return chitu.fireCallback(this.closing, this, args);
        };
        Page.prototype.on_closed = function (args) {
            return chitu.fireCallback(this.closed, this, args);
        };
        Page.prototype.createNode = function () {
            this._node = document.createElement('div');
            this._node.className = 'page-container';
            this._node.style.display = 'none';
            document.body.appendChild(this._node);
            return this._node;
        };
        Page.prototype.show = function () {
            if (this.visible == true)
                return;
            this.on_showing(this.routeData.values);
            $(this._node).show();
            this.on_shown(this.routeData.values);
        };
        Page.prototype.hide = function () {
            if (this.visible == false)
                return;
            $(this._node).hide();
        };
        Page.prototype.close = function () {
            this.on_closing(this.routeData.values);
            this.is_closing = true;
            $(this._node).remove();
            this.on_closed(this.routeData.values);
        };
        Object.defineProperty(Page.prototype, "visible", {
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
        Object.defineProperty(Page.prototype, "element", {
            get: function () {
                return this._node;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Page.prototype, "page", {
            get: function () {
                return this._currentPage;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Page.prototype, "previous", {
            get: function () {
                return this._previous;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Page.prototype, "routeData", {
            get: function () {
                return this._routeData;
            },
            enumerable: true,
            configurable: true
        });
        Page.prototype.createActionDeferred = function (routeData) {
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
        Page.prototype.createViewDeferred = function (url) {
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
        Page.prototype.createPage = function (routeData) {
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
                if (!(page instanceof chitu.Pageview))
                    throw chitu.Errors.actionTypeError(routeData.pageName);
                _this._currentPage = page;
                _this.element.appendChild(page.element);
                _this.on_pageCreated(page);
                result.resolve(page);
                page.on_load(routeData.values).done(function () {
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
        return Page;
    }());
    chitu.Page = Page;
    var PageFactory = (function () {
        function PageFactory(app) {
            this._app = app;
        }
        PageFactory.createInstance = function (params) {
            var c = new Page(params);
            return c;
        };
        return PageFactory;
    }());
    chitu.PageFactory = PageFactory;
})(chitu || (chitu = {}));
var chitu;
(function (chitu) {
    var Pageview = (function () {
        function Pageview(args) {
            var _this = this;
            this._openResult = null;
            this._hideResult = null;
            this.is_closed = false;
            this.load = chitu.Callbacks();
            this.closing = chitu.Callbacks();
            this.closed = chitu.Callbacks();
            this.hiding = chitu.Callbacks();
            this.hidden = chitu.Callbacks();
            if (args == null)
                throw chitu.Errors.argumentNull('args');
            this._element = args.element;
            this._pageContainer = args.container;
            this._routeData = args.routeData;
            $(this.element).data('page', this);
            this._pageContainer.closing.add(function () { return _this.on_closing(_this.routeData.values); });
            this._pageContainer.closed.add(function () { return _this.on_closed(_this.routeData.values); });
        }
        Object.defineProperty(Pageview.prototype, "element", {
            get: function () {
                return this._element;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pageview.prototype, "routeData", {
            get: function () {
                return this._routeData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pageview.prototype, "name", {
            get: function () {
                if (!this._name)
                    this._name = this.routeData.pageName;
                return this._name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pageview.prototype, "visible", {
            get: function () {
                return $(this.element).is(':visible');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pageview.prototype, "container", {
            get: function () {
                return this._pageContainer;
            },
            enumerable: true,
            configurable: true
        });
        Pageview.prototype.hide = function () {
            return this.container.hide();
        };
        Pageview.prototype.on_load = function (args) {
            return this.fireEvent(this.load, args);
        };
        Pageview.prototype.fireEvent = function (callback, args) {
            return chitu.fireCallback(callback, this, args);
        };
        Pageview.prototype.on_closing = function (args) {
            return this.fireEvent(this.closing, args);
        };
        Pageview.prototype.on_closed = function (args) {
            return this.fireEvent(this.closed, args);
        };
        Pageview.prototype.on_hiding = function (args) {
            return this.fireEvent(this.hiding, args);
        };
        Pageview.prototype.on_hidden = function (args) {
            return this.fireEvent(this.hidden, args);
        };
        return Pageview;
    }());
    chitu.Pageview = Pageview;
})(chitu || (chitu = {}));
;
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

var __extends=this&&this.__extends||function(a,b){function c(){this.constructor=a}for(var d in b)b.hasOwnProperty(d)&&(a[d]=b[d]);a.prototype=null===b?Object.create(b):(c.prototype=b.prototype,new c)},chitu;!function(a){var b=function(){function b(a){this.path_string="",this.path_spliter_char="/",this.param_spliter="?",this.name_spliter_char=".",this._actionPath="",this._viewPath="",this._cssPath="",this._parameters={},this._pageName="",this.pathBase="",this.HASH_MINI_LENGTH=2,null==a&&(a="modules/"),this.pathBase=a}return b.prototype.parseUrl=function(b){if(!b)throw a.Errors.argumentNull("url");var c=document.createElement("a");if(c.href=b,!c.hash||c.hash.length<this.HASH_MINI_LENGTH)throw a.Errors.canntParseUrl(b);var d,e,f=c.hash.indexOf(this.param_spliter);if(f>0?(e=c.hash.substr(f+1),d=c.hash.substring(1,f)):d=c.hash.substr(1),!d)throw a.Errors.canntParseUrl(b);e&&(this._parameters=this.pareeUrlQuery(e));var g=d.split(this.path_spliter_char).join(this.name_spliter_char),h={actionPath:this.pathBase+d,viewPath:this.pathBase+d+".html",values:this._parameters,pageName:g};return h},b.prototype.pareeUrlQuery=function(a){for(var b,c=/\+/g,d=/([^&=]+)=?([^&]*)/g,e=function(a){return decodeURIComponent(a.replace(c," "))},f={};b=d.exec(a);)f[e(b[1])]=e(b[2]);return f},b}(),c=10,d=function(){function d(c){this.pageCreated=a.Callbacks(),this._runned=!1,this.container_stack=new Array,this.backFail=a.Callbacks(),c=c||{},this._config=$.extend({openSwipe:function(b){return a.SwipeDirection.None},closeSwipe:function(){return a.SwipeDirection.None},container:$.proxy(function(b,c){return a.PageContainerFactory.createInstance({app:this.app,previous:c,routeData:b})},{app:this})},c);var d=new b(this._config.pathBase);this.parseUrl=function(a){return d.parseUrl(a)}}return d.prototype.on_pageCreated=function(b){return a.fireCallback(this.pageCreated,this,b)},Object.defineProperty(d.prototype,"config",{get:function(){return this._config},enumerable:!0,configurable:!0}),d.prototype.currentPage=function(){return this.container_stack.length>0?this.container_stack[this.container_stack.length-1].page:null},Object.defineProperty(d.prototype,"pageContainers",{get:function(){return this.container_stack},enumerable:!0,configurable:!0}),d.prototype.createPageContainer=function(b){var d=this.config.container(b,this.pageContainers[this.pageContainers.length-1]);if(this.container_stack.push(d),this.container_stack.length>c){var e=this.container_stack.shift();e.close(a.SwipeDirection.None)}return d},d.prototype.hashchange=function(){if(1==window.location.skip)return void(window.location.skip=!1);var b;this.back_deferred&&null==this.back_deferred.processed&&(b=this.back_deferred,b.processed=!0);var c=window.location.hash;if(!c||c==this.start_flag_hash)return c||console.log("The url is not contains hash.url is "+window.location.href),c==this.start_flag_hash&&(window.history.pushState({},"",this.start_hash),console.log("The hash is start url, the hash is "+c)),void(b&&b.reject());this.start_flag_hash||(this.start_flag_hash="#AABBCCDDEEFF",this.start_hash=c,window.history.replaceState({},"",this.start_flag_hash),window.history.pushState({},"",c));var d=location.href,e=this.parseUrl(d),f=this.getPage(e.pageName),g=null!=f?f.container:null;if(null!=g&&$.inArray(g,this.container_stack)==this.container_stack.length-2){var h=this.container_stack.pop(),i=this.config.closeSwipe(h.page.routeData);null!=h.previous&&h.previous.show(a.SwipeDirection.None),h.close(i)}else this.showPage(d);b&&b.resolve()},d.prototype.run=function(){if(!this._runned){$.proxy(this.hashchange,this)(),$(window).bind("hashchange",$.proxy(this.hashchange,this)),this._runned=!0}},d.prototype.getPage=function(a){for(var b=this.container_stack.length-1;b>=0;b--){var c=this.container_stack[b].page;if(null!=c&&c.name==a)return c}return null},d.prototype.showPage=function(b,c){var d=this;if(!b)throw a.Errors.argumentNull("url");var e=this.parseUrl(b);if(null==e)throw a.Errors.noneRouteMatched(b);e.values=$.extend(e.values,c||{});var f=$.Deferred(),g=this.createPageContainer(e);g.pageCreated.add(function(a,b){d.on_pageCreated(b),f.resolve(b)});var h=this.config.openSwipe(e);return g.show(h),f},d.prototype.createPageNode=function(){var a=document.createElement("div");return a},d.prototype.redirect=function(a,b){return window.location.skip=!0,window.location.hash=a,this.showPage(a,b)},d.prototype.back=function(b){return void 0===b&&(b=void 0),this.back_deferred=$.Deferred(),0==window.history.length?(this.back_deferred.reject(),a.fireCallback(this.backFail,this,{}),this.back_deferred):(window.history.back(),this.back_deferred)},d}();a.Application=d}(chitu||(chitu={}));var chitu;!function(a){var b;!function(a){a[a.ios=0]="ios",a[a.android=1]="android",a[a.other=2]="other"}(b||(b={}));var c={div:"div",iscroll:"iscroll",doc:"doc"},d=function(){function a(){}return Object.defineProperty(a,"osVersion",{get:function(){return this._version},enumerable:!0,configurable:!0}),Object.defineProperty(a,"os",{get:function(){return a._os},enumerable:!0,configurable:!0}),Object.defineProperty(a,"isIOS",{get:function(){return this.os==b.ios},enumerable:!0,configurable:!0}),Object.defineProperty(a,"isAndroid",{get:function(){return this.os==b.android},enumerable:!0,configurable:!0}),Object.defineProperty(a,"isWeiXin",{get:function(){var a=navigator.userAgent.toLowerCase();return"micromessenger"==a.match(/MicroMessenger/i)},enumerable:!0,configurable:!0}),Object.defineProperty(a,"isIPhone",{get:function(){return window.navigator.userAgent.indexOf("iPhone")>0},enumerable:!0,configurable:!0}),a.init=function(){var c=navigator.userAgent;if(c.indexOf("iPhone")>0||c.indexOf("iPad")>0){a._os=b.ios;var d=c.match(/iPhone OS\s([0-9\-]*)/);if(d){var e=parseInt(d[1],10);a._version=e}}else if(c.indexOf("Android")>0){a._os=b.android;var d=c.match(/Android\s([0-9\.]*)/);if(d){var e=parseInt(d[1],10);a._version=e}}else a._os=b.other}(),a}(),e=function(){function b(a){this.parent=a,this.items=[]}return b.prototype.add=function(b){if(null==b)throw a.Errors.argumentNull("control");this[this.length]=this.items[this.items.length]=b,b.parent=this.parent},Object.defineProperty(b.prototype,"length",{get:function(){return this.items.length},enumerable:!0,configurable:!0}),b.prototype.item=function(a){if("number"==typeof a)return this.items[a];for(var b=a,c=0;c<this.items.length;c++)if(this.items[c].name==b)return this.items[c];return null},b}();a.ControlCollection=e;var f=function(){function b(b){if(this._children=new e(this),this.load=a.Callbacks(),null==b)throw a.Errors.argumentNull("element");this._element=b,this._name=$(b).attr("name"),this.createChildren(b,this),$(b).data("control",this)}return b.prototype.createChildren=function(a,b){for(var c=0;c<a.childNodes.length;c++)if(1==a.childNodes[c].nodeType){var d=this.createChild(a.childNodes[c],b);null!=d&&this.children.add(d)}},b.prototype.createChild=function(a,c){var d=b.createControl(a);return d&&(d._parent=c),d},Object.defineProperty(b.prototype,"visible",{get:function(){var a=this.element.style.display;return"none"!=a},set:function(a){1==a?this.element.style.display="block":this.element.style.display="none"},enumerable:!0,configurable:!0}),Object.defineProperty(b.prototype,"element",{get:function(){return this._element},enumerable:!0,configurable:!0}),Object.defineProperty(b.prototype,"children",{get:function(){return this._children},enumerable:!0,configurable:!0}),Object.defineProperty(b.prototype,"name",{get:function(){return this._name},enumerable:!0,configurable:!0}),Object.defineProperty(b.prototype,"parent",{get:function(){return this._parent},enumerable:!0,configurable:!0}),b.prototype.on_load=function(b){var c=new Array;c.push(a.fireCallback(this.load,this,b));for(var d=0;d<this.children.length;d++){var e=this.children.item(d).on_load(b);a.Utility.isDeferred(e)&&c.push(e)}var f=$.when.apply($,c);return f},b.register=function(a,c){b.ControlTags[a]=c},b.createControl=function(c){if(null==c)throw a.Errors.argumentNull("element");var d=c.tagName,e=b.ControlTags[d];if(null==e)return null;var f;return f=null!=e.prototype?new e(c):e(c)},b.ControlTags={},b}();a.Control=f;var g=function(a){function b(b,c){a.call(this,b)}return __extends(b,a),b}(f);a.PageHeader=g;var h=function(a){function b(b,c){a.call(this,b)}return __extends(b,a),b}(f);a.PageFooter=h;var i=function(b){function e(c){b.call(this,c),this.scroll=a.Callbacks(),this.scrollEnd=a.Callbacks()}return __extends(e,b),e.prototype.on_scrollEnd=function(b){return a.fireCallback(this.scrollEnd,this,b)},e.prototype.on_scroll=function(b){return a.fireCallback(this.scroll,this,b)},e.createInstance=function(a,b){var e=$(a).attr("scroll-type");return null!=e?e==c.doc?new j(a):e==c.iscroll?new n(a,b):new j(a):d.isAndroid&&d.isWeiXin?new j(a):d.isIOS||d.isAndroid&&d.osVersion>=5?new k(a):new j(a)},e}(f);a.ScrollView=i;var j=function(a){function b(b){var d=this;a.call(this,b),this.cur_scroll_args={},this.CHECK_INTERVAL=300,$(b).attr("scroll-type",c.doc),$(document).scroll(function(a){d.cur_scroll_args.clientHeight=$(window).height(),d.cur_scroll_args.scrollHeight=document.body.scrollHeight,d.cur_scroll_args.scrollTop=$(document).scrollTop(),d.scrollEndCheck()})}return __extends(b,a),b.createElement=function(a,b){var c=document.createElement("div");return c.innerHTML=a,b.element.appendChild(c),c},b.prototype.scrollEndCheck=function(){var a=this;null==this.checking_num&&(this.checking_num=0,this.checking_num=window.setInterval(function(){return a.pre_scroll_top==a.cur_scroll_args.scrollTop?(window.clearInterval(a.checking_num),a.checking_num=null,a.pre_scroll_top=null,void a.on_scrollEnd(a.cur_scroll_args)):void(a.pre_scroll_top=a.cur_scroll_args.scrollTop)},this.CHECK_INTERVAL))},b}(i),k=function(a){function b(d){$(d).attr("scroll-type",c.div);var e;null!=d.firstElementChild&&d.firstElementChild.tagName==b.SCROLLER_TAG_NAME?e=d.firstElementChild:(e=document.createElement(b.SCROLLER_TAG_NAME),e.innerHTML=d.innerHTML,d.innerHTML="",d.appendChild(e)),a.call(this,d),this.cur_scroll_args={},this.scroller_node=e,this.scroller_node.onscroll=$.proxy(this.on_elementScroll,this),new l(this,$.proxy(this.on_scroll,this))}return __extends(b,a),b.prototype.on_elementScroll=function(){var a=this.scroller_node;this.cur_scroll_args.scrollTop=0-a.scrollTop,this.cur_scroll_args.clientHeight=a.clientHeight,this.cur_scroll_args.scrollHeight=a.scrollHeight;var b={clientHeight:this.cur_scroll_args.clientHeight,scrollHeight:this.cur_scroll_args.scrollHeight,scrollTop:0-this.cur_scroll_args.scrollTop};this.on_scroll(b),this.scrollEndCheck()},b.prototype.scrollEndCheck=function(){var a=this;null==this.checking_num&&(this.checking_num=0,this.checking_num=window.setInterval(function(){return a.pre_scroll_top==a.cur_scroll_args.scrollTop?(window.clearInterval(a.checking_num),a.checking_num=null,a.pre_scroll_top=null,void a.on_scrollEnd(a.cur_scroll_args)):void(a.pre_scroll_top=a.cur_scroll_args.scrollTop)},b.CHECK_INTERVAL))},Object.defineProperty(b.prototype,"disabled",{get:function(){var a=document.defaultView.getComputedStyle(this.scroller_node);return"scroll"!=a.overflowY},set:function(a){1==a?this.scroller_node.style.overflowY="hidden":this.scroller_node.style.overflowY="scroll"},enumerable:!0,configurable:!0}),b.CHECK_INTERVAL=30,b.SCROLLER_TAG_NAME="SCROLLER",b}(i),l=function(){function b(b,c){if(this.is_vertical=!1,this.moved=!1,null==b)throw a.Errors.argumentNull("scrollView");if(null==c)throw a.Errors.argumentNull("on_scroll");if(this.scrollView=b,this.on_scroll=c,this.containerElement=this.scrollView.element,this.scrollerElement=$(this.scrollView.element).find("scroller")[0],null==this.scrollerElement)throw a.Errors.scrollerElementNotExists();this.hammer=new Hammer.Manager(this.containerElement),this.hammer.add(new Hammer.Pan({direction:Hammer.DIRECTION_VERTICAL})),this.hammer.on("pandown",$.proxy(this.on_pandown,this)),this.hammer.on("panup",$.proxy(this.on_panup,this)),this.hammer.on("panstart",$.proxy(this.on_panstart,this)),this.hammer.on("panend",$.proxy(this.on_panend,this))}return b.prototype.on_panstart=function(a){this.pre_y=a.deltaY,this.elementScrollTop=this.scrollerElement.scrollTop;var b=Math.atan(Math.abs(a.deltaY/a.deltaX))/3.14159265*180;this.is_vertical=b>=70;var c=0==this.scrollerElement.scrollTop&&this.is_vertical,d=this.scrollerElement.scrollHeight-this.scrollerElement.scrollTop<=this.scrollerElement.clientHeight&&this.is_vertical;c&&a.deltaY>0?this.pullType="down":d&&a.deltaY<0?this.pullType="up":this.pullType="none"},b.prototype.on_pandown=function(a){a.deltaY>=0&&"up"==this.pullType?move(this.containerElement).y(0).duration(0).end():a.deltaY>=0&&"down"==this.pullType?this.move(a):a.deltaY<0&&"up"==this.pullType&&this.move(a)},b.prototype.on_panup=function(a){a.deltaY<=0&&"down"==this.pullType?move(this.containerElement).y(0).duration(0).end():a.deltaY<=0&&"up"==this.pullType?this.move(a):a.deltaY>0&&"down"==this.pullType&&this.move(a)},b.prototype.on_panend=function(a){this.moved&&($(this.scrollerElement).scrollTop(this.elementScrollTop),move(this.containerElement).y(0).end(),this.moved=!1),this.enableNativeScroll()},b.prototype.move=function(a){this.disableNativeScroll();var b=a.deltaY/2;move(this.containerElement).y(b).duration(0).end(),this.moved=!0;var c={scrollHeight:this.scrollerElement.scrollHeight,clientHeight:this.scrollerElement.clientHeight,scrollTop:b-this.scrollerElement.scrollTop};this.on_scroll(c)},b.prototype.disableNativeScroll=function(){this.scrollerElement.style.overflowY="hidden"},b.prototype.enableNativeScroll=function(){this.scrollerElement.style.overflowY="scroll"},b}(),m=function(a){function b(b,c){a.call(this,b),b.innerHTML='<div name="scrollLoad_loading" style="padding:10px 0px 10px 0px;">         <h5 class="text-center">                 <i class="icon-spinner icon-spin"></i><span style="padding-left:10px;">数据正在加载中...</span>             </h5>     </div>'}return __extends(b,a),b}(f);a.ScrollViewStatusBar=m;var n=function(a){function b(d,e){var f=this;if($(d).attr("scroll-type",c.iscroll),null==d.firstElementChild||d.firstElementChild.tagName!=b.SCROLLER_TAG_NAME){var g=document.createElement(b.SCROLLER_TAG_NAME);g.innerHTML=d.innerHTML,d.innerHTML="",d.appendChild(g)}a.call(this,d),requirejs(["iscroll"],function(){return f.init(f.element)})}return __extends(b,a),b.prototype.init=function(a){var b={tap:!0,useTransition:!1,HWCompositing:!1,preventDefault:!0,probeType:2},c=this.iscroller=new IScroll(a,b);c.page_container=this,c.on("scrollEnd",function(){var a=this,b={scrollTop:a.y,scrollHeight:a.scrollerHeight,clientHeight:a.wrapperHeight};d.on_scrollEnd(b)}),c.hasVerticalScroll=!0;var d=this;c.on("scroll",function(){var a=this,b={scrollTop:a.y,scrollHeight:a.scrollerHeight,clientHeight:a.wrapperHeight};d.on_scroll(b)}),function(a,b){$(b).on("tap",function(b){if(0!=a.enabled)for(var c=4,d=1,e=b.target;null!=e;){if("A"==e.tagName)return window.open($(e).attr("href"),"_self");if(e=e.parentNode,d+=1,d>c)return}})}(c,a),$(window).on("resize",function(){window.setTimeout(function(){return c.refresh()},500)})},b.prototype.refresh=function(){null!=this.iscroller&&this.iscroller.refresh()},Object.defineProperty(b.prototype,"disabled",{get:function(){return!this.iscroller.enabled},set:function(a){a?this.iscroller.disable():this.iscroller.enable()},enumerable:!0,configurable:!0}),b.SCROLLER_TAG_NAME="SCROLLER",b}(i);a.IScrollView=n,f.register("HEADER",g),f.register("TOP-BAR",g),f.register("SCROLL-VIEW",i.createInstance),f.register("FOOTER",h),f.register("BOTTOM-BAR",h)}(chitu||(chitu={}));var chitu;!function(a){var b=function(){function b(){}return b.argumentNull=function(b){var c=a.Utility.format('The argument "{0}" cannt be null.',b);return new Error(c)},b.modelFileExpecteFunction=function(b){var c=a.Utility.format('The eval result of script file "{0}" is expected a function.',b);return new Error(c)},b.paramTypeError=function(b,c){var d=a.Utility.format('The param "{0}" is expected "{1}" type.',b,c);return new Error(d)},b.paramError=function(a){return new Error(a)},b.viewNodeNotExists=function(b){var c=a.Utility.format('The view node "{0}" is not exists.',b);return new Error(c)},b.pathPairRequireView=function(b){var c=a.Utility.format('The view value is required for path pair, but the item with index "{0}" is miss it.',b);return new Error(c)},b.notImplemented=function(b){var c=a.Utility.format('The method "{0}" is not implemented.',b);return new Error(c)},b.routeExists=function(b){var c=a.Utility.format('Route named "{0}" is exists.',b);return new Error(c)},b.ambiguityRouteMatched=function(b,c,d){var e=a.Utility.format("Ambiguity route matched, {0} is match in {1} and {2}.",b,c,d);return new Error(e)},b.noneRouteMatched=function(b){var c=a.Utility.format('None route matched with url "{0}".',b),d=new Error(c);return d},b.emptyStack=function(){return new Error("The stack is empty.")},b.canntParseUrl=function(b){var c=a.Utility.format('Can not parse the url "{0}" to route data.',b);return new Error(c)},b.routeDataRequireController=function(){var a='The route data does not contains a "controller" file.';return new Error(a)},b.routeDataRequireAction=function(){var a='The route data does not contains a "action" file.';return new Error(a)},b.parameterRequireField=function(b,c){var d=a.Utility.format("Parameter {1} does not contains field {0}.",b,c);return new Error(d)},b.viewCanntNull=function(){var a="The view or viewDeferred of the page cannt null.";return new Error(a)},b.createPageFail=function(b){var c=a.Utility.format('Create page "{0}" fail.',b);return new Error(c)},b.actionTypeError=function(b){var c=a.Utility.format("Export of '{0}' page is expect chitu.Page type.",b);return new Error(c)},b.scrollerElementNotExists=function(){var a="Scroller element is not exists.";return new Error(a)},b}();a.Errors=b}(chitu||(chitu={}));var chitu;!function(a){function b(a){var b=f[a]={};return jQuery.each(a.match(e)||[],function(a,c){b[c]=!0}),b}function c(c){void 0===c&&(c=null),c="string"==typeof c?f[c]||b(c):jQuery.extend({},c);var d,e,g,h,i,j,k=[],l=!c.once&&[],m=function(a){for(d=c.memory&&a,e=!0,j=h||0,h=0,i=k.length,g=!0;k&&i>j;j++){var b=k[j].apply(a[0],a[1]);if(null!=b&&a[0].results.push(b),b===!1&&c.stopOnFalse){d=!1;break}}g=!1,k&&(l?l.length&&m(l.shift()):d?k=[]:n.disable())},n={results:[],add:function(){if(k){var a=k.length;!function b(a){jQuery.each(a,function(a,d){var e=jQuery.type(d);"function"===e?c.unique&&n.has(d)||k.push(d):d&&d.length&&"string"!==e&&b(d)})}(arguments),g?i=k.length:d&&(h=a,m(d))}return this},remove:function(){return k&&jQuery.each(arguments,function(a,b){for(var c;(c=jQuery.inArray(b,k,c))>-1;)k.splice(c,1),g&&(i>=c&&i--,j>=c&&j--)}),this},has:function(a){return a?jQuery.inArray(a,k)>-1:!(!k||!k.length)},empty:function(){return k=[],i=0,this},disable:function(){return k=l=d=void 0,this},disabled:function(){return!k},lock:function(){return l=void 0,d||n.disable(),this},locked:function(){return!l},fireWith:function(a,b){return a.results=[],!k||e&&!l||(b=b||[],b=[a,b.slice?b.slice():b],g?l.push(b):m(b)),a.results},fire:function(){return n.fireWith(this,arguments)},fired:function(){return!!e},count:function(){return k.length}};return new a.Callback(n)}function d(b,c,d){for(var e=c,f=b.fireWith(e,[c,d]),g=[],h=0;h<f.length;h++)a.Utility.isDeferred(f[h])&&g.push(f[h]);return 0==g.length?$.Deferred().resolve():$.when.apply($,g)}var e=/\S+/g,f={},g=function(){function a(a){this.source=a}return a.prototype.add=function(a){this.source.add(a)},a.prototype.remove=function(a){this.source.remove(a)},a.prototype.has=function(a){return this.source.has(a)},a.prototype.fireWith=function(a,b){return this.source.fireWith(a,b)},a.prototype.fire=function(a,b,c,d){return this.source.fire(a,b,c)},a}();a.Callback=g,a.Callbacks=c,a.fireCallback=d}(chitu||(chitu={}));var chitu;!function(a){a.Utility,a.Errors;!function(a){a[a.init=0]="init",a[a.scroll=1]="scroll",a[a.pullDown=2]="pullDown",a[a.pullUp=3]="pullUp",a[a.custom=4]="custom"}(a.PageLoadType||(a.PageLoadType={}));var b;a.PageLoadType;!function(a){a[a.swipeLeft=0]="swipeLeft",a[a.swipeRight=1]="swipeRight",a[a.none=2]="none"}(b||(b={}));var c;!function(a){a[a.header=1]="header",a[a.body=2]="body",a[a.loading=4]="loading",a[a.footer=8]="footer"}(c||(c={}));var d;!function(a){a[a.open=0]="open",a[a.closed=1]="closed"}(d||(d={})),function(a){a[a.None=0]="None",a[a.Left=1]="Left",a[a.Right=2]="Right",a[a.Up=3]="Up",a[a.Down=4]="Down"}(a.SwipeDirection||(a.SwipeDirection={}));var e=a.SwipeDirection;!function(a){a[a.IScroll=0]="IScroll",a[a.Div=1]="Div",a[a.Document=2]="Document"}(a.ScrollType||(a.ScrollType={}));var f=(a.ScrollType,function(b){function c(d){var e=this;if(b.call(this,d.element),this._loadViewModelResult=null,this._openResult=null,this._hideResult=null,this._showTime=c.animationTime,this._hideTime=c.animationTime,this._enableScrollLoad=!1,this.is_closed=!1,this.isActionExecuted=!1,this.closing=a.Callbacks(),this.closed=a.Callbacks(),this.hiding=a.Callbacks(),this.hidden=a.Callbacks(),null==d)throw a.Errors.argumentNull("args");$(this.element).data("page",this),this._pageContainer=d.container,this._routeData=d.routeData,this._pageContainer.closing.add(function(){return e.on_closing(e.routeData.values)}),this._pageContainer.closed.add(function(){return e.on_closed(e.routeData.values)})}return __extends(c,b),Object.defineProperty(c.prototype,"routeData",{get:function(){return this._routeData},enumerable:!0,configurable:!0}),Object.defineProperty(c.prototype,"name",{get:function(){return this._name||(this._name=this.routeData.pageName),this._name},enumerable:!0,configurable:!0}),Object.defineProperty(c.prototype,"visible",{get:function(){return $(this.element).is(":visible")},enumerable:!0,configurable:!0}),Object.defineProperty(c.prototype,"container",{get:function(){return this._pageContainer},enumerable:!0,configurable:!0}),c.prototype.hide=function(a){return a=a||e.None,this.container.hide(a)},c.prototype.findControl=function(b){if(!b)throw a.Errors.argumentNull("name");for(var c=new Array,d=0;d<this.children.length;d++){var e=this.children[d];c.push(e)}for(;c.length>0;){var e=c.pop();if(e.name==b)return e;for(var d=0;d<e.children.length;d++)c.push(e.children[d])}return null},c.prototype.fireEvent=function(b,c){return a.fireCallback(b,this,c)},c.prototype.on_closing=function(a){return this.fireEvent(this.closing,a)},c.prototype.on_closed=function(a){return this.fireEvent(this.closed,a)},c.prototype.on_hiding=function(a){return this.fireEvent(this.hiding,a)},c.prototype.on_hidden=function(a){return this.fireEvent(this.hidden,a)},c.animationTime=300,c}(a.Control));a.Page=f}(chitu||(chitu={}));var chitu;!function(a){var b=(function(){function a(){}return a}(),function(){function a(){this.Div="div",this.IScroll="iscroll",this.Document="doc"}return a}(),function(){function b(b){this.animationTime=300,this._previousOffsetRate=.5,this.showing=a.Callbacks(),this.shown=a.Callbacks(),this.closing=a.Callbacks(),this.closed=a.Callbacks(),this.pageCreated=a.Callbacks(),this.is_closing=!1,b=$.extend({enableGesture:!0,enableSwipeClose:!0},b),this._node=this.createNode(),this._loading=this.createLoading(this._node),this._previous=b.previous,this._app=b.app,this._routeData=b.routeData,b.enableGesture&&(this.gesture=new e(this._node)),null!=this.previous&&b.enableSwipeClose&&this._enableSwipeBack(),this.createPage(b.routeData)}return b.prototype.on_pageCreated=function(b){return a.fireCallback(this.pageCreated,this,b)},b.prototype.on_showing=function(b){return a.fireCallback(this.showing,this,b)},b.prototype.on_shown=function(b){return a.fireCallback(this.shown,this,b)},b.prototype.on_closing=function(b){return a.fireCallback(this.closing,this,b)},b.prototype.on_closed=function(b){return a.fireCallback(this.closed,this,b)},b.prototype._enableSwipeBack=function(){var b,c,d,e=this,f=this,g=f.element,h=$(window).width()/2,i=35,j=f.gesture.createPan();j.start=function(h){g.style.webkitTransform="",g.style.transform="";var j=new WebKitCSSMatrix(f.previous.element.style.webkitTransform);b=j.m41;var l=Math.atan(Math.abs(h.deltaY/h.deltaX))/3.14159265*180;if(l>i)return!1;var m=null!=f.previous&&0!=(h.direction&Hammer.DIRECTION_RIGHT)&&(e.open_swipe==a.SwipeDirection.Left||e.open_swipe==a.SwipeDirection.Right);return 1==m&&(c=e.previous.visible,e.previous.visible=!0),d=k(g),m},j.left=function(a){return l(d),a.deltaX<=0?(move(g).x(0).duration(0).end(),void move(e.previous.element).x(b).duration(0).end()):(move(g).x(a.deltaX).duration(0).end(),void move(e.previous.element).x(b+a.deltaX*e._previousOffsetRate).duration(0).end())},j.right=function(a){l(d),move(g).x(a.deltaX).duration(0).end(),move(e.previous.element).x(b+a.deltaX*e._previousOffsetRate).duration(0).end()},j.end=function(i){return i.deltaX>h?void e._app.back():(move(g).x(0).duration(a.Page.animationTime).end(),void move(f.previous.element).x(b).duration(a.Page.animationTime).end(function(){e.previous.visible=c,m(d)}))};var k=function(a){var b=[];return $(a).find("scroll-view").each(function(a,c){var d=$(c).data("control");0==d.disabled&&b.push(d)}),b},l=function(a){for(var b=0;b<a.length;b++)a[b].disabled=!0},m=function(a){for(var b=0;b<a.length;b++)a[b].disabled=!1}},b.prototype.createNode=function(){return this._node=document.createElement("div"),this._node.className="page-container",this._node.style.display="none",document.body.appendChild(this._node),this._node},b.prototype.createLoading=function(a){var b=document.createElement("div");return b.className="page-loading",b.innerHTML='<div class="spin"><i class="icon-spinner icon-spin"></i><div>',a.appendChild(b),b},b.prototype.show=function(b){var c=this;if(1==this.visible)return $.Deferred().resolve();this.on_showing(this.routeData.values);var d=$(this._node).width(),e=$(this._node).height();(0>=d||0>=e)&&(b=a.SwipeDirection.None);var f=30,g=$.Deferred(),h=function(){null!=c.previous&&(c.previous.visible=!1),c.on_shown(c.routeData.values),g.resolve()};switch(this.open_swipe=b,b){case a.SwipeDirection.None:default:$(this._node).show(),h();break;case a.SwipeDirection.Down:move(this.element).y(0-e).duration(0).end(),$(this._node).show(),window.setTimeout(function(){move(c.element).y(0).duration(c.animationTime).end(h)},f);break;case a.SwipeDirection.Up:move(this.element).y(e).duration(0).end(),$(this._node).show(),window.setTimeout(function(){move(c.element).y(0).duration(c.animationTime).end(h)},f);break;case a.SwipeDirection.Right:move(this.element).x(0-d).duration(0).end(),$(this._node).show(),window.setTimeout(function(){null!=c.previous&&move(c.previous.element).x(d*c._previousOffsetRate).duration(c.animationTime).end(),move(c.element).x(0).duration(c.animationTime).end(h)},f);break;case a.SwipeDirection.Left:move(this.element).x(d).duration(0).end(),$(this._node).show(),window.setTimeout(function(){null!=c.previous&&move(c.previous.element).x(0-d*c._previousOffsetRate).duration(c.animationTime).end(),move(c.element).x(0).duration(c.animationTime).end(h)},f)}return g},b.prototype.hide=function(b){if(0==this.visible)return $.Deferred().resolve();var c=$(this._node).width(),d=$(this._node).height(),e=$.Deferred();switch(b){case a.SwipeDirection.None:default:null!=this.previous&&move(this.previous.element).x(0).duration(this.animationTime).end(),e.resolve();break;case a.SwipeDirection.Down:move(this.element).y(d).duration(this.animationTime).end(function(){return e.resolve()});break;case a.SwipeDirection.Up:move(this.element).y(0-d).duration(this.animationTime).end(function(){return e.resolve()});break;case a.SwipeDirection.Right:null!=this.previous&&move(this.previous.element).x(0).duration(this.animationTime).end(),move(this.element).x(c).duration(this.animationTime).end(function(){return e.resolve()});break;case a.SwipeDirection.Left:null!=this.previous&&move(this.previous.element).x(0).duration(this.animationTime).end(),move(this.element).x(0-c).duration(this.animationTime).end(function(){return e.resolve()})}return e},b.prototype.close=function(b){var c=this;null==b&&(b=a.SwipeDirection.None),this.is_closing||(this.on_closing(this.routeData.values),this.is_closing=!0,this.hide(b).done(function(){$(c._node).remove(),c.on_closed(c.routeData.values)}))},b.prototype.showLoading=function(){this._loading.style.display="block"},b.prototype.hideLoading=function(){this._loading.style.display="none"},Object.defineProperty(b.prototype,"visible",{get:function(){return $(this._node).is(":visible")},set:function(a){a?$(this._node).show():$(this._node).hide()},enumerable:!0,configurable:!0}),Object.defineProperty(b.prototype,"element",{get:function(){return this._node},enumerable:!0,configurable:!0}),Object.defineProperty(b.prototype,"page",{get:function(){return this._currentPage},enumerable:!0,configurable:!0}),Object.defineProperty(b.prototype,"previous",{get:function(){return this._previous},enumerable:!0,configurable:!0}),Object.defineProperty(b.prototype,"routeData",{get:function(){return this._routeData},enumerable:!0,configurable:!0}),b.prototype.createActionDeferred=function(b){var c=b.actionPath,d=$.Deferred();return requirejs([c],function(c){if(!c)return console.warn(a.Utility.format("加载活动“{0}”失败。",b.pageName)),void d.reject();if(!$.isFunction(c)||null==c.prototype)throw a.Errors.actionTypeError(b.pageName);d.resolve(c)},function(a){return d.reject(a)}),d},b.prototype.createViewDeferred=function(a){var b=$.Deferred(),c="http://";return a.substr(0,c.length).toLowerCase()==c?$.ajax({url:a}).done(function(a){null!=a?b.resolve(a):b.reject()}).fail(function(a){return b.reject(a)}):requirejs(["text!"+a],function(a){null!=a?b.resolve(a):b.reject()},function(a){b.reject(a)}),b},b.prototype.createPage=function(b){var c,d=this;c=b.viewPath?this.createViewDeferred(b.viewPath):$.Deferred().resolve("");var e=this.createActionDeferred(b),f=$.Deferred();return $.when(e,c).done(function(c,e){var g=document.createElement("page");g.innerHTML=e,g.setAttribute("name",b.pageName);var h=new c({container:d,element:g,routeData:b});if(!(h instanceof a.Page))throw a.Errors.actionTypeError(b.pageName);d._currentPage=h,d.element.appendChild(h.element),d.on_pageCreated(h),f.resolve(h),h.on_load(b.values).done(function(){d.hideLoading()})}).fail(function(c){throw f.reject(),console.error(c),a.Errors.createPageFail(b.pageName)}),null!=b.resource&&b.resource.length>0&&a.Utility.loadjs.apply(a.Utility,b.resource),f},b}());a.PageContainer=b;var c=function(){function a(a){this._app=a}return a.createInstance=function(a){var c=new b(a);return c},a}();a.PageContainerFactory=c;var d=function(){function a(a){this.cancel=!1}return a}();a.Pan=d;var e=function(){function a(a){var b=this;this._prevent={pan:Hammer.DIRECTION_NONE},this.prevent={pan:function(a){b._prevent.pan=a}},this.executedCount=0,this.hammersCount=0,this.hammer=new Hammer.Manager(a)}return a.prototype.on_pan=function(a){for(var b=this.pans,c=b.length-1;c>=0;c--){var d=this.hammer.get("pan").state;null==b[c].started&&(d&Hammer.STATE_BEGAN)==Hammer.STATE_BEGAN&&(b[c].started=b[c].start(a));var e=!1,f=b[c].started;if(1==f&&((a.direction&Hammer.DIRECTION_LEFT)==Hammer.DIRECTION_LEFT&&null!=b[c].left?b[c].left(a):(a.direction&Hammer.DIRECTION_RIGHT)==Hammer.DIRECTION_RIGHT&&null!=b[c].right?b[c].right(a):(a.direction&Hammer.DIRECTION_UP)==Hammer.DIRECTION_UP&&null!=b[c].up?b[c].up(a):(a.direction&Hammer.DIRECTION_DOWN)==Hammer.DIRECTION_DOWN&&null!=b[c].down&&b[c].down(a),(d&Hammer.STATE_ENDED)==Hammer.STATE_ENDED&&null!=b[c].end&&b[c].end(a),e=!0),(d&Hammer.STATE_ENDED)==Hammer.STATE_ENDED&&(b[c].started=null),1==e)break}},Object.defineProperty(a.prototype,"pans",{get:function(){return null==this._pans&&(this._pans=new Array,this.hammer.add(new Hammer.Pan({direction:Hammer.DIRECTION_ALL})),this.hammer.on("pan",$.proxy(this.on_pan,this))),this._pans},enumerable:!0,configurable:!0}),a.prototype.createPan=function(){var a=new d(this);return this.pans.push(a),a},a}();a.Gesture=e}(chitu||(chitu={}));var chitu;!function(a){
var b=a.Errors,c=function(){function a(){}return a.isType=function(a,b){for(var c in a.prototype)if(void 0===b[c])return!1;return!0},a.isDeferred=function(a){return null==a?!1:null!=a.pipe&&null!=a.always&&null!=a.done},a.format=function(a){for(var b=[],c=1;c<arguments.length;c++)b[c-1]=arguments[c];for(var d=0;d<b.length;d++)a=a.replace(new RegExp("\\{"+d+"\\}","g"),function(){return b[d]});return a},a.fileName=function(a,c){if(!a)throw b.argumentNull("url");c=c||!0,a=a.replace("http://","/");var d=a.replace(/^.*[\\\/]/,"");if(c===!0){var e=d.split(".");d=e[0]}return d},a.log=function(a,b){if(void 0===b&&(b=[]),window.console){if(null==b)return void console.log(a);var c=this.format.apply(this,arguments);console.log(c)}},a.loadjs=function(){for(var a=[],b=0;b<arguments.length;b++)a[b-0]=arguments[b];var c=$.Deferred();return requirejs(a,function(){for(var a=[],b=0;b<arguments.length;b++)a[b]=arguments[b];c.resolve.apply(c,a)}),c},a}();a.Utility=c}(chitu||(chitu={}));
window['chitu'] = window['chitu'] || chitu 
                    
 return chitu;
    });