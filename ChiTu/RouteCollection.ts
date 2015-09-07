module chitu {

    var ns = chitu;
    var e = chitu.Errors;

    export class RouteCollection {
        _source: any
        _priority: number
        _defaultRoute: Route
        static defaultRouteName: string = 'default';

        _defaults: {}

        constructor() {
            this._init();
        }

        _init() {
            var crossroads = window['crossroads']
            this._source = crossroads.create();
            this._source.ignoreCase = true;
            this._source.normalizeFn = crossroads.NORM_AS_OBJECT;
            this._priority = 0;
        }
        count() {
            return this._source.getNumRoutes();
        }

        mapRoute(args) {//name, url, defaults
            /// <param name="args" type="Objecct"/>
            args = args || {};

            var name = args.name;
            var url = args.url;
            var defaults = args.defaults;
            var rules = args.rules || {};

            if (!name) throw e.argumentNull('name');
            if (!url) throw e.argumentNull('url');

            this._priority = this._priority + 1;

            var route = new chitu.Route(name, url, defaults);
            route.viewPath = args.viewPath;
            route.actionPath = args.actionPath;
            route.pageName = args.pageName;

            var originalRoute = this._source.addRoute(url, function (args) {
                //var values = $.extend(defaults, args);
                //self.routeMatched.fire([name, values]);
            }, this._priority);

            originalRoute.rules = rules;
            originalRoute.newRoute = route;

            if (this._defaultRoute == null) {
                this._defaultRoute = route;
                if (this._defaultRoute.viewPath == null)
                    throw new Error('default route require view path.');

                if (this._defaultRoute.actionPath == null)
                    throw new Error('default route require action path.');
            }

            route.viewPath = route.viewPath || this._defaultRoute.viewPath;
            route.actionPath = route.actionPath || this._defaultRoute.actionPath;

            return route;
        }

        getRouteData(url): RouteData {
            /// <returns type="Object"/>
            var data = this._source.getRouteData(url);
            if (data == null)
                throw e.canntParseUrl(url);

            var values: any = {};
            var paramNames = data.route._paramsIds || [];
            for (var i = 0; i < paramNames.length; i++) {
                var key = paramNames[i];
                values[key] = data.params[0][key];
            }

            var routeData = new RouteData();
            routeData.values(values);
            routeData.actionPath(data.route.newRoute.actionPath);
            routeData.viewPath(data.route.newRoute.viewPath);
            routeData.pageName(data.route.newRoute.pageName);

            return routeData;
        }
    }
} 