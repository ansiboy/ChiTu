declare namespace chitu {
    interface RouteData {
        actionPath: string;
        viewPath: string;
        values: any;
        pageName: string;
        resource?: string[];
    }
    interface ApplicationConfig {
        container?: (routeData: RouteData, prevous: PageContainer) => PageContainer;
        pathBase?: string;
    }
    class Application {
        pageCreated: Callback<Application, Page>;
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
        currentPage: chitu.Page;
        pageContainers: Array<PageContainer>;
        private createPageContainer(routeData);
        protected hashchange(): void;
        run(): void;
        getPage(name: string): chitu.Page;
        showPage<T extends Page>(url: string, args?: any): JQueryPromise<T>;
        protected createPageNode(): HTMLElement;
        redirect<T extends Page>(url: string, args?: any): JQueryPromise<T>;
        back(args?: any): JQueryPromise<any>;
    }
}
declare namespace chitu {
    class ControlCollection {
        private parent;
        private items;
        constructor(parent: Control);
        add(control: Control): void;
        length: number;
        item(indexOrName: number | string): any;
    }
    class Control {
        private _element;
        private _children;
        private static ControlTags;
        private _parent;
        protected _name: string;
        load: Callback<Control, any>;
        constructor(element: HTMLElement);
        private createChildren(element, parent);
        protected createChild(element: HTMLElement, parent: Control): Control;
        visible: boolean;
        element: HTMLElement;
        children: ControlCollection;
        name: string;
        parent: Control;
        on_load(args: Object): JQueryPromise<any>;
        static register(tagName: string, createControlMethod: (new (element: HTMLElement, page: Page) => Control) | ((element: HTMLElement, page: Page) => Control)): void;
        static createControl(element: HTMLElement): Control;
    }
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
    enum PageLoadType {
        init = 0,
        scroll = 1,
        pullDown = 2,
        pullUp = 3,
        custom = 4,
    }
    interface PageLoading {
        show(): any;
        hide(): any;
    }
    enum ScrollType {
        IScroll = 0,
        Div = 1,
        Document = 2,
    }
    type PageArguemnts = {
        container: PageContainer;
        routeData: RouteData;
        element: HTMLElement;
    };
    interface PageConstructor {
        new (args: PageArguemnts): Page;
    }
    class Page extends Control {
        static animationTime: number;
        private _viewDeferred;
        private _actionDeferred;
        private _loadViewModelResult;
        private _openResult;
        private _hideResult;
        private _showTime;
        private _hideTime;
        private _routeData;
        private _enableScrollLoad;
        private is_closed;
        private _scrollLoad_loading_bar;
        private isActionExecuted;
        private _formLoading;
        private _bottomLoading;
        private _pageContainer;
        private _viewHtml;
        private _loading;
        closing: Callback<Page, any>;
        closed: Callback<Page, any>;
        hiding: Callback<Page, any>;
        hidden: Callback<Page, any>;
        constructor(args: PageArguemnts);
        routeData: RouteData;
        name: string;
        visible: boolean;
        container: PageContainer;
        hide(): void;
        findControl<T extends Control>(name: string): T;
        private fireEvent<A>(callback, args);
        on_closing(args: any): JQueryPromise<any>;
        on_closed(args: any): JQueryPromise<any>;
        on_hiding(args: any): JQueryPromise<any>;
        on_hidden(args: any): JQueryPromise<any>;
    }
}
declare namespace chitu {
    class PageContainer {
        private animationTime;
        private num;
        private _node;
        private _loading;
        private _currentPage;
        private _previous;
        private _app;
        private _previousOffsetRate;
        private _routeData;
        showing: Callback<PageContainer, any>;
        shown: Callback<PageContainer, any>;
        hiding: Callback<PageContainer, any>;
        hidden: Callback<PageContainer, any>;
        closing: Callback<PageContainer, any>;
        closed: Callback<PageContainer, any>;
        pageCreated: chitu.Callback<PageContainer, Page>;
        constructor(params: {
            app: Application;
            routeData: RouteData;
            previous?: PageContainer;
        });
        on_pageCreated(page: chitu.Page): JQueryPromise<any>;
        on_showing(args: any): JQueryPromise<any>;
        on_shown(args: any): JQueryPromise<any>;
        on_hiding(args: any): JQueryPromise<any>;
        on_hidden(args: any): JQueryPromise<any>;
        on_closing(args: any): JQueryPromise<any>;
        on_closed(args: any): JQueryPromise<any>;
        protected createNode(): HTMLElement;
        protected createLoading(parent: HTMLElement): HTMLElement;
        show(): void;
        hide(): void;
        private is_closing;
        close(): void;
        private showLoading();
        private hideLoading();
        visible: boolean;
        element: HTMLElement;
        page: Page;
        previous: PageContainer;
        routeData: RouteData;
        private createActionDeferred(routeData);
        private createViewDeferred(url);
        private createPage(routeData);
    }
    class PageContainerFactory {
        private _app;
        constructor(app: Application);
        static createInstance(params: {
            app: Application;
            routeData: RouteData;
            previous?: PageContainer;
            enableGesture?: boolean;
            enableSwipeClose?: boolean;
        }): PageContainer;
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
