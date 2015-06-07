(function (ns) {
    var u = ns.utility;
    ns.Error = {
        argumentNull: function (paramName) {
            var msg = u.format('The argument "{0}" cannt be null.', paramName);
            return new Error(msg);
        },
        modelFileExpecteFunction: function (script) {
            var msg = u.format('The eval result of script file "{0}" is expected a function.', script);
            return new Error(msg);
        },
        paramTypeError: function (paramName, expectedType) {
            /// <param name="paramName" type="String"/>
            /// <param name="expectedType" type="String"/>

            var msg = u.format('The param "{0}" is expected "{1}" type.', paramName, expectedType);
            return new Error(msg);
        },
        viewNodeNotExists: function (name) {
            var msg = u.format('The view node "{0}" is not exists.', name);
            return new Error(msg);
        },
        pathPairRequireView: function (index) {
            var msg = u.format('The view value is required for path pair, but the item with index "{0}" is miss it.', index);
            return new Error(msg);
        },
        notImplemented: function (name) {
            var msg = u.format('The method "{0}" is not implemented.', name);
            return new Error(msg);
        },
        routeExists: function (name) {
            var msg = u.format('Route named "{0}" is exists.', name);
            return new Error(msg);
        },
        routeResultRequireController: function (routeName) {
            var msg = u.format('The parse result of route "{0}" does not contains controler.', routeName);
            return new Error(msg);
        },
        routeResultRequireAction: function (routeName) {
            var msg = u.format('The parse result of route "{0}" does not contains action.', routeName);
            return new Error(msg);
        },
        ambiguityRouteMatched: function (url, routeName1, routeName2) {
            var msg = u.format('Ambiguity route matched, {0} is match in {1} and {2}.', url, routeName1, routeName2);
            return new Error(msg);
        },
        noneRouteMatched: function (url) {
            var msg = u.format('None route matched with url "{0}".', url);
            var error = new Error(msg);
            return error;
        },
        emptyStack: function () {
            return new Error('The stack is empty.');
        },
        canntParseUrl: function (url) {
            var msg = u.format('Can not parse the url "{0}" to route data.', url);
            return new Error(msg);
        },
        routeDataRequireController: function () {
            var msg = 'The route data does not contains a "controller" file.';
            return new Error(msg);
        },
        routeDataRequireAction: function () {
            var msg = 'The route data does not contains a "action" file.';
            return new Error(msg);
        }

    }

})(chitu);