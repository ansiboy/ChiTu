import { Callback1, Callback2 } from "maishu-chitu-service";
import { Page, PageConstructor, PageDisplayConstructor, PageData } from "./Page";
import { PageNodeParser, StringPropertyNames, Action } from "./Application";
export declare class PageMaster {
    pageCreated: Callback1<this, Page>;
    pageShowing: Callback1<this, Page>;
    pageShown: Callback1<this, Page>;
    protected pageType: PageConstructor;
    protected pageDisplayType: PageDisplayConstructor;
    private cachePages;
    private page_stack;
    private nodes;
    private MAX_PAGE_COUNT;
    protected pageTagName: string;
    protected pagePlaceholder: string;
    static readonly defaultPagePlaceholder = "page-placeholder";
    containers: {
        [name: string]: HTMLElement;
    };
    error: Callback2<this, Error, Page | null>;
    parser: PageNodeParser;
    constructor(containers: {
        [name: string]: HTMLElement;
    }, parser?: PageNodeParser);
    sendMessage(sender: object, page: typeof Page, message: any): void;
    sendMessage(sender: object, page: string, message: any): void;
    private _defaultPageNodeParser;
    protected readonly defaultPageNodeParser: PageNodeParser;
    protected createDefaultAction(url: string, loadjs: (path: string) => Promise<any>): Action;
    protected loadjs(path: string): Promise<any[]>;
    private on_pageCreated;
    readonly currentPage: Page | null;
    private cachePageKey;
    private getPage;
    protected createPage(pageUrl: string, containerName: string, values?: PageData): Page;
    protected createPageElement(pageName: string, containerName: string): HTMLElement;
    showPage(pageUrl: string, args?: PageData, forceRender?: boolean): Page;
    reload(page: Page): void;
    private pushPage;
    findPageAction(pageUrl: string): Action;
    private findPageNode;
    closeCurrentPage<T>(passData?: Pick<T, StringPropertyNames<T>>): void;
    protected readonly pageStack: Page[];
    static isClass: (fn: Function) => boolean;
}
