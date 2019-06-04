export class Errors {
    static pageNodeNotExists(pageName: string): Error {
        let msg = `Page node named ${pageName} is not exists.`;
        return new Error(msg);
    }
    static actionCanntNull(pageName: string) {
        let msg = `Action of '${pageName}' can not be null.`;
        return new Error(msg);
    }
    public static argumentNull(paramName: string): Error {
        var msg = `The argument "${paramName}" cannt be null.`;
        return new Error(msg);
    }
    public static modelFileExpecteFunction(script: string): Error {
        var msg = `The eval result of script file "${script}" is expected a function.`;
        return new Error(msg);
    }
    public static paramTypeError(paramName: string, expectedType: string): Error {
        var msg = `The param "${paramName}" is expected "${expectedType}" type.`;//Utility.format(, paramName, expectedType);
        return new Error(msg);
    }
    public static paramError(msg: string): Error {
        return new Error(msg);
    }
    public static pathPairRequireView(index: number): Error {
        var msg = `The view value is required for path pair, but the item with index "${index}" is miss it.`;
        return new Error(msg);
    }
    public static notImplemented(name: string): Error {
        var msg = `'The method "${name}" is not implemented.'`;
        return new Error(msg);
    }
    public static routeExists(name: string): Error {
        var msg = `Route named "${name}" is exists.`;
        return new Error(msg);
    }
    public static noneRouteMatched(url: string): Error {
        var msg = `None route matched with url "${url}".`;
        var error = new Error(msg);
        return error;
    }
    public static emptyStack(): Error {
        return new Error('The stack is empty.');
    }
    public static canntParseUrl(url: string): Error {
        var msg = `Can not parse the url "${url}" to route data.`;
        return new Error(msg);
    }
    public static canntParseRouteString(routeString: string): Error {
        var msg = `Can not parse the route string "${routeString}" to route data.;`
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
    public static viewCanntNull(): Error {
        var msg = 'The view or viewDeferred of the page cannt null.';
        return new Error(msg);
    }
    public static createPageFail(pageName: string): Error {
        var msg = `Create page "${pageName}" fail.`;
        return new Error(msg);
    }
    public static actionTypeError(pageName: string): Error {
        let msg = `The action in page '${pageName}' is expect as function.`;
        return new Error(msg);
    }
    public static canntFindAction(pageName: string): Error {
        let msg = `Cannt find action in page '${pageName}', is the exports has default field?`;
        return new Error(msg);
    }
    public static exportsCanntNull(pageName: string): Error {
        let msg = `Exports of page '${pageName}' is null.`;
        return new Error(msg);
    }
    public static scrollerElementNotExists(): Error {
        let msg = "Scroller element is not exists.";
        return new Error(msg);
    }
    public static resourceExists(resourceName: string, pageName: string) {
        let msg = `Rosource '${resourceName}' is exists in the resources of page '${pageName}'.`;
        return new Error(msg);
    }
    public static siteMapRootCanntNull() {
        let msg = `The site map root node can not be null.`;
        return new Error(msg);
    }
    public static duplicateSiteMapNode(name: string) {
        let msg = `The site map node ${name} is exists.`
        return new Error(msg);
    }
    static unexpectedNullValue() {
        let msg = `Unexpected null value.`
        return new Error(msg);
    }
    static containerIsNotExists(name: string) {
        let msg = `Container '${name}' is not exists`
        return new Error(msg)
    }
}

