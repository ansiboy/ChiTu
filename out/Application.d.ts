import { IService, ServiceConstructor } from "maishu-chitu-service";
import { PageMaster } from "./PageMaster";
import { PageData, Page } from "./Page";
export declare type StringPropertyNames<T> = {
    [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];
export declare type Action = ((page: Page, app: PageMaster) => void);
export declare type SiteMapChildren<T extends PageNode> = {
    [key: string]: T;
};
export interface PageNode {
    action: Action;
    name: string;
}
export interface PageNodeParser {
    actions?: {
        [key: string]: Action;
    };
    parse?: (pageName: string, pageMaster: PageMaster) => PageNode;
}
export declare function parseUrl(url: string): {
    pageName: string;
    values: PageData;
};
export declare function createPageUrl(pageName: string, params?: PageData): string;
export declare class Application extends PageMaster {
    private _runned;
    static DefaultContainerName: string;
    constructor(args?: {
        parser?: PageNodeParser;
        container?: HTMLElement | {
            [name: string]: HTMLElement;
        };
    });
    private static containers;
    parseUrl(url: string): {
        pageName: string;
        values: PageData;
    };
    createUrl<T>(pageName: string, values?: PageData): string;
    run(): void;
    setLocationHash(pageUrl: string): void;
    private readonly location;
    redirect<T>(pageUrl: string, args?: PageData): Page;
    forward(pageUrl: string, args?: PageData, setUrl?: boolean): Page;
    reload(pageName: string, args?: PageData): Page;
    back(): void;
    createService<T extends IService>(type?: ServiceConstructor<T>): T;
}
