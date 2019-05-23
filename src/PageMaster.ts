import { Callbacks, Callback1, Callback2 } from "maishu-chitu-service";
import { Page, PageConstructor, PageDisplayConstructor, PageDisplayerImplement } from "./Page";
import { PageNodeParser, PageNode, StringPropertyNames, Action, parseUrl } from "./Application";
import { Errors } from "./Errors";

/**
 * 页面管理，用于管理各个页面
 */
export class PageMaster {

    /**
     * 当页面创建后发生
     */
    pageCreated: Callback1<this, Page> = Callbacks<this, Page>();

    /** 页面显示时引发 */
    pageShowing: Callback1<this, Page> = Callbacks<this, Page>();

    /** 页面显示时完成后引发 */
    pageShown: Callback1<this, Page> = Callbacks<this, Page>();

    protected pageType: PageConstructor = Page;
    protected pageDisplayType: PageDisplayConstructor = PageDisplayerImplement;

    private cachePages: { [pageUrl: string]: Page } = {};
    private page_stack = new Array<Page>();
    private container: HTMLElement;
    private nodes: { [name: string]: PageNode } = {}

    /** 
     * 错误事件 
     */
    error: Callback2<this, Error, Page | null> = Callbacks<this, Error, Page | null>();
    parser: PageNodeParser;

    /**
     * 构造函数
     * @param parser 地图，描述站点各个页面结点
     * @param allowCachePage 是允许缓存页面，默认 true
     */
    constructor(container: HTMLElement, parser?: PageNodeParser) {
        this.parser = parser || this.defaultPageNodeParser();
        if (!container)
            throw Errors.argumentNull("container");

        this.parser.actions = this.parser.actions || {};
        this.container = container;
    }

    protected defaultPageNodeParser() {
        let nodes: { [key: string]: PageNode } = {}
        let p: PageNodeParser = {
            actions: {},
            parse: (pageName) => {
                let node = nodes[pageName];
                if (node == null) {
                    let path = `modules_${pageName}`.split('_').join('/');
                    node = { action: this.createDefaultAction(path, this.loadjs), name: pageName };
                    nodes[pageName] = node;
                }
                return node;
            }
        }
        return p
    }

    protected createDefaultAction(url: string, loadjs: (path: string) => Promise<any>): Action {
        return async (page: Page) => {
            let actionExports = await loadjs(url);
            if (!actionExports)
                throw Errors.exportsCanntNull(url);

            let _action = actionExports.default
            if (_action == null) {
                throw Errors.canntFindAction(page.name);
            }

            let result: any
            if (PageMaster.isClass(_action)) {
                let action = _action as any as ({ new(page: Page, app: PageMaster): any })
                result = new action(page, this)
            }
            else {
                let action = _action as (page: Page, app: PageMaster) => void
                result = action(page, this)
            }

            return result;
        }
    }

    protected loadjs(path: string) {
        return new Promise<Array<any>>((reslove, reject) => {
            requirejs([path],
                function (result: any) {
                    reslove(result);
                },
                function (err: Error) {
                    reject(err);
                });
        });
    }

    private on_pageCreated(page: Page) {
        return this.pageCreated.fire(this, page);
    }

    /**
     * 获取当前页面
     */
    get currentPage(): Page | null {
        if (this.page_stack.length > 0)
            return this.page_stack[this.page_stack.length - 1];

        return null;
    }

    private getPage(pageUrl: string, values?: any): { page: Page, isNew: boolean } {
        // console.assert(node != null);
        if (!pageUrl) throw Errors.argumentNull('pageUrl')

        values = values || {};
        // let pageName = node.name;
        let cachePage = this.cachePages[pageUrl];
        if (cachePage != null) {
            cachePage.data = values || {} //Object.assign(cachePage.data || {}, values);
            return { page: cachePage, isNew: false };
        }

        let page = this.createPage(pageUrl, values);
        this.cachePages[pageUrl] = page;

        this.on_pageCreated(page);
        return { page, isNew: true };
    }

