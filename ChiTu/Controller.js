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
            pattern = decodeURI(link.pathname); //pattern.substr(http_prefix.length);
            var route = crossroads.addRoute(pattern);
            return http_prefix + link.host + route.interpolate(data);
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
            this.actionCreated = chitu.Callbacks();
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
            return interpolate(this._routeData.actionPath || this.actionLocationFormater(), data);
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
    function action(deps, filters, func) {
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
        define(deps, $.proxy(function () {
            var args = Array.prototype.slice.call(arguments, 0);
            var func = this.func;
            var filters = this.filters;
            return {
                func: function (page) {
                    args.unshift(page);
                    return func.apply(func, args);
                },
                filters: filters
            };
        }, { func: func, filters: filters }));
        return func;
    }
    chitu.action = action;
    ;
})(chitu || (chitu = {}));
//# sourceMappingURL=Controller.js.map