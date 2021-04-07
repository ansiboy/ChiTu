import { IService, ServiceConstructor, Service } from "maishu-chitu-service";
import { PageMaster } from "./PageMaster";
import { PageData, Page } from "./Page";
import { Errors } from "./Errors";

export type StringPropertyNames<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T];
export type Action = ((page: Page, app: PageMaster) => void);
export type SiteMapChildren<T extends PageNode> = { [key: string]: T }

/**
 * 页面结点
 */
export interface PageNode {
    action: Action,
    name: string,
}

export interface PageNodeParser {
    actions?: { [key: string]: Action },
    parse?: (pageName: string, pageMaster: PageMaster) => PageNode,
}




export function createPageUrl(pageName: string, params?: PageData) {
    let path_parts = pageName.split('.');
    let path = path_parts.join('/');
    if (!params)
        return `${path}`;

    //==============================================
    // 移除 function, null, object 字段
    let paramsText = '';
    for (let key in params) {
        let value = params[key];
        if (typeof value == "function" || value == null)
            continue;

        value = encodeURIComponent(value);
        paramsText = paramsText == '' ? `?${key}=${value}` : paramsText + `&${key}=${value}`;
    }
    //==============================================
    return `${path}${paramsText}`;
}

/**
 * 应用，处理页面 URL 和 Page 之间的关联
 */
export class Application extends PageMaster {

    private _runned: boolean = false;
    // private closeCurrentOnBack: boolean | null = null;
    // private tempPageData: PageData | undefined = undefined;

    static DefaultContainerName = 'default'
    private indexPath: string;

    /**
     * 构造函数
     * @param parser 地图，描述站点各个页面结点
     * @param allowCachePage 是允许缓存页面，默认 true
     */
    constructor(args?: {
        parser?: PageNodeParser, container?: HTMLElement | { [name: string]: HTMLElement },
        indexPath?: string,
    }) {
        super(Application.containers((args || {}).container), (args || {}).parser);
        this.indexPath = args?.indexPath || this.DefaultPageName;
    }

    private static containers(container: HTMLElement | { [name: string]: HTMLElement } | undefined): { [name: string]: HTMLElement } {
        let r: { [name: string]: HTMLElement } = {}
        if (container == null) {
            r[Application.DefaultContainerName] = document.body
            return r
        }

        if ((container as HTMLElement).tagName) {
            r[Application.DefaultContainerName] = container as HTMLElement
            return r
        }

        r = container as { [name: string]: HTMLElement }
        if (!Application.DefaultContainerName)
            throw Errors.containerIsNotExists(Application.DefaultContainerName)

        return r
    }

    /**
     * 创建 url
     * @param pageName 页面名称
     * @param values 页面参数
     */
    createUrl<T>(pageName: string, values?: PageData) {
        return createPageUrl(pageName, values);
    }

    /**
     * 运行当前应用
     */
    public run() {
        if (this._runned) return;

        this.showPage(location.href)
        window.addEventListener('hashchange', () => {
            if (this.location.skip) {
                delete this.location.skip
                return
            }
            this.showPage(location.href)
        })

        this._runned = true;
    }

    setLocationHash(pageUrl: string) {
        this.location.hash = `#${pageUrl}`
        this.location.skip = true
    }

    private get location(): Location & { skip?: boolean } {
        return location
    }


    /**
     * 页面跳转
     * @param node 页面节点
     * @param args 传递到页面的参数
     */
    public redirect<T>(pageUrl: string, args?: PageData): Page {
        if (!pageUrl) throw Errors.argumentNull('pageUrl')

        let page = this.showPage(pageUrl, args);
        let url = this.createUrl(page.name, page.data);
        this.setLocationHash(url);

        return page;
    }

    /**
     * 页面向下一级页面跳转，页面会重新渲染
     * @param node 页面节点
     * @param args 传递到页面的参数
     * @param setUrl 是否设置链接里 Hash
     */
    public forward(pageUrl: string, args?: PageData, setUrl?: boolean) {
        if (!pageUrl) throw Errors.argumentNull('pageNameOrUrl')
        if (setUrl == null)
            setUrl = true

        let page = this.showPage(pageUrl, args, true);
        if (setUrl) {
            let url = this.createUrl(page.name, page.data);
            this.setLocationHash(url);
        }

        return page;
    }

    /**
     * 返回上一个页面
     * @param closeCurrentPage 返回上一个页面时，是否关闭当前页面，true 关闭当前页，false 隐藏当前页。默认为 true。
     */
    public back(): void {
        this.closeCurrentPage()
        setTimeout(() => {
            history.back();
        }, 100)
    }

    /**
     * 创建服务
     * @param type 服务类型
     */
    createService<T extends IService>(type?: ServiceConstructor<T>): T {
        type = type || Service as any as ServiceConstructor<T>
        let service = new type();
        service.error.add((sender, error) => {
            this.error.fire(this, error, null)
        })
        return service;
    }
}


