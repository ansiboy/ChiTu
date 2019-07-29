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

const DefaultPageName = "index"
export function parseUrl(url: string): { pageName: string, values: PageData } {
    if (!url) throw Errors.argumentNull('url')

    let sharpIndex = url.indexOf('#');
    let routeString;
    if (sharpIndex >= 0)
        routeString = url.substr(sharpIndex + 1);
    else
        routeString = url

    if (!routeString)
        throw Errors.canntParseRouteString(url);

    /** 以 ! 开头在 hash 忽略掉 */
    if (routeString.startsWith('!')) {
        throw Errors.canntParseRouteString(routeString);
    }

    let routePath: string;
    let search: string | null = null;
    let param_spliter_index: number = routeString.indexOf('?');
    if (param_spliter_index >= 0) {
        search = routeString.substr(param_spliter_index + 1);
        routePath = routeString.substring(0, param_spliter_index);
    }
    else {
        routePath = routeString;
    }

    if (!routePath)
        routePath = DefaultPageName //throw Errors.canntParseRouteString(routeString);

    let values: { [key: string]: string } = {};
    if (search) {
        values = pareeUrlQuery(search);
    }

    let pageName = routePath;
    return { pageName, values };
}

function pareeUrlQuery(query: string): { [key: string]: string } {
    let match,
        pl = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s: string) {
            return decodeURIComponent(s.replace(pl, " "));
        };

    let urlParams: { [key: string]: string } = {};
    while (match = search.exec(query))
        urlParams[decode(match[1])] = decode(match[2]);

    return urlParams;
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

    /**
     * 构造函数
     * @param parser 地图，描述站点各个页面结点
     * @param allowCachePage 是允许缓存页面，默认 true
     */
    constructor(args?: { parser?: PageNodeParser, container?: HTMLElement | { [name: string]: HTMLElement } }) {
        super(Application.containers((args || {}).container), (args || {}).parser);
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
     * 解释路由，将路由字符串解释为 RouteData 对象
     * @param url 要解释的 路由字符串
     */
    parseUrl(url: string) {
        if (!url)
            throw Errors.argumentNull('url')

        let routeData = parseUrl(url);
        return routeData;
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

        let showPage = () => {
            let url = location.href;

            let sharpIndex = url.indexOf('#');
            if (sharpIndex < 0) {
                url = '#' + DefaultPageName
            }
            else {
                url = url.substr(sharpIndex + 1);
            }
            // let routeString = url.substr(sharpIndex + 1);
            /** 以 ! 开头在 hash 忽略掉 */
            if (url.startsWith('!')) {
                return
            }

            this.showPage(url);
        }

        showPage()
        window.addEventListener('hashchange', () => {
            if (this.location.skip) {
                delete this.location.skip
                return
            }
            showPage()
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

    // public reload(pageName: string, args?: PageData) {
    //     let result = this.showPage(pageName, args, true)
    //     return result
    // }


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


