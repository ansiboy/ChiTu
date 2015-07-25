module chitu {
    var u = chitu.Utility;
    export class Errors {
        public static argumentNull(paramName: string) {
            var msg = u.format('The argument "{0}" cannt be null.', [paramName]);

            return new Error(msg);
        }
        public static modelFileExpecteFunction(script) {
            var msg = u.format('The eval result of script file "{0}" is expected a function.', script);
            return new Error(msg);
        }
        public static paramTypeError(paramName: string, expectedType: string) {
            /// <param name="paramName" type="String"/>
            /// <param name="expectedType" type="String"/>

            var msg = u.format('The param "{0}" is expected "{1}" type.', [paramName, expectedType]);
            return new Error(msg);
        }
        public static viewNodeNotExists(name) {
            var msg = u.format('The view node "{0}" is not exists.', name);
            return new Error(msg);
        }
        public static pathPairRequireView(index) {
            var msg = u.format('The view value is required for path pair, but the item with index "{0}" is miss it.', index);
            return new Error(msg);
        }
        public static notImplemented(name) {
            var msg = u.format('The method "{0}" is not implemented.', name);
            return new Error(msg);
        }
        public static routeExists(name) {
            var msg = u.format('Route named "{0}" is exists.', name);
            return new Error(msg);
        }
        public static routeResultRequireController(routeName) {
            var msg = u.format('The parse result of route "{0}" does not contains controler.', routeName);
            return new Error(msg);
        }
        public static routeResultRequireAction(routeName) {
            var msg = u.format('The parse result of route "{0}" does not contains action.', routeName);
            return new Error(msg);
        }
        public static ambiguityRouteMatched(url, routeName1, routeName2) {
            var msg = u.format('Ambiguity route matched, {0} is match in {1} and {2}.', [url, routeName1, routeName2]);
            return new Error(msg);
        }
        public static noneRouteMatched(url): Error {
            var msg = u.format('None route matched with url "{0}".', url);
            var error = new Error(msg);
            return error;
        }
        public static emptyStack(): Error {
            return new Error('The stack is empty.');
        }
        public static canntParseUrl(url: string) {
            var msg = u.format('Can not parse the url "{0}" to route data.', [url]);
            return new Error(msg);
        }
        public static routeDataRequireController(): Error {
            var msg = 'The route data does not contains a "controller" file.';
            return new Error(msg);
        }
        public static routeDataRequireAction(): Error {
            var msg = 'The route data does not contains a "action" file.';
            return new Error(msg);
        }
        public static parameterRequireField(fileName, parameterName) {
            var msg = u.format('Parameter {1} does not contains field {0}.', [fileName, parameterName]);
            return new Error(msg);
        }
    }
} 

