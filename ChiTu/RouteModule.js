(function (ns) {
    var u = ns.utility;
    var e = ns.Error;

    ns.RouteData = function (route, values) {
        this.init(route, values);
    };
    ns.RouteData.prototype = {
        init: function (route, values) {
            /// <param name="route" type="ns.Route"/>
            this._route = route;
            this._values = values;
            $.extend(this._values, route.defaults());
        },
        route: function () {
            /// <returns type="chitu.Route"/>
            return this._route;
        },
        values: function () {
            return this._values;
        }
    };

    ns.Route = function (source, name, pattern, defaults) {
        /// <param name="source" type="Route"/>
       
        this.init(name, pattern, defaults);
    };
    ns.Route.prototype = {
        init: function (name, url, defaults) {
            this._name = name;
            this._defaults = defaults;
            this._url = url;
        },
        name: function () {
            return this._name;
        },
        defaults: function () {
            return this._defaults;
        },
        url: function () {
            return this._url;
        }
    };

    ns.RouteCollection = function () {
        this._init();
    };
    ns.RouteCollection.defaultRouteName = 'default';
    ns.RouteCollection.prototype = {
        _defaults: {},
        _routeHadle: function (args) {
            var route = this.route;
            var routes = this.routes;
            var values = $.extend(route.defaults(), args);
            if (!values.controller)
                throw new Error('The parse result of route does not contains controler.');

            routes.routeMatched.fire(route.name(), values);
        },
        _init: function () {
            this._source = crossroads.create();
            this._source.ignoreCase = true;
            this._source.normalizeFn = crossroads.NORM_AS_OBJECT;
            this._priority = 0;
        },
        count: function () {
            return this._source.getNumRoutes();
        },
        routeMatched: $.Callbacks(),
        mapRoute: function (args) {//name, url, defaults
            /// <param name="args" type="Objecct"/>
            args = args || {};

            var name = args.name;
            var url = args.url;
            var defaults = args.defaults;
            var rules = args.rules || {};

            if (!name) throw e.argumentNull('name');
            if (!url) throw e.argumentNull('url');

            this._priority = this._priority + 1;


            var self = this;
            var originalRoute = this._source.addRoute(url, function (args) {
                var values = $.extend(defaults, args);
                self.routeMatched.fire(name, values);
            }, this._priority);

            var route = new chitu.Route(originalRoute, name, url, defaults);
            originalRoute.rules = rules;
            originalRoute.newRoute = route;

            if (this[name])
                throw e.routeExists(name);

            this[name] = route;
            if (name == ns.RouteCollection.defaultRouteName) {
                this._defaults = defaults;
            }
            return route;
        },
        //parse: function (url) {
        //    if (!url) {
        //        var c = this._defaults.controller;
        //        var a = this._defaults.action;
        //        if (c != null && a != null)
        //            this.routeMatched.fire(ns.RouteCollection.defaultRouteName, this._defaults);

        //        return;
        //    }
        //    return this._source.parse(url);
        //},
        getRouteData: function (url) {
            /// <returns type="chitu.RouteData"/>
            var data = this._source.getRouteData(url);
            if (data == null)
                throw e.canntParseUrl(url);

            var values = {};
            var paramNames = data.route._paramsIds || [];
            for (var i = 0; i < paramNames.length; i++) {
                var key = paramNames[i];
                values[key] = data.params[0][key];
            }

            var routeData = new ns.RouteData(data.route.newRoute, values);
            return routeData;
        },
        getUrl: function (route, routeData) {

        }
    }

})(chitu);