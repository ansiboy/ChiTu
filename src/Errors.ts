namespace chitu {
    export class Errors {
        public static argumentNull(paramName: string): Error {
            var msg = Utility.format('The argument "{0}" cannt be null.', paramName);
            return new Error(msg);
        }
        public static modelFileExpecteFunction(script): Error {
            var msg = Utility.format('The eval result of script file "{0}" is expected a function.', script);
            return new Error(msg);
        }
        public static paramTypeError(paramName: string, expectedType: string): Error {
            var msg = Utility.format('The param "{0}" is expected "{1}" type.', paramName, expectedType);
            return new Error(msg);
        }
        public static paramError(msg: string): Error {
            return new Error(msg);
        }
        public static viewNodeNotExists(name): Error {
            var msg = Utility.format('The view node "{0}" is not exists.', name);
            return new Error(msg);
        }
        public static pathPairRequireView(index): Error {
            var msg = Utility.format('The view value is required for path pair, but the item with index "{0}" is miss it.', index);
            return new Error(msg);
        }
        public static notImplemented(name): Error {
            var msg = Utility.format('The method "{0}" is not implemented.', name);
            return new Error(msg);
        }
        public static routeExists(name): Error {
            var msg = Utility.format('Route named "{0}" is exists.', name);
            return new Error(msg);
        }
        public static ambiguityRouteMatched(url, routeName1, routeName2): Error {
            var msg = Utility.format('Ambiguity route matched, {0} is match in {1} and {2}.', url, routeName1, routeName2);
            return new Error(msg);
        }
        public static noneRouteMatched(url): Error {
            var msg = Utility.format('None route matched with url "{0}".', url);
            var error = new Error(msg);
            return error;
        }
        public static emptyStack(): Error {
            return new Error('The stack is empty.');
        }
        public static canntParseUrl(url: string): Error {
            var msg = Utility.format('Can not parse the url "{0}" to route data.', url);
            return new Error(msg);
        }
        public static canntParseRouteString(routeString: string): Error {
            var msg = Utility.format('Can not parse the route string "{0}" to route data.', routeString);
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
        public static parameterRequireField(fileName, parameterName): Error {
            var msg = Utility.format('Parameter {1} does not contains field {0}.', fileName, parameterName);
            return new Error(msg);
        }
        public static viewCanntNull(): Error {
            var msg = 'The view or viewDeferred of the page cannt null.';
            return new Error(msg);
        }
        public static createPageFail(pageName: string): Error {
            var msg = Utility.format('Create page "{0}" fail.', pageName);
            return new Error(msg);
        }
        public static actionTypeError(pageName: string): Error {
            let msg = `The action in page '${pageName}' is expect as function or Class.`;
            return new Error(msg);
        }
        public static canntFindAction(pageName){
            let msg = `Cannt find action in page '${pageName}', is the exports has default field?`;
            return  new Error(msg);
        }
        public static scrollerElementNotExists(): Error {
            let msg = "Scroller element is not exists.";
            return new Error(msg);
        }
    }
}

