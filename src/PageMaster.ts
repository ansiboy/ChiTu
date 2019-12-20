import { Callbacks, Callback1, Callback2 } from "maishu-chitu-service";
import { Page, PageConstructor, PageDisplayConstructor, PageDisplayerImplement, PageData } from "./Page";
import { PageNodeParser, PageNode, StringPropertyNames, Action, parseUrl, Application, createPageUrl } from "./Application";
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

    private cachePages: { [key: string]: Page } = {};
    private page_stack = new Array<Page>();
    private nodes: { [name: string]: PageNode } = {}
    private MAX_PAGE_COUNT = 100

    protected pageTagName = "div";
    protected pagePlaceholder = PageMaster.defaultPagePlaceholder;

    static readonly defaultPagePlaceholder = "page-placeholder"

    private containers: { [name: string]: HTMLElement };
    
    pageContainers: { [name: string]: string };

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
    constructor(containers: { [name: string]: HTMLElement }, parser?: PageNodeParser) {
        this.parser = parser || this.defaultPageNodeParser;
        if (!containers)
            throw Errors.argumentNull("containers");

        this.parser.actions = this.parser.actions || {};
        this.containers = containers;
        this.pageContainers = {};
    }

    /**
     * 发送消息到指定的页面
     * @param 消息发送者
     * @param page 指定的页面,页面名称或者类
     * @param message 发送的消息
     */
    sendMessage(sender: object, page: typeof Page, message: any): void;
    sendMessage(sender: object, page: string, message: any): void;
    sendMessage(sender: object, page: string | typeof Page, message: any) {

        let pages: Page[];
        if (typeof page == "string")
            pages = this.page_stack.filter(o => o.name == page);
        else
            pages = this.page_stack.filter(o => o instanceof page);

        pages.forEach(p => {
            p.messageReceived.fire(sender, message);
        })
    }

    private _defaultPageNodeParser: PageNodeParser | null = null;
    protected get defaultPageNodeParser() {
        if (this._defaultPageNodeParser == null) {
            let nodes: { [key: string]: PageNode } = {}
            this._defaultPageNodeParser = {
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
        }

        return this._defaultPageNodeParser;
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
        return new Promise<any>((reslove, reject) => {
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

    private cachePageKey(containerName: string, pageUrl: string) {
        let key = `${containerName}_${pageUrl}`
        return key
    }

    private getPage(pageUrl: string, containerName: string, values?: PageData): { page: Page, isNew: boolean } {
        if (!pageUrl) throw Errors.argumentNull('pageUrl')

        let key = this.cachePageKey(containerName, pageUrl) //`${containerName}_${pageUrl}`
        values = values || {};
        let cachePage = this.cachePages[key];
        if (cachePage != null) {
            let r = parseUrl(pageUrl)
            cachePage.data = Object.assign(values || {}, r.values)
            return { page: cachePage, isNew: false };
        }

        let page = this.createPage(pageUrl, containerName, values);
        this.cachePages[key] = page;

        this.on_pageCreated(page);
        return { page, isNew: true };
    }

    protected createPage(pageUrl: string, containerName: string, values?: PageData): Page {
        if (!pageUrl) throw Errors.argumentNull('pageUrl')
        if (!containerName) throw Errors.argumentNull('containerName')

        values = values || {}

        let r = parseUrl(pageUrl)
        let element = this.createPageElement(r.pageName, containerName);
        let displayer = new this.pageDisplayType(this);
        let container = this.containers[containerName]
        if (!container)
            throw Errors.containerIsNotExists(containerName)

        console.assert(this.pageType != null);
        let page = new this.pageType({
            app: this,
            url: pageUrl,
            data: values,
            displayer,
            element,
            container: { name: containerName, element: container },
        });

        let showing = (sender: Page) => {
            for (let key in this.containers) {
                if (key == sender.container.name) {
                    sender.container.element.style.removeProperty('display')
                }
                else {
                    this.containers[key].style.display = 'none'
                }
            }
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

            let key = this.cachePageKey(page.container.name, page.url)
            delete this.cachePages[key];
            this.page_stack = this.page_stack.filter(o => o != page);
        })

        return page;
    }

    protected createPageElement(pageName: string, containerName: string) {
        if (!containerName) throw Errors.argumentNull('containerName')
        let container = this.containers[containerName]
        if (!container)
            throw Errors.containerIsNotExists(containerName)

        let placeholder = container.querySelector(`.${this.pagePlaceholder}`);
        if (placeholder == null)
            placeholder = container;

        let element: HTMLElement = document.createElement(this.pageTagName);
        placeholder.appendChild(element);
        return element;
    }

    /**
     * 显示页面
     * @param pageUrl 页面名称
     * @param args 传递给页面的参数
     * @param forceRender 是否强制重新渲染页面，是表示强制重新渲染
     */
    public showPage(pageUrl: string, args?: PageData, forceRender?: boolean): Page {

        args = args || {}
        forceRender = forceRender == null ? false : true

        let values: { [key: string]: string } = {}
        let funs: { [key: string]: Function } = {}
        for (let key in args) {
            let arg = args[key]
            if (typeof arg == 'function') {
                funs[key] = arg
            }
            else {
                values[key] = arg
            }
        }

        let r = parseUrl(pageUrl)
        values = Object.assign(values, r.values)
        pageUrl = createPageUrl(r.pageName, values)

        if (!pageUrl) throw Errors.argumentNull('pageName');

        if (this.currentPage != null && this.currentPage.url == pageUrl)
            return this.currentPage;

        let containerName = (values.container as string) || this.pageContainers[r.pageName] || Application.DefaultContainerName
        let { page, isNew } = this.getPage(pageUrl, containerName, args);
        if (isNew || forceRender) {
            let action = this.findPageAction(pageUrl)
            if (action == null)
                throw Errors.actionCanntNull(pageUrl);

            action(page, this)
        }

        page.show();


        this.pushPage(page);
        console.assert(page == this.currentPage, "page is not current page");

        return page;
    }

    reload(page: Page) {
        let action = this.findPageAction(page.url);
        console.assert(action != null);
        action(page, this)
    }

    // protected closePage(page: Page) {
    //     if (page == null)
    //         throw Errors.argumentNull('page')

    //     page.close()

    //     let key = this.cachePageKey(page.container.name, page.url)
    //     delete this.cachePages[key];
    //     this.page_stack = this.page_stack.filter(o => o != page);
    // }

    private pushPage(page: Page) {
        this.page_stack.push(page);
        if (this.page_stack.length > this.MAX_PAGE_COUNT) {
            let page = this.page_stack.shift()
            if (page) {
                // this.closePage(page)
                page.close();
            }
        }
    }

    findPageAction(pageUrl: string): Action {
        let routeData = parseUrl(pageUrl)
        let pageName = routeData.pageName
        let node = this.findPageNode(pageName)
        if (node == null)
            throw Errors.pageNodeNotExists(pageName)

        let action = node.action;
        if (action == null)
            throw Errors.actionCanntNull(pageName);

        return node.action
    }

    private findPageNode(pageName: string): PageNode | null {
        if (this.nodes[pageName])
            return this.nodes[pageName]

        let node: PageNode | null = null;
        let action = this.parser.actions ? this.parser.actions[pageName] : null;
        if (action != null) {
            node = { action, name: pageName }
        }

        if (node == null && this.parser.parse != null) {
            node = this.parser.parse(pageName, this);
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

        // this.closePage(page)
        page.close();
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