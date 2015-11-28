/// <reference path="scripts/typings/jquery/jquery.d.ts" />
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
        Utility.format = function (source, params) {
            if (arguments.length > 2 && params.constructor !== Array) {
                params = $.makeArray(arguments).slice(1);
            }
            if (params.constructor !== Array) {
                params = [params];
            }
            $.each(params, function (i, n) {
                source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function () {
                    return n;
                });
            });
            return source;
        };
        Utility.fileName = function (url, withExt) {
            /// <summary>获取 URL 链接中的文件名</summary>
            /// <param name="url" type="String">URL 链接</param>
            /// <param name="withExt" type="Boolean" canBeNull="true">
            /// 表示返回的文件名是否包含扩展名，true表示包含，false表示不包含。默认值为true。
            /// </param>
            /// <returns>返回 URL 链接中的文件名</returns>
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
        return Utility;
    })();
    chitu.Utility = Utility;
})(chitu || (chitu = {}));
//# sourceMappingURL=Utility.js.map
var chitu;
(function (chitu) {
    var u = chitu.Utility;
    var Errors = (function () {
        function Errors() {
        }
        Errors.argumentNull = function (paramName) {
            var msg = u.format('The argument "{0}" cannt be null.', [paramName]);
            return new Error(msg);
        };
        Errors.modelFileExpecteFunction = function (script) {
            var msg = u.format('The eval result of script file "{0}" is expected a function.', script);
            return new Error(msg);
        };
        Errors.paramTypeError = function (paramName, expectedType) {
            /// <param name="paramName" type="String"/>
            /// <param name="expectedType" type="String"/>
            var msg = u.format('The param "{0}" is expected "{1}" type.', [paramName, expectedType]);
            return new Error(msg);
        };
        Errors.viewNodeNotExists = function (name) {
            var msg = u.format('The view node "{0}" is not exists.', name);
            return new Error(msg);
        };
        Errors.pathPairRequireView = function (index) {
            var msg = u.format('The view value is required for path pair, but the item with index "{0}" is miss it.', index);
            return new Error(msg);
        };
        Errors.notImplemented = function (name) {
            var msg = u.format('The method "{0}" is not implemented.', name);
            return new Error(msg);
        };
        Errors.routeExists = function (name) {
            var msg = u.format('Route named "{0}" is exists.', name);
            return new Error(msg);
        };
        Errors.routeResultRequireController = function (routeName) {
            var msg = u.format('The parse result of route "{0}" does not contains controler.', routeName);
            return new Error(msg);
        };
        Errors.routeResultRequireAction = function (routeName) {
            var msg = u.format('The parse result of route "{0}" does not contains action.', routeName);
            return new Error(msg);
        };
        Errors.ambiguityRouteMatched = function (url, routeName1, routeName2) {
            var msg = u.format('Ambiguity route matched, {0} is match in {1} and {2}.', [url, routeName1, routeName2]);
            return new Error(msg);
        };
        Errors.noneRouteMatched = function (url) {
            var msg = u.format('None route matched with url "{0}".', url);
            var error = new Error(msg);
            return error;
        };
        Errors.emptyStack = function () {
            return new Error('The stack is empty.');
        };
        Errors.canntParseUrl = function (url) {
            var msg = u.format('Can not parse the url "{0}" to route data.', [url]);
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
            var msg = u.format('Parameter {1} does not contains field {0}.', [fileName, parameterName]);
            return new Error(msg);
        };
        return Errors;
    })();
    chitu.Errors = Errors;
})(chitu || (chitu = {}));
//# sourceMappingURL=Errors.js.map
var chitu;
(function (chitu) {
    var rnotwhite = (/\S+/g);
    // String to Object options format cache
    var optionsCache = {};
    // Convert String-formatted options into Object-formatted ones and store in cache
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
        Callback.prototype.fire = function (params) {
            return this.source.fire(params);
        };
        return Callback;
    })();
    chitu.Callback = Callback;
    function callbacks(options) {
        if (options === void 0) { options = null; }
        // Convert options from String-formatted to Object-formatted if needed
        // (we check in cache first)
        options = typeof options === "string" ?
            (optionsCache[options] || createOptions(options)) :
            jQuery.extend({}, options);
        var memory, 
        // Flag to know if list was already fired
        fired, 
        // Flag to know if list is currently firing
        firing, 
        // First callback to fire (used internally by add and fireWith)
        firingStart, 
        // End of the loop when firing
        firingLength, 
        // Index of currently firing callback (modified by remove if needed)
        firingIndex, 
        // Actual callback list
        list = [], 
        // Stack of fire calls for repeatable lists
        stack = !options.once && [], 
        // Fire callbacks
        fire = function (data) {
            memory = options.memory && data;
            fired = true;
            firingIndex = firingStart || 0;
            firingStart = 0;
            firingLength = list.length;
            firing = true;
            for (; list && firingIndex < firingLength; firingIndex++) {
                var result = list[firingIndex].apply(data[0], data[1]);
                //==============================================
                // MY CODE
                if (result != null) {
                    data[0].results.push(result);
                }
                //==============================================
                if (result === false && options.stopOnFalse) {
                    memory = false; // To prevent further calls using add
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
        }, 
        // Actual Callbacks object
        self = {
            results: [],
            // Add a callback or a collection of callbacks to the list
            add: function () {
                if (list) {
                    // First, we save the current length
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
                                // Inspect recursively
                                add(arg);
                            }
                        });
                    })(arguments);
                    // Do we need to add the callbacks to the
                    // current firing batch?
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
            // Remove a callback from the list
            remove: function () {
                if (list) {
                    jQuery.each(arguments, function (_, arg) {
                        var index;
                        while ((index = jQuery.inArray(arg, list, index)) > -1) {
                            list.splice(index, 1);
                            // Handle firing indexes
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
            // Check if a given callback is in the list.
            // If no argument is given, return whether or not list has callbacks attached.
            has: function (fn) {
                return fn ? jQuery.inArray(fn, list) > -1 : !!(list && list.length);
            },
            // Remove all callbacks from the list
            empty: function () {
                list = [];
                firingLength = 0;
                return this;
            },
            // Have the list do nothing anymore
            disable: function () {
                list = stack = memory = undefined;
                return this;
            },
            // Is it disabled?
            disabled: function () {
                return !list;
            },
            // Lock the list in its current state
            lock: function () {
                stack = undefined;
                if (!memory) {
                    self.disable();
                }
                return this;
            },
            // Is it locked?
            locked: function () {
                return !stack;
            },
            // Call all callbacks with the given context and arguments
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
            // Call all the callbacks with the given arguments
            fire: function () {
                return self.fireWith(this, arguments);
            },
            // To know if the callbacks have already been called at least once
            fired: function () {
                return !!fired;
            },
            count: function () {
                return list.length;
            }
        };
        return new chitu.Callback(self);
    }
    chitu.callbacks = callbacks;
    function fireCallback(callback, args) {
        var results = callback.fire(args);
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
    var crossroads = window['crossroads'];
    $.extend(crossroads, {
        _create: crossroads.create,
        create: function () {
            /// <returns type="Crossroads"/>
            var obj = this._create();
            obj.getRouteData = function (request, defaultArgs) {
                request = request || '';
                defaultArgs = defaultArgs || [];
                // should only care about different requests if ignoreState isn't true
                if (!this.ignoreState &&
                    (request === this._prevMatchedRequest ||
                        request === this._prevBypassedRequest)) {
                    return;
                }
                var routes = this._getMatchedRoutes(request), i = 0, n = routes.length, cur;
                if (n == 0)
                    return null;
                if (n > 1) {
                    throw chitu.Errors.ambiguityRouteMatched(request, 'route1', 'route2');
                }
                return routes[0];
            };
            return obj;
        }
    });
})(chitu || (chitu = {}));
//# sourceMappingURL=Extends.js.map
var chitu;
(function (chitu) {
    var ns = chitu;
    var e = chitu.Errors;
    var PageContainer = (function () {
        function PageContainer(app, node) {
            this.pageCreating = ns.callbacks();
            this.pageCreated = ns.callbacks();
            this.pageShowing = ns.callbacks();
            this.pageShown = ns.callbacks();
            this.init(app, node);
        }
        PageContainer.prototype.init = function (app, node) {
            this._app = app;
            this._node = node;
            this._pageStack = [];
        };
        PageContainer.prototype.on_pageCreating = function (context) {
            return ns.fireCallback(this.pageCreating, [this, context]);
        };
        PageContainer.prototype.on_pageCreated = function (page) {
            //this.pageCreated.fire(this, page);
            return ns.fireCallback(this.pageCreated, [this, page]);
        };
        PageContainer.prototype.on_pageShowing = function (page, args) {
            //this.pageShowing.fire(this, page, args);
            return ns.fireCallback(this.pageShowing, [this, page, args]);
        };
        PageContainer.prototype.on_pageShown = function (page, args) {
            //this.pageShown.fire(this, page, args);
            return ns.fireCallback(this.pageShown, [this, page, args]);
        };
        PageContainer.prototype.application = function () {
            /// <returns type="chitu.Application"/>
            return this._app;
        };
        PageContainer.prototype.node = function () {
            /// <returns type="HTMLElement"/>
            return this._node;
        };
        PageContainer.prototype.currentPage = function () {
            /// <returns type="chitu.Page"/>
            return this._currentPage;
        };
        PageContainer.prototype._createPage = function (url, element) {
            if (!url)
                throw e.argumentNull('url');
            if (typeof url != 'string')
                throw e.paramTypeError('url', 'String');
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
            var view_deferred = this.application().viewFactory.view(routeData); //this.application().viewEngineFactory.getViewEngine(controllerName).view(actionName, routeData.viewPath);
            var context = new ns.ControllerContext(controller, view_deferred, routeData);
            this.on_pageCreating(context);
            var page = new ns.Page(context, element);
            this.on_pageCreated(page);
            return page;
        };
        PageContainer.prototype.showPage = function (url, args) {
            /// <param name="container" type="HTMLElement" canBeNull="false"/>
            /// <param name="url" type="String" canBeNull="false"/>
            /// <param name="args" type="object" canBeNull="true"/>
            /// <returns type="jQuery.Deferred"/>
            args = args || {};
            if (!url)
                throw e.argumentNull('url');
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
            for (var key in pages) {
                if (pages[key] != this._currentPage) {
                    pages[key].visible(false);
                }
            }
            $.extend(args, routeData);
            //this.on_pageShowing(page, args);
            var self = this;
            var result = $.Deferred();
            this.on_pageShowing(page, args).pipe(function () {
                return page.open(args);
            })
                .done($.proxy(function () {
                self._pageStack.push({ page: this.page, url: this.url });
                //=======================================================
                // 说明：由于只能显示一个页面，只有为 currentPage 才显示
                if (this.page != self.currentPage())
                    this.page.visible(false);
                //=======================================================
                this.result.resolve(this.page);
                self.on_pageShown(this.page, args);
            }, { page: page, result: result, url: url }))
                .fail($.proxy(function (error) {
                this.result.reject(this.page, error);
            }, { page: page, result: result, url: url }));
            return result;
        };
        PageContainer.prototype.back = function (args) {
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
            var hash = '#' + item.url.toLowerCase();
            if (hash.localeCompare(window.location.hash.toLowerCase()) != 0) {
                window.location.hash = item.url;
                window.location['skip'] = true;
            }
            current.visible(false);
            if (args)
                item.page.open(args);
            else
                item.page.visible(true);
            //new chitu.Page().open
            //document.body.scrollTop = item.page.scrollTop || '0px';
            this._currentPage = item.page;
            return $.Deferred().resolve();
        };
        return PageContainer;
    })();
    chitu.PageContainer = PageContainer;
})(chitu || (chitu = {}));
//# sourceMappingURL=PageContainer.js.map
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
    var Page = (function () {
        function Page(context, node) {
            this._node = HTMLElement;
            this._visible = true;
            this._loadViewModelResult = null;
            this._showResult = null;
            this._hideResult = null;
            this.created = ns.callbacks();
            this.creating = ns.callbacks();
            this.preLoad = ns.callbacks();
            this.load = ns.callbacks();
            this.closing = ns.callbacks();
            this.closed = ns.callbacks();
            this.scroll = ns.callbacks();
            this.showing = ns.callbacks();
            this.shown = ns.callbacks();
            this.hiding = ns.callbacks();
            this.hidden = ns.callbacks();
            this._type = 'Page';
            if (!context)
                throw e.argumentNull('context');
            if (context['_type'] != 'ControllerContext')
                throw e.paramTypeError('context', 'ControllerContext');
            if (!node)
                throw e.argumentNull('node');
            this._context = context;
            var controllerName = context.routeData().controller;
            var actionName = context.routeData().action;
            var name = controllerName + '.' + actionName;
            var viewDeferred = context.view(); //app.viewEngineFactory.getViewEngine(controllerName).view(actionName);
            var actionDeferred = context.controller().action(actionName);
            this.init(name, viewDeferred, actionDeferred, node);
        }
        Page.prototype.context = function () {
            /// <returns type="chitu.ControllerContext"/>
            return this._context;
        };
        Page.prototype.name = function () {
            return this._name;
        };
        Page.prototype.node = function () {
            /// <returns type="HTMLElement"/>
            return this._node;
        };
        Page.prototype.parent = function () {
            /// <returns type="chitu.Page"/>
            return this._parent;
        };
        Page.prototype.visible = function (value) {
            var is_visible = $(this.node()).is(':visible');
            if (value === undefined)
                return is_visible; //this._visible;
            if (value == is_visible)
                return;
            if (!value) {
                this.on_hiding({});
                $(this.node()).hide();
                this.on_hidden({});
            }
            else {
                this.on_showing({});
                $(this.node()).show();
                this.on_shown({});
            }
            this._visible = value;
        };
        Page.prototype.init = function (name, viewDeferred, actionDeferred, node) {
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
            this._parent;
            this._node = node;
            this._visible = true;
            $(this._node).hide();
        };
        Page.prototype.on_creating = function (context) {
            return eventDeferred(this.creating, this, context);
        };
        Page.prototype.on_created = function () {
            return eventDeferred(this.created, this);
        };
        Page.prototype.on_preLoad = function (args) {
            return eventDeferred(this.preLoad, this, args);
        };
        Page.prototype.on_load = function (args) {
            return eventDeferred(this.load, this, args);
        };
        Page.prototype.on_closing = function (args) {
            return eventDeferred(this.closing, this, args);
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
        Page.prototype._appendNode = function (childNode) {
            /// <param name="childNode" type="HTMLElement"/>
            if (childNode == null)
                throw e.argumentNull('childNode');
            $(this._node).append(childNode);
        };
        Page.prototype._loadViewModel = function () {
            if (this._loadViewModelResult)
                return this._loadViewModelResult;
            var page = this;
            this._loadViewModelResult = this._viewDeferred.pipe(function (html) {
                u.log('Load view success, page:{0}.', [page['_name']]);
                $(page.node()).html(html);
                return page._actionDeferred;
            })
                .pipe(function (action) {
                /// <param name="action" type="chitu.Action"/>
                var result = action.execute(page);
                page.on_created();
                if (u.isDeferred(result))
                    return result;
                return $.Deferred().resolve();
            })
                .fail(function () {
                page._loadViewModelResult = null;
                u.log('Load view or action fail, page：{0}.', [page['_name']]);
            });
            return this._loadViewModelResult;
        };
        Page.prototype.open = function (args) {
            /// <summary>
            /// Show the page.
            /// </summary>
            /// <param name="args" type="Object">
            /// The value passed to the show event functions.
            /// </param>
            /// <returns type="jQuery.Deferred"/>
            var self = this;
            this._showResult = this.on_preLoad(args).pipe(function () {
                return self._loadViewModel();
            })
                .pipe(function () {
                self.on_showing(args);
                return self.on_load(args);
            });
            this._showResult.done($.proxy(function () {
                self._hideResult = null;
                $(self.node()).show();
                self.on_shown(this.args);
            }, { args: args }));
            return this._showResult;
        };
        Page.prototype.close = function (args) {
            /// <summary>
            /// Hide the page.
            /// </summary>
            /// <param name="args" type="Object" canBeNull="true">
            /// The value passed to the hide event functions.
            /// </param>
            /// <returns type="jQuery.Deferred"/>
            var self = this;
            if (!this._hideResult) {
                this._hideResult = self.on_closing(args).pipe(function () {
                    self.visible(false);
                    return self.on_closed(args);
                });
            }
            return this._hideResult.always(function () {
                self._hideResult = null;
            });
        };
        return Page;
    })();
    chitu.Page = Page;
})(chitu || (chitu = {}));
//# sourceMappingURL=Page.js.map
/// <reference path="scripts/typings/requirejs/require.d.ts" />
var chitu;
(function (chitu) {
    var ns = chitu;
    var e = ns.Errors;
    var u = ns.Utility;
    var crossroads = window['crossroads'];
    function interpolate(pattern, data) {
        var http_prefix = 'http://'.toLowerCase();
        if (pattern.substr(0, http_prefix.length).toLowerCase() == http_prefix) {
            var link = document.createElement('a');
            //  set href to any path
            link.setAttribute('href', pattern);
            pattern = link.pathname; //pattern.substr(http_prefix.length);
            var route = crossroads.addRoute(pattern);
            return http_prefix + route.interpolate(data);
        }
        var route = crossroads.addRoute(pattern);
        return route.interpolate(data);
    }
    var Controller = (function () {
        function Controller(routeData, actionLocationFormater) {
            this._actions = {};
            if (!routeData)
                throw e.argumentNull('routeData');
            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');
            if (!actionLocationFormater)
                throw e.argumentNull('actionLocationFormater');
            this._name = routeData.controller;
            this._routeData = routeData;
            this._actionLocationFormater = actionLocationFormater;
            this._actions = {};
            this.actionCreated = chitu.callbacks();
        }
        Controller.prototype.actionLocationFormater = function () {
            return this._actionLocationFormater;
        };
        Controller.prototype.name = function () {
            return this._name;
        };
        Controller.prototype.getLocation = function (actionName) {
            /// <param name="actionName" type="String"/>
            /// <returns type="String"/>
            if (!actionName)
                throw e.argumentNull('actionName');
            if (typeof actionName != 'string')
                throw e.paramTypeError('actionName', 'String');
            var data = $.extend(this._routeData, { action: actionName });
            return interpolate(this.actionLocationFormater(), data);
        };
        Controller.prototype.action = function (name) {
            /// <param name="value" type="chitu.Action" />
            /// <returns type="jQuery.Deferred" />
            if (!name)
                throw e.argumentNull('name');
            if (typeof name != 'string')
                throw e.paramTypeError('name', 'String');
            var self = this;
            if (!this._actions[name]) {
                this._actions[name] = this._createAction(name).fail($.proxy(function () {
                    self._actions[this.actionName] = null;
                }, { actionName: name }));
            }
            return this._actions[name];
        };
        Controller.prototype._createAction = function (actionName) {
            /// <param name="actionName" type="String"/>
            /// <returns type="jQuery.Deferred"/>
            if (!actionName)
                throw e.argumentNull('actionName');
            var self = this;
            var url = this.getLocation(actionName);
            var result = $.Deferred();
            require([url], $.proxy(function (obj) {
                //加载脚本失败
                if (!obj) {
                    console.warn(u.format('加载活动“{1}.{0}”失败，为该活动提供默认的值。', [this.actionName, self.name()]));
                    obj = { func: function () { } };
                }
                var func = obj.func;
                if (!$.isFunction(func))
                    throw ns.Errors.modelFileExpecteFunction(this.actionName);
                var action = new Action(self, this.actionName, func);
                self.actionCreated.fire(self, action);
                this.result.resolve(action);
            }, { actionName: actionName, result: result }), $.proxy(function (err) {
                console.warn(u.format('加载活动“{1}.{0}”失败，为该活动提供默认的值。', [this.actionName, self.name()]));
                var action = new Action(self, this.actionName, function () { });
                self.actionCreated.fire(self, action);
                this.result.resolve(action);
                //this.result.reject(err);
            }, { actionName: actionName, result: result }));
            return result;
        };
        return Controller;
    })();
    chitu.Controller = Controller;
    var Action = (function () {
        function Action(controller, name, handle) {
            /// <param name="controller" type="chitu.Controller"/>
            /// <param name="name" type="String">Name of the action.</param>
            /// <param name="handle" type="Function"/>
            if (!controller)
                throw e.argumentNull('controller');
            if (!name)
                throw e.argumentNull('name');
            if (!handle)
                throw e.argumentNull('handle');
            if (!$.isFunction(handle))
                throw e.paramTypeError('handle', 'Function');
            this._name = name;
            this._handle = handle;
        }
        Action.prototype.name = function () {
            return this._name;
        };
        Action.prototype.execute = function (page) {
            /// <param name="page" type="chitu.Page"/>
            /// <returns type="jQuery.Deferred"/>
            if (!page)
                throw e.argumentNull('page');
            if (page._type != 'Page')
                throw e.paramTypeError('page', 'Page');
            var result = this._handle.apply({}, [page]);
            return u.isDeferred(result) ? result : $.Deferred().resolve();
        };
        return Action;
    })();
})(chitu || (chitu = {}));
//# sourceMappingURL=Controller.js.map
var chitu;
(function (chitu) {
    var ControllerContext = (function () {
        function ControllerContext(controller, view, routeDat) {
            this._controller = controller;
            this._view = view;
            this._controller = routeDat;
        }
        ControllerContext.prototype.controller = function () {
            /// <returns type="chitu.Controller"/>
            return this._controller;
        };
        ControllerContext.prototype.view = function () {
            /// <returns type="jQuery.Deferred"/>
            return this._view;
        };
        ControllerContext.prototype.routeData = function () {
            /// <returns type="chitu.RouteData"/>
            return this._routeData;
        };
        return ControllerContext;
    })();
    chitu.ControllerContext = ControllerContext;
})(chitu || (chitu = {}));
//# sourceMappingURL=ControllerContext.js.map
var chitu;
(function (chitu) {
    var e = chitu.Errors;
    var ns = chitu;
    var ControllerFactory = (function () {
        function ControllerFactory(actionLocationFormater) {
            this._controllers = {};
            if (!actionLocationFormater)
                throw e.argumentNull('actionLocationFormater');
            this._controllers = {};
            this._actionLocationFormater = actionLocationFormater;
        }
        ControllerFactory.prototype.controllers = function () {
            return this._controllers;
        };
        ControllerFactory.prototype.createController = function (routeData) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="ns.Controller"/>
            if (!routeData.controller)
                throw e.routeDataRequireController();
            return new ns.Controller(routeData, routeData.actionPath || this.actionLocationFormater());
        };
        ControllerFactory.prototype.actionLocationFormater = function () {
            return this._actionLocationFormater;
        };
        ControllerFactory.prototype.getController = function (routeData) {
            /// <summary>Gets the controller by routeData.</summary>
            /// <param name="routeData" type="Object"/>
            /// <returns type="chitu.Controller"/>
            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');
            if (!routeData.controller)
                throw e.routeDataRequireController();
            if (!this._controllers[routeData.controller])
                this._controllers[routeData.controller] = this.createController(routeData);
            return this._controllers[routeData.controller];
        };
        return ControllerFactory;
    })();
    chitu.ControllerFactory = ControllerFactory;
})(chitu || (chitu = {}));
//# sourceMappingURL=ControllerFactory.js.map
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

        //ViewEngine.prototype.viewFileExtension = options.viewFileExtension || 'html';

        $.proxy(func, this)(options);

        this.controllerFactory = new ns.ControllerFactory(options.actionPath);
        //this.viewEngineFactory = new ns.ViewEngineFacotry(options.viewPath);
        this.viewFactory = new ns.ViewFactory(options.viewPath);

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

        controller: function (routeData) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="chitu.Controller"/>
            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');

            if (!routeData)
                throw e.argumentNull('routeData');
            
            //if (typeof name != 'string') throw e.paramTypeError('name', 'String');

            return this.controllerFactory.getController(routeData);
        },
        action: function (routeData) {
            /// <param name="routeData" type="Object"/>
            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');

            if (!routeData)
                throw e.argumentNull('routeData');

            var controllerName = routeData.controller;
            if (!controllerName) throw e.argumentNull('name');
            if (typeof controllerName != 'string') throw e.routeDataRequireController();

            var actionName = routeData.action;
            if (!actionName) throw e.argumentNull('name');
            if (typeof actionName != 'string') throw e.routeDataRequireAction();

            var controller = this.controller(routeData);
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