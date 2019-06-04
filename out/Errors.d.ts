export declare class Errors {
    static pageNodeNotExists(pageName: string): Error;
    static actionCanntNull(pageName: string): Error;
    static argumentNull(paramName: string): Error;
    static modelFileExpecteFunction(script: string): Error;
    static paramTypeError(paramName: string, expectedType: string): Error;
    static paramError(msg: string): Error;
    static pathPairRequireView(index: number): Error;
    static notImplemented(name: string): Error;
    static routeExists(name: string): Error;
    static noneRouteMatched(url: string): Error;
    static emptyStack(): Error;
    static canntParseUrl(url: string): Error;
    static canntParseRouteString(routeString: string): Error;
    static routeDataRequireController(): Error;
    static routeDataRequireAction(): Error;
    static viewCanntNull(): Error;
    static createPageFail(pageName: string): Error;
    static actionTypeError(pageName: string): Error;
    static canntFindAction(pageName: string): Error;
    static exportsCanntNull(pageName: string): Error;
    static scrollerElementNotExists(): Error;
    static resourceExists(resourceName: string, pageName: string): Error;
    static siteMapRootCanntNull(): Error;
    static duplicateSiteMapNode(name: string): Error;
    static unexpectedNullValue(): Error;
    static containerIsNotExists(name: string): Error;
}
