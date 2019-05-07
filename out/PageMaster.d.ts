import { Callback1, Callback2 } from "maishu-chitu-service";
import { Page, PageConstructor, PageDisplayConstructor } from "./Page";
import { PageNodeParser, PageNode, StringPropertyNames, Action } from "./Application";
export declare class PageMaster {
    pageCreated: Callback1<this, Page>;
    pageShowing: Callback1<this, Page>;
    pageShown: Callback1<this, Page>;
    protected pageType: PageConstructor;
    protected pageDisplayType: PageDisplayConstructor;
    private cachePages;
    private page_stack;
    private container;
    private nodes;
    error: Callback2<this, Error, Page | null>;
    parser: PageNodeParser;
    constructor(container: HTMLElement, parser?: PageNodeParser);
    protected defaultPageNodeParser(): PageNodeParser;
    protected createDefaultAction(url: string, loadjs: (path: string) => Promise<any>): Action;
    protected loadjs(path: string): Promise<any[]>;
    private on_pageCreated;
    readonly currentPage: Page | null;
    private getPage;
    protected createPage(pageName: string, values?: any): Page;
    protected createPageElement(pageName: string): HTMLElement;
    showPage(pageName: string, args?: object, forceRender?: boolean): Page;
    protected closePage(page: Page): void;
    private pushPage;
    protected findSiteMapNode(pageName: string): PageNode | null;
    closeCurrentPage<T>(passData?: Pick<T, StringPropertyNames<T>>): void;
    protected readonly pageStack: Page[];
    static isClass: (fn: Function) => boolean;
}
