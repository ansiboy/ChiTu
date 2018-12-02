declare namespace chitu {
    class PageMaster {
        pageCreated: Callback1<this, Page>;
        pageLoad: Callback2<this, Page, any>;
        protected pageType: PageConstructor;
        protected pageDisplayType: PageDisplayConstructor;
        private cachePages;
        private page_stack;
        private container;
        private nodes;
        error: Callback2<this, Error, Page>;
        parser: PageNodeParser;
        constructor(container: HTMLElement, parser?: PageNodeParser);
        private defaultPageNodeParser;
        private createDefaultAction;
        private on_pageCreated;
        readonly currentPage: Page | null;
        private getPage;
        protected createPage(pageName: string, values?: any): Page;
        protected createPageElement(pageName: string): HTMLElement;
        showPage(pageName: string, args?: object, rerender?: boolean): Page;
        protected closePage(page: Page): void;
        private pushPage;
        protected findSiteMapNode(pageName: string): PageNode | null;
        closeCurrentPage<T>(passData?: Pick<T, StringPropertyNames<T>>): void;
        protected readonly pageStack: Page[];
        static isClass: (fn: Function) => boolean;
    }
}
declare namespace chitu {
    type StringPropertyNames<T> = {
        [K in keyof T]: T[K] extends string ? K : never;
    }[keyof T];
    type Action = ((page: Page, app: PageMaster) => void);
    type SiteMapChildren<T extends PageNode> = {
        [key: string]: T;
    };
    interface PageNode {
        action: Action;
        name: string;
    }
    interface PageNodeParser {
        actions?: {
            [key: string]: Action;
        };
        parse?: (pageName: string) => PageNode;
    }
    class Application extends PageMaster {
        private _runned;
        private closeCurrentOnBack;
        private tempPageData;
        constructor(args?: {
            parser?: PageNodeParser;
            container?: HTMLElement;
        });
        parseUrl(url: string): {
            pageName: string;
            values: PageData;
        } | null;
        createUrl<T>(pageName: string, values?: T): string;
        run(): void;
        private showPageByUrl;
        private fetchTemplatePageData;
        private setLocationHash;
        redirect<T>(pageName: string, args?: object): Page;
        forward(pageName: string, args?: object): Page;
        reload(pageName: string, args?: object): Page;
        back(): void;
        back(closeCurrentPage: boolean): void;
        back(data: any): void;
        back<T>(closeCurrentPage?: boolean, data?: Pick<T, StringPropertyNames<T>>): void;
    }
}
declare namespace chitu {
    class Errors {
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
    }
}
declare namespace chitu {
    class Callback {
        private funcs;
        constructor();
        add(func: (...args: Array<any>) => any): void;
        remove(func: (...args: Array<any>) => any): void;
        fire(...args: Array<any>): void;
    }
    interface Callback1<S, A> extends Callback {
        add(func: (sender: S, arg: A) => any): void;
        remove(func: (sender: S, arg: A) => any): void;
        fire(sender: S, arg: A): void;
    }
    interface Callback2<S, A, A1> extends Callback {
        add(func: (sender: S, arg: A, arg1: A1) => any): void;
        remove(func: (sender: S, arg: A, arg1: A1) => any): void;
        fire(sender: S, arg: A, arg1: A1): void;
    }
    function Callbacks<S, A, A1>(): Callback2<S, A, A1>;
    function Callbacks<S, A>(): Callback1<S, A>;
    type ValueChangedCallback<T> = (args: T, sender: any) => void;
    class ValueStore<T> {
        private items;
        private _value;
        constructor(value?: T);
        add(func: ValueChangedCallback<T | null>, sender?: any): ValueChangedCallback<T>;
        remove(func: ValueChangedCallback<T>): void;
        fire(value: T | null): void;
        value: T | null;
    }
    function loadjs(path: string): Promise<any>;
}
declare namespace chitu {
    type PageData = {
        [key: string]: string;
    };
    interface PageDisplayConstructor {
        new (app: PageMaster): PageDisplayer;
    }
    interface PageDisplayer {
        show(targetPage: Page, currentPage: chitu.Page | null): Promise<any>;
        hide(targetPage: Page, currentPage: chitu.Page | null): Promise<any>;
    }
    interface PageParams {
        app: PageMaster;
        element: HTMLElement;
        displayer: PageDisplayer;
        name: string;
        data: PageData;
    }
    class Page {
        private _element;
        private _app;
        private _displayer;
        private _name;
        static tagName: string;
        data: PageData;
        showing: Callback1<this, PageData>;
        shown: Callback1<this, PageData>;
        hiding: Callback1<this, PageData>;
        hidden: Callback1<this, PageData>;
        closing: Callback1<this, PageData>;
        closed: Callback1<this, PageData>;
        constructor(params: PageParams);
        private on_showing;
        private on_shown;
        private on_hiding;
        private on_hidden;
        private on_closing;
        private on_closed;
        show(): Promise<any>;
        hide(currentPage: chitu.Page | null): Promise<any>;
        close(): Promise<any>;
        createService<T extends Service>(type?: ServiceConstructor<T>): T;
        readonly element: HTMLElement;
        readonly name: string;
        readonly app: PageMaster;
    }
}
interface PageConstructor {
    new (args: chitu.PageParams): chitu.Page;
}
declare class PageDisplayerImplement implements chitu.PageDisplayer {
    show(page: chitu.Page, previous: chitu.Page): Promise<void>;
    hide(page: chitu.Page, previous: chitu.Page): Promise<void>;
}
interface ServiceError extends Error {
    method?: string;
}
declare function ajax<T>(url: string, options: RequestInit): Promise<T>;
declare function callAjax<T>(url: string, options: RequestInit, service: chitu.Service, error: chitu.Callback1<chitu.Service, Error>): Promise<T>;
declare namespace chitu {
    interface ServiceConstructor<T> {
        new (): T;
    }
    type AjaxOptions = {
        data?: any;
        headers?: {
            [key: string]: string;
        };
        method?: string;
    };
    class Service {
        error: Callback1<Service, Error>;
        static settings: {
            ajaxTimeout: number;
        };
        ajax<T>(url: string, options?: AjaxOptions): Promise<T>;
    }
}
