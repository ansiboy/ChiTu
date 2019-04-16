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
    parse?: (pageName: string) => PageNode;
}
export declare class Application extends PageMaster {
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
    };
    createUrl<T>(pageName: string, values?: T): string;
    run(): void;
    private showPageByUrl;
    private fetchTemplatePageData;
    private setLocationHash;
    redirect<T>(pageNameOrUrl: string, args?: object): Page;
    forward(pageNameOrUrl: string, args?: object, setUrl?: boolean): Page;
    private showPageByNameOrUrl;
    reload(pageName: string, args?: object): Page;
    back(): void;
    back(closeCurrentPage: boolean): void;
    back(data: any): void;
    back<T>(closeCurrentPage?: boolean, data?: Pick<T, StringPropertyNames<T>>): void;
    createService<T extends IService>(type?: ServiceConstructor<T>): T;
}