    protected createPage(pageUrl: string, values?: any): Page {
        if (!pageUrl) throw Errors.argumentNull('pageUrl')
        values = values || {}
        let element = this.createPageElement(pageUrl);
        let displayer = new this.pageDisplayType(this);

        console.assert(this.pageType != null);
        let page = new this.pageType({
            app: this,
            url: pageUrl,
            data: values,
            displayer,
            element,
        });

        let showing = (sender: Page) => {
            this.pageShowing.fire(this, sender)
        }
        let shown = (sender: Page) => {
            this.pageShown.fire(this, sender)
        }
        page.showing.add(showing)
        page.shown.add(shown)

        page.closed.add(() => {
            page.showing.remove(showing)
            page.shown.remove(shown)
        })

        return page;
    }

    protected createPageElement(pageName: string) {
        let element: HTMLElement = document.createElement(Page.tagName);
        this.container.appendChild(element);
        return element;
    }

    /**
     * 显示页面
     * @param pageUrl 页面名称
     * @param args 传递给页面的参数
     * @param forceRender 是否强制重新渲染页面，是表示强制重新渲染
     */
    public showPage(pageUrl: string, args?: object, forceRender?: boolean): Page {

        args = args || {}
        forceRender = forceRender == null ? false : true

        if (!pageUrl) throw Errors.argumentNull('pageName');

        // let node = this.findSiteMapNode(pageUrl);
        // if (node == null)
        //     throw Errors.pageNodeNotExists(pageUrl)

        if (this.currentPage != null && this.currentPage.url == pageUrl)
            return this.currentPage;

        let { page, isNew } = this.getPage(pageUrl, args);
        if (isNew || forceRender) {
            let action = this.findPageAction(pageUrl) //siteMapNode.action;
            if (action == null)
                throw Errors.actionCanntNull(pageUrl);

            action(page, this)
        }

        page.show();


        this.pushPage(page);
        console.assert(page == this.currentPage, "page is not current page");

        return page;
    }

    protected closePage(page: Page) {
        if (page == null)
            throw Errors.argumentNull('page')

        page.close()

        delete this.cachePages[page.url];
        this.page_stack = this.page_stack.filter(o => o != page);
    }

    private pushPage(page: Page) {
        this.page_stack.push(page);
    }

    protected findPageAction(pageUrl: string): Action {
        let routeData = parseUrl(pageUrl)
        let pageName = routeData.pageName
        let node = this.findSiteMapNode(pageName)
        if (node == null)
            throw Errors.pageNodeNotExists(pageName)

        let action = node.action;
        if (action == null)
            throw Errors.actionCanntNull(pageName);

        return node.action
    }

    private findSiteMapNode(pageName: string): PageNode | null {
        if (this.nodes[pageName])
            return this.nodes[pageName]

        let node: PageNode | null = null;
        let action = this.parser.actions ? this.parser.actions[pageName] : null;
        if (action != null) {
            node = { action, name: pageName }
        }

        if (node == null && this.parser.parse != null) {
            node = this.parser.parse(pageName);
            console.assert(node.action != null);
        }

        if (node != null)
            this.nodes[pageName] = node

        return node;
    }

    /**
     * 关闭当前页面
     * @param passData 传递到前一个页面的数据
     */
    public closeCurrentPage<T>(passData?: Pick<T, StringPropertyNames<T>>) {
        var page = this.page_stack.pop();
        if (page == null)
            return;

        // page.close();
        this.closePage(page)
        if (this.currentPage) {
            if (passData) {
                console.assert(this.currentPage.data != null);
                this.currentPage.data = Object.assign(this.currentPage.data, passData);
            }
            this.currentPage.show();
        }
    }

    protected get pageStack() {
        return this.page_stack;
    }

    static isClass = (function () {
        var toString = Function.prototype.toString;

        function fnBody(fn: Function) {
            return toString.call(fn).replace(/^[^{]*{\s*/, '').replace(/\s*}[^}]*$/, '');
        }

        function isClass(fn: Function) {
            return (typeof fn === 'function' &&
                (/^class(\s|\{\}$)/.test(toString.call(fn)) ||
                    (/^.*classCallCheck\(/.test(fnBody(fn)))) // babel.js
            );
        }

        return isClass
    })()
}