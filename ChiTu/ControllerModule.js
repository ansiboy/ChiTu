(function (ns) {
    var e = ns.Error;
    var u = ns.utility;

    function interpolate(pattern, data) {
        var http_prefix = 'http://'.toLowerCase();
        if (pattern.substr(0, http_prefix.length).toLowerCase() == http_prefix) {
            var link = document.createElement('a');
            //  set href to any path
            link.setAttribute('href', pattern);

            //  get any piece of the url you're interested in
            //link.hostname;  //  'example.com'
            //link.port;      //  12345
            //link.search;    //  '?startIndex=1&pageSize=10'
            //link.pathname;  //  '/blog/foo/bar'
            //link.protocol;  //  'http:'

            pattern = link.pathname; //pattern.substr(http_prefix.length);
            var route = crossroads.addRoute(pattern);
            return http_prefix + route.interpolate(data);
        }

        var route = crossroads.addRoute(pattern);
        return route.interpolate(data);
    }

    ns.Controller = function (routeData, actionLocationFormater) {
        if (!routeData) throw e.argumentNull('routeData');
        if (typeof routeData !== 'object') throw e.paramTypeError('routeData', 'object');

        if (!actionLocationFormater) throw e.argumentNull('actionLocationFormater');

        this._name = routeData.controller;
        this._routeData = routeData;
        this._actionLocationFormater = actionLocationFormater;
        this._actions = {};



        this.actionCreated = chitu.Callbacks();
    };

    ns.Controller.prototype = {
        actionLocationFormater: function () {
            return this._actionLocationFormater;
        },
        name: function () {
            return this._name;
        },
        getLocation: function (actionName) {
            /// <param name="actionName" type="String"/>
            /// <returns type="String"/>
            if (!actionName) throw e.argumentNull('actionName');
            if (typeof actionName != 'string') throw e.paramTypeError('actionName', 'String');

            var data = $.extend({ action: actionName }, this._routeData);
            return interpolate(this.actionLocationFormater(), data);
        },
        action: function (name) {
            /// <param name="value" type="chitu.Action" />
            /// <returns type="jQuery.Deferred" />
            if (!name) throw e.argumentNull('name');
            if (typeof name != 'string') throw e.paramTypeError('name', 'String');

            var self = this;
            if (!this._actions[name]) {
                this._actions[name] = this._createAction(name).fail($.proxy(
                    function () {
                        self._actions[this.actionName] = null;
                    },
                    { actionName: name })
                );
            }

            return this._actions[name];
        },
        _createAction: function (actionName) {
            /// <param name="actionName" type="String"/>
            /// <returns type="jQuery.Deferred"/>
            if (!actionName)
                throw e.argumentNull('actionName');

            var self = this;
            var url = this.getLocation(actionName);
            var result = $.Deferred();

            require([url],
                $.proxy(function (obj) {
                    //加载脚本失败
                    if (!obj) {
                        console.warn(u.format('加载活动“{1}.{0}”失败，为该活动提供默认的值。', this.actionName, self.name()));
                        obj = { func: function () { } };
                        //result.reject();
                    }

                    var func = obj.func;

                    if (!$.isFunction(func))
                        throw ns.Error.modelFileExpecteFunction(this.actionName);

                    var action = new ns.Action(self, this.actionName, func);
                    self.actionCreated.fire(self, action);

                    this.result.resolve(action);
                }, { actionName: actionName, result: result }),

                $.proxy(function (err) {
                    console.warn(u.format('加载活动“{1}.{0}”失败，为该活动提供默认的值。', this.actionName, self.name()));
                    var action = new ns.Action(self, this.actionName, function () { });
                    self.actionCreated.fire(self, action);
                    this.result.resolve(action);
                    //this.result.reject(err);
                }, { actionName: actionName, result: result })
           );

            return result;
        }
    };

    ns.ControllerFactory = function (actionLocationFormater) {
        if (!actionLocationFormater)
            throw e.argumentNull('actionLocationFormater');

        this._controllers = {};
        this._actionLocationFormater = actionLocationFormater;
    };

    ns.ControllerFactory.prototype = {
        controllers: function () {
            return this._controllers;
        },
        createController: function (routeData) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="ns.Controller"/>
            if (!routeData.controller)
                throw e.routeDataRequireController();

            return new ns.Controller(routeData, routeData.actionPath || this.actionLocationFormater());
        },
        actionLocationFormater: function () {
            return this._actionLocationFormater;
        },
        getController: function (routeData) {
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
        }
    };

    ns.Action = function (controller, name, handle) {
        /// <param name="controller" type="chitu.Controller"/>
        /// <param name="name" type="String">Name of the action.</param>
        /// <param name="handle" type="Function"/>

        if (!controller) throw e.argumentNull('controller');
        if (!name) throw e.argumentNull('name');
        if (!handle) throw e.argumentNull('handle');
        if (!$.isFunction(handle)) throw e.paramTypeError('handle', 'Function');

        this._name = name;
        this._handle = handle;
        //this.executing = ns.Callbacks();
        //this.executed = ns.Callbacks();
    };
    ns.Action.prototype = {
        name: function () {
            return this._name;
        },
        execute: function (page) {
            /// <param name="page" type="chitu.Page"/>
            /// <returns type="jQuery.Deferred"/>
            if (!page) throw e.argumentNull('page');
            if (page._type != 'Page') throw e.paramTypeError('page', 'Page');

            var result = this._handle.apply(ns.app, [page]);
            return u.isDeferred(result) ? result : $.Deferred().resolve();
        }
    };

    ns.ViewFactory = function (viewLocationFormater) {
        this._viewLocationFormater = viewLocationFormater;
        this._views = [];
    };

    ns.ViewFactory.prototype = {
        view: function (routeData) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="jQuery.Deferred"/>

            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');

            if (!routeData.controller)
                throw e.routeDataRequireController();

            if (!routeData.action)
                throw e.routeDataRequireAction();

            var viewLocationFormater = this._viewLocationFormater || routeData.viewPath;
            if (!viewLocationFormater)
                return $.Deferred().resolve('');

            var url = interpolate(viewLocationFormater, routeData);
            var self = this;
            if (!this._views[routeData.action]) {

                this._views[routeData.action] = $.Deferred();

                require(['text!' + url],
                    $.proxy(function (html) {
                        if (html != null)
                            this.deferred.resolve(html);
                        else
                            this.deferred.reject();
                    },
                    { deferred: this._views[routeData.action] }),

                    $.proxy(function (err) {
                        this.deferred.reject(err);
                    },
                    { deferred: this._views[routeData.action] })
                );
            }

            return this._views[routeData.action];

        }
    }

    ns.action = ns.register = function (deps, filters, func) {
        /// <param name="deps" type="Array" canBeNull="true"/>
        /// <param name="filters" type="Array" canBeNull="true"/>
        /// <param name="func" type="Function" canBeNull="false"/>

        switch (arguments.length) {
            case 0:
                throw e.argumentNull('func');

            case 1:
                if (typeof arguments[0] != 'function')
                    throw e.paramTypeError('arguments[0]', 'Function');

                func = deps;
                filters = deps = [];
                break;

            case 2:
                func = filters;
                if (typeof func != 'function')
                    throw e.paramTypeError('func', 'Function');

                if (!$.isArray(deps))
                    throw e.paramTypeError('deps', 'Array');

                if (deps.length == 0) {
                    deps = filters = [];
                }
                else if (typeof deps[0] == 'function') {
                    filters = deps;
                    deps = [];
                }
                else {
                    filters = [];
                }

                break;
        }

        for (var i = 0; i < deps.length; i++) {
            if (typeof deps[i] != 'string')
                throw e.paramTypeError('deps[' + i + ']', 'string');
        }

        for (var i = 0; i < filters.length; i++) {
            if (typeof filters[i] != 'function')
                throw e.paramTypeError('filters[' + i + ']', 'function');
        }

        if (!$.isFunction(func))
            throw e.paramTypeError('func', 'function');

        define(deps, $.proxy(
            function () {
                var args = Array.prototype.slice.call(arguments, 0);
                var func = this.func;
                var filters = this.filters;

                return {
                    func: function (page) {
                        args.unshift(page);
                        return func.apply(func, args);
                    },
                    filters: filters
                }
            },
            { func: func, filters: filters })
        );

        return func;
    };

    ns.ControllerContext = function (controller, view, routeData) {
        /// <param name="controller" type="chitu.Controller"/>
        /// <param name="view" type="jQuery.Deferred"/>
        /// <param name="routeData" type="chitu.RouteData"/>

        this._controller = controller;
        this._view = view;
        this._routeData = routeData;
    };
    ns.ControllerContext.prototype = {
        _type: 'ControllerContext',
        controller: function () {
            /// <returns type="chitu.Controller"/>
            return this._controller;
        },
        view: function () {
            /// <returns type="jQuery.Deferred"/>
            return this._view;
        },
        routeData: function () {
            /// <returns type="chitu.RouteData"/>
            return this._routeData;
        }
    };
    //new ns.ControllerContext().routeData().route().name
})(chitu);