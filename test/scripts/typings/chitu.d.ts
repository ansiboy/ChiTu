declare namespace chitu {
    interface RouteData {
        actionPath: string;
        viewPath: string;
        values: any;
        pageName: string;
        resource?: string[];
    }
    interface ApplicationConfig {
        pathBase?: string;
    }
    class Application {
        pageCreated: Callback<Application, Pageview>;
        private _config;
        private _runned;
        private zindex;
        private back_deferred;
        private start_flag_hash;
        private start_hash;
        private container_stack;
        parseUrl: (url: string) => RouteData;
        backFail: Callback<Application, {}>;
        constructor(config?: ApplicationConfig);
        private on_pageCreated(page);
        config: chitu.ApplicationConfig;
        currentPage: chitu.Pageview;
        pageContainers: Array<Page>;
        private createPageContainer(routeData);
        protected hashchange(): void;
        run(): void;
        getPageView(name: string): Pageview;
        showPage<T extends Pageview>(url: string, args?: any): JQueryPromise<T>;
        protected createPageNode(): HTMLElement;
        redirect<T extends Pageview>(url: string, args?: any): JQueryPromise<T>;
        back(args?: any): JQueryPromise<any>;
    }
}
declare namespace chitu {
}
declare namespace chitu {
    class Errors {
        static argumentNull(paramName: string): Error;
        static modelFileExpecteFunction(script: any): Error;
        static paramTypeError(paramName: string, expectedType: string): Error;
        static paramError(msg: string): Error;
        static viewNodeNotExists(name: any): Error;
        static pathPairRequireView(index: any): Error;
        static notImplemented(name: any): Error;
        static routeExists(name: any): Error;
        static ambiguityRouteMatched(url: any, routeName1: any, routeName2: any): Error;
        static noneRouteMatched(url: any): Error;
        static emptyStack(): Error;
        static canntParseUrl(url: string): Error;
        static routeDataRequireController(): Error;
        static routeDataRequireAction(): Error;
        static parameterRequireField(fileName: any, parameterName: any): Error;
        static viewCanntNull(): Error;
        static createPageFail(pageName: string): Error;
        static actionTypeError(pageName: string): Error;
        static scrollerElementNotExists(): Error;
    }
}
declare namespace chitu {
    interface EventCallback<S, A> {
        (sender: S, args: A): JQueryPromise<any> | void;
    }
    class Callback<S, A> {
        source: any;
        constructor(source: any);
        add(func: EventCallback<S, A>): void;
        remove(func: Function): void;
        has(func: Function): boolean;
        fireWith(context: any, args: any): any;
        fire(arg1?: any, arg2?: any, arg3?: any, arg4?: any): any;
    }
    function Callbacks<S, A>(options?: any): Callback<S, A>;
    function fireCallback<S, A>(callback: chitu.Callback<S, A>, sender: S, args: A): JQueryPromise<any>;
}
declare namespace chitu {
    class Page {
        private animationTime;
        private num;
        private _node;
        private _currentPage;
        private _previous;
        private _app;
        private _routeData;
        showing: Callback<Page, any>;
        shown: Callback<Page, any>;
        hiding: Callback<Page, any>;
        hidden: Callback<Page, any>;
        closing: Callback<Page, any>;
        closed: Callback<Page, any>;
        pageCreated: chitu.Callback<Page, Pageview>;
        constructor(params: {
            app: Application;
            routeData: RouteData;
            previous?: Page;
        });
        on_pageCreated(page: chitu.Pageview): JQueryPromise<any>;
        on_showing(args: any): JQueryPromise<any>;
        on_shown(args: any): JQueryPromise<any>;
        on_hiding(args: any): JQueryPromise<any>;
        on_hidden(args: any): JQueryPromise<any>;
        on_closing(args: any): JQueryPromise<any>;
        on_closed(args: any): JQueryPromise<any>;
        protected createNode(): HTMLElement;
        show(): void;
        hide(): void;
        private is_closing;
        close(): void;
        visible: boolean;
        element: HTMLElement;
        page: Pageview;
        previous: Page;
        routeData: RouteData;
        private createActionDeferred(routeData);
        private createViewDeferred(url);
        private createPage(routeData);
    }
    class PageFactory {
        private _app;
        constructor(app: Application);
        static createInstance(params: {
            app: Application;
            routeData: RouteData;
            previous?: Page;
        }): Page;
    }
}
declare namespace chitu {
    type PageArguemnts = {
        container: Page;
        routeData: RouteData;
        element: HTMLElement;
    };
    interface PageConstructor {
        new (args: PageArguemnts): Pageview;
    }
    class Pageview {
        private _name;
        private _openResult;
        private _hideResult;
        private _routeData;
        private is_closed;
        private _pageContainer;
        private _viewHtml;
        private _element;
        load: Callback<Pageview, any>;
        closing: Callback<Pageview, any>;
        closed: Callback<Pageview, any>;
        hiding: Callback<Pageview, any>;
        hidden: Callback<Pageview, any>;
        constructor(args: PageArguemnts);
        element: HTMLElement;
        routeData: RouteData;
        name: string;
        visible: boolean;
        container: Page;
        hide(): void;
        on_load(args: Object): JQueryPromise<any>;
        private fireEvent<A>(callback, args);
        on_closing(args: any): JQueryPromise<any>;
        on_closed(args: any): JQueryPromise<any>;
        on_hiding(args: any): JQueryPromise<any>;
        on_hidden(args: any): JQueryPromise<any>;
    }
}
declare namespace chitu {
    class Utility {
        static isType(targetType: Function, obj: any): boolean;
        static isDeferred(obj: any): boolean;
        static format(source: string, ...params: string[]): string;
        static fileName(url: any, withExt: any): string;
        static log(msg: any, args?: any[]): void;
        static loadjs(...modules: string[]): JQueryPromise<any>;
    }
}
declare module "chitu" { 
    export = chitu; 
}
