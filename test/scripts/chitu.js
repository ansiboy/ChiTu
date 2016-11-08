var chitu;
(function (chitu) {
    class RouteParser {
        constructor(pathBase) {
            this.path_string = '';
            this.path_spliter_char = '/';
            this.param_spliter = '?';
            this.name_spliter_char = '.';
            this._actionPath = '';
            this._cssPath = '';
            this._parameters = {};
            this._pageName = '';
            this.pathBase = '';
            this.HASH_MINI_LENGTH = 2;
            if (pathBase == null)
                pathBase = 'modules/';
            this.pathBase = pathBase;
        }
        parseRouteString(routeString) {
            let path;
            let search;
            let param_spliter_index = routeString.indexOf(this.param_spliter);
            if (param_spliter_index > 0) {
                search = routeString.substr(param_spliter_index + 1);
                path = routeString.substring(0, param_spliter_index);
            }
            else {
                path = routeString;
            }
            if (!path)
                throw chitu.Errors.canntRouteString(routeString);
            if (search) {
                this._parameters = this.pareeUrlQuery(search);
            }
            let path_parts = path.split(this.path_spliter_char);
            let actionName = path_parts[path_parts.length - 1];
            let page_name = path_parts.join(this.name_spliter_char);
            var result = {
                actionPath: this.pathBase + path,
                actionName,
                viewPath: this.pathBase + path + '.html',
                values: this._parameters,
                pageName: page_name,
            };
            return result;
        }
        pareeUrlQuery(query) {
            let match, pl = /\+/g, search = /([^&=]+)=?([^&]*)/g, decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };
            let urlParams = {};
            while (match = search.exec(query))
                urlParams[decode(match[1])] = decode(match[2]);
            return urlParams;
        }
    }
    chitu.RouteParser = RouteParser;
    var PAGE_STACK_MAX_SIZE = 10;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';
    class Application {
        constructor(config) {
            this.pageCreated = chitu.Callbacks();
            this._runned = false;
            this.page_stack = new Array();
            this.backFail = chitu.Callbacks();
            config = config || {};
            this._config = config;
            let urlParser = new RouteParser(this._config.pathBase);
            this.parseRouteString = (routeString) => {
                return urlParser.parseRouteString(routeString);
            };
        }
        on_pageCreated(page) {
            return chitu.fireCallback(this.pageCreated, this, page);
        }
        get config() {
            return this._config;
        }
        get currentPage() {
            if (this.page_stack.length > 0)
                return this.page_stack[this.page_stack.length - 1];
            return null;
        }
        get pages() {
            return this.page_stack;
        }
        createPage(routeData) {
            let previous_page = this.pages[this.pages.length - 1];
            let page = chitu.PageFactory.createInstance({ app: this, routeData, previous: previous_page });
            this.page_stack.push(page);
            if (this.page_stack.length > PAGE_STACK_MAX_SIZE) {
                let c = this.page_stack.shift();
                c.close();
            }
            return page;
        }
        hashchange() {
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
            var routeString;
            if (location.hash.length > 1)
                routeString = location.hash.substr(1);
            var pageInfo = this.parseRouteString(routeString);
            var page = this.getPage(pageInfo.pageName);
            if (page != null && this.page_stack.indexOf(page) == this.page_stack.length - 2) {
                var c = this.page_stack.pop();
                if (c.previous != null) {
                    c.previous.show();
                }
                c.close();
            }
            else {
                this.showPage(routeString);
            }
            if (back_deferred)
                back_deferred.resolve();
        }
        run() {
            if (this._runned)
                return;
            var app = this;
            this.hashchange();
            window.addEventListener('hashchange', () => {
                this.hashchange();
            });
            this._runned = true;
        }
        getPage(name) {
            for (var i = this.page_stack.length - 1; i >= 0; i--) {
                var page = this.page_stack[i];
                if (page != null && page.name == name)
                    return page;
            }
            return null;
        }
        showPage(routeString, args) {
            if (!routeString)
                throw chitu.Errors.argumentNull('routeString');
            var routeData = this.parseRouteString(routeString);
            if (routeData == null) {
                throw chitu.Errors.noneRouteMatched(routeString);
            }
            routeData.values = $.extend(routeData.values, args || {});
            let previous = this.currentPage;
            let result = new Promise((resolve, reject) => {
                let page = this.createPage(routeData);
                this.on_pageCreated(page);
                resolve(page);
            });
            return result;
        }
        createPageNode() {
            var element = document.createElement('div');
            return element;
        }
        redirect(url, args) {
            window.location['skip'] = true;
            window.location.hash = url;
            return this.showPage(url, args);
        }
        back(args = undefined) {
            return new Promise((reslove, reject) => {
                if (window.history.length == 0) {
                    reject();
                    this.page_stack.pop();
                    chitu.fireCallback(this.backFail, this, {});
                    return this.back_deferred;
                }
                window.history.back();
                reslove();
            });
        }
    }
    chitu.Application = Application;
})(chitu || (chitu = {}));
var chitu;
(function (chitu) {
    class Errors {
        static argumentNull(paramName) {
            var msg = chitu.Utility.format('The argument "{0}" cannt be null.', paramName);
            return new Error(msg);
        }
        static modelFileExpecteFunction(script) {
            var msg = chitu.Utility.format('The eval result of script file "{0}" is expected a function.', script);
            return new Error(msg);
        }
        static paramTypeError(paramName, expectedType) {
            var msg = chitu.Utility.format('The param "{0}" is expected "{1}" type.', paramName, expectedType);
            return new Error(msg);
        }
        static paramError(msg) {
            return new Error(msg);
        }
        static viewNodeNotExists(name) {
            var msg = chitu.Utility.format('The view node "{0}" is not exists.', name);
            return new Error(msg);
        }
        static pathPairRequireView(index) {
            var msg = chitu.Utility.format('The view value is required for path pair, but the item with index "{0}" is miss it.', index);
            return new Error(msg);
        }
        static notImplemented(name) {
            var msg = chitu.Utility.format('The method "{0}" is not implemented.', name);
            return new Error(msg);
        }
        static routeExists(name) {
            var msg = chitu.Utility.format('Route named "{0}" is exists.', name);
            return new Error(msg);
        }
        static ambiguityRouteMatched(url, routeName1, routeName2) {
            var msg = chitu.Utility.format('Ambiguity route matched, {0} is match in {1} and {2}.', url, routeName1, routeName2);
            return new Error(msg);
        }
        static noneRouteMatched(url) {
            var msg = chitu.Utility.format('None route matched with url "{0}".', url);
            var error = new Error(msg);
            return error;
        }
        static emptyStack() {
            return new Error('The stack is empty.');
        }
        static canntParseUrl(url) {
            var msg = chitu.Utility.format('Can not parse the url "{0}" to route data.', url);
            return new Error(msg);
        }
        static canntRouteString(routeString) {
            var msg = chitu.Utility.format('Can not parse the route string "{0}" to route data.', routeString);
            return new Error(msg);
        }
        static routeDataRequireController() {
            var msg = 'The route data does not contains a "controller" file.';
            return new Error(msg);
        }
        static routeDataRequireAction() {
            var msg = 'The route data does not contains a "action" file.';
            return new Error(msg);
        }
        static parameterRequireField(fileName, parameterName) {
            var msg = chitu.Utility.format('Parameter {1} does not contains field {0}.', fileName, parameterName);
            return new Error(msg);
        }
        static viewCanntNull() {
            var msg = 'The view or viewDeferred of the page cannt null.';
            return new Error(msg);
        }
        static createPageFail(pageName) {
            var msg = chitu.Utility.format('Create page "{0}" fail.', pageName);
            return new Error(msg);
        }
        static actionTypeError(actionName, pageName) {
            let msg = `The '${actionName}' in page '${pageName}' is expect as function or Class.`;
            return new Error(msg);
        }
        static canntFindAction(actionName, pageName) {
            let msg = `Cannt find action '${actionName}' in page '${pageName}'.`;
            return new Error(msg);
        }
        static scrollerElementNotExists() {
            let msg = "Scroller element is not exists.";
            return new Error(msg);
        }
    }
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
    class Callback {
        constructor(source) {
            this.source = source;
        }
        add(func) {
            this.source.add(func);
        }
        remove(func) {
            this.source.remove(func);
        }
        has(func) {
            return this.source.has(func);
        }
        fireWith(context, args) {
            return this.source.fireWith(context, args);
        }
        fire(arg1, arg2, arg3, arg4) {
            return this.source.fire(arg1, arg2, arg3);
        }
    }
    chitu.Callback = Callback;
    function Callbacks(options = null) {
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
        let context = sender;
        var results = callback.fireWith(context, [sender, args]);
        var deferreds = new Array();
        for (var i = 0; i < results.length; i++) {
            if (results[i] instanceof Promise)
                deferreds.push(results[i]);
        }
        if (deferreds.length == 0) {
            return new Promise((reslove) => {
                reslove();
            });
        }
        return Promise.all(deferreds);
    }
    chitu.fireCallback = fireCallback;
})(chitu || (chitu = {}));
var chitu;
(function (chitu) {
    class Page {
        constructor(params) {
            this.animationTime = 300;
            this.load = chitu.Callbacks();
            this.showing = chitu.Callbacks();
            this.shown = chitu.Callbacks();
            this.hiding = chitu.Callbacks();
            this.hidden = chitu.Callbacks();
            this.closing = chitu.Callbacks();
            this.closed = chitu.Callbacks();
            this._element = params.element;
            this._previous = params.previous;
            this._app = params.app;
            this._routeData = params.routeData;
            this._displayer = params.displayer;
            this.loadPageAction(params.routeData);
        }
        on_load(args) {
            return chitu.fireCallback(this.load, this, args);
        }
        on_showing(args) {
            return chitu.fireCallback(this.showing, this, args);
        }
        on_shown(args) {
            return chitu.fireCallback(this.shown, this, args);
        }
        on_hiding(args) {
            return chitu.fireCallback(this.hiding, this, args);
        }
        on_hidden(args) {
            return chitu.fireCallback(this.hidden, this, args);
        }
        on_closing(args) {
            return chitu.fireCallback(this.closing, this, args);
        }
        on_closed(args) {
            return chitu.fireCallback(this.closed, this, args);
        }
        show() {
            if (this.visible == true)
                return;
            this.on_showing(this.routeData.values);
            this._displayer.show(this);
            this.on_shown(this.routeData.values);
        }
        hide() {
            if (this._displayer.visible(this))
                return;
            this.on_hiding(this.routeData.values);
            this._displayer.hide(this);
            this.on_hidden(this.routeData.values);
        }
        close() {
            this.hide();
            this.on_closing(this.routeData.values);
            $(this._element).remove();
            this.on_closed(this.routeData.values);
        }
        get visible() {
            return this._displayer.visible(this);
        }
        get element() {
            return this._element;
        }
        get previous() {
            return this._previous;
        }
        get routeData() {
            return this._routeData;
        }
        get name() {
            return this._name;
        }
        set name(value) {
            this._name = value;
        }
        createActionDeferred(routeData) {
            return new Promise((resolve, reject) => {
                var url = routeData.actionPath;
                requirejs([url], (obj) => {
                    if (!obj) {
                        console.warn(chitu.Utility.format('加载活动“{0}”失败。', routeData.pageName));
                        reject();
                        return;
                    }
                    resolve(obj);
                }, (err) => reject(err));
            });
        }
        loadPageAction(routeData) {
            var action_deferred = this.createActionDeferred(routeData);
            return action_deferred
                .then((obj) => {
                let action = obj[routeData.actionName];
                if (action == null) {
                    throw chitu.Errors.actionTypeError;
                }
                if (typeof action == 'function') {
                    action(this);
                }
                else if (action['prototype'] != null) {
                    new action(this);
                }
                else {
                    throw chitu.Errors.actionTypeError(routeData.actionName, routeData.pageName);
                }
                let q = Promise.resolve();
                if (routeData.resource != null && routeData.resource.length > 0) {
                    q = chitu.Utility.loadjs.apply(chitu.Utility, routeData.resource);
                }
                q.then(() => {
                    this.on_load(routeData.values);
                });
            })
                .catch((err) => {
                console.error(err);
                throw chitu.Errors.createPageFail(routeData.pageName);
            });
        }
    }
    chitu.Page = Page;
    class PageDisplayerImplement {
        show(page) {
            $(page.element).show();
            if (page.previous != null) {
                $(page.previous.element).hide();
            }
        }
        hide(page) {
            $(page.element).hide();
            if (page.previous != null) {
                $(page.previous.element).show();
            }
        }
        visible(page) {
            return $(page.element).is(':visible');
        }
    }
    chitu.PageDisplayerImplement = PageDisplayerImplement;
    class PageFactory {
        constructor(app) {
            this._app = app;
        }
        static createInstance(params) {
            params = params || {};
            if (params.app == null)
                throw chitu.Errors.argumentNull('app');
            if (params.routeData == null)
                throw chitu.Errors.argumentNull('routeData');
            let displayer = new PageDisplayerImplement();
            let element = document.createElement('page');
            element.className = params.routeData.pageName;
            let c = new Page({
                app: params.app,
                previous: params.previous,
                routeData: params.routeData,
                displayer,
                element
            });
            return c;
        }
    }
    chitu.PageFactory = PageFactory;
})(chitu || (chitu = {}));
var chitu;
(function (chitu) {
    var e = chitu.Errors;
    class Utility {
        static isType(targetType, obj) {
            for (var key in targetType.prototype) {
                if (obj[key] === undefined)
                    return false;
            }
            return true;
        }
        static isDeferred(obj) {
            if (obj == null)
                return false;
            if (obj.pipe != null && obj.always != null && obj.done != null)
                return true;
            return false;
        }
        static format(source, ...params) {
            for (var i = 0; i < params.length; i++) {
                source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function () {
                    return params[i];
                });
            }
            return source;
        }
        static fileName(url, withExt) {
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
        }
        static log(msg, args = []) {
            if (!window.console)
                return;
            if (args == null) {
                console.log(msg);
                return;
            }
            var txt = this.format.apply(this, arguments);
            console.log(txt);
        }
        static loadjs(...modules) {
            return new Promise((reslove, reject) => {
                requirejs(modules, function () {
                    var args = [];
                    for (var i = 0; i < arguments.length; i++)
                        args[i] = arguments[i];
                    reslove.apply({}, args);
                });
            });
        }
    }
    chitu.Utility = Utility;
})(chitu || (chitu = {}));
