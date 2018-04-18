namespace chitu {

    export type Action = ((page: Page) => void);
    export type SiteMapChildren<T extends SiteMapNode> = { [key: string]: T }
    export interface SiteMapNode {
        action: Action | string,
        name?: string,
        cache?: boolean,
    }

    export interface SiteMap<T extends SiteMapNode> {
        nodes: { [key: string]: T }
    }

    const EmtpyStateData = "";
    const DefaultPageName = "index"
    function parseUrl(app: Application<any>, url: string): { pageName: string, values: PageData } {
        let sharpIndex = url.indexOf('#');
        if (sharpIndex < 0) {
            let pageName = DefaultPageName
            return { pageName, values: {} };
        }

        let routeString = url.substr(sharpIndex + 1);
        if (!routeString)
            throw Errors.canntParseRouteString(url);

        /** 以 ! 开头在 hash 忽略掉 */
        if (routeString.startsWith('!')) {
            let url = createUrl(app.currentPage.name, app.currentPage.data);
            history.replaceState(EmtpyStateData, "", url)
            return;
        }

        let routePath: string;
        let search: string;
        let param_spliter_index: number = routeString.indexOf('?');
        if (param_spliter_index > 0) {
            search = routeString.substr(param_spliter_index + 1);
            routePath = routeString.substring(0, param_spliter_index);
        }
        else {
            routePath = routeString;
        }

        if (!routePath)
            throw Errors.canntParseRouteString(routeString);

        let values = {};
        if (search) {
            values = pareeUrlQuery(search);
        }

        let path_parts = routePath.split(this.path_spliter_char).map(o => o.trim()).filter(o => o != '');
        if (path_parts.length < 1) {
            throw Errors.canntParseRouteString(routeString);
        }

        let file_path = path_parts.join('/');
        let pageName = path_parts.join('.');

        return { pageName, values };
    }

    function pareeUrlQuery(query: string): Object {
        let match,
            pl = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };

        let urlParams = {};
        while (match = search.exec(query))
            urlParams[decode(match[1])] = decode(match[2]);

        return urlParams;
    }


    function createUrl(pageName: string, params?: { [key: string]: string }) {
        let path_parts = pageName.split('.');
        let path = path_parts.join('/');
        if (!params)
            return `#${path}`;

        //==============================================
        // 移除 function, null 字段
        let stack = [];
        stack.push(params);
        while (stack.length > 0) {
            let obj = stack.pop();
            for (let key in obj) {
                let type = typeof (obj[key]);
                if (type == 'function' || obj[key] == null) {
                    delete obj[key];
                    continue;
                }
                else if (type == 'object') {
                    for (let key1 in obj[key])
                        if (typeof obj[key][key1] == 'object')
                            stack.push(obj[key][key1])
                }
            }
        }
        //==============================================

        let paramsText = "";
        for (let key in params) {
            paramsText = paramsText + `&${key}=${params[key]}`;
        }

        if (paramsText.length > 0)
            paramsText = paramsText.substr(1);

        return `#${path}?${paramsText}`;
    }

    var PAGE_STACK_MAX_SIZE = 30;
    var CACHE_PAGE_SIZE = 30;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';

    /**
     * 应用，用于管理各个页面
     */
    export class Application<T extends SiteMapNode> {

        private static skipStateName = 'skip';

        /**
         * 当页面创建后发生
         */
        pageCreated = Callbacks<this, Page>();

        pageLoad = Callbacks<this, Page, any>();

        protected pageType: PageConstructor = Page;
        protected pageDisplayType: PageDisplayConstructor = PageDisplayerImplement;

        private _runned: boolean = false;
        private cachePages: { [name: string]: Page } = {};
        private allNodes: { [key: string]: T } = {};
        // private _currentPage: Page;
        private page_stack = new Array<Page>();

        /** 
         * 错误事件 
         */
        error = Callbacks<this, Error, Page>();

        /**
         * 构造函数
         * @param siteMap 地图，描述站点各个页面结点
         * @param allowCachePage 是允许缓存页面，默认 true
         */
        constructor(siteMap: SiteMap<T>) {
            if (!siteMap) {
                throw Errors.argumentNull("siteMap");
            }

            this.allNodes = siteMap.nodes || {};
            for (let key in this.allNodes) {
                this.allNodes[key].name = key;
                let action = this.allNodes[key].action
                if (typeof action == 'string') {
                    this.allNodes[key].action = this.wrapAction(action);
                }
            }
        }

        private wrapAction(action: string | Action): (page: Page) => void {
            let result: Action;

            if (typeof action == 'string') {
                let url = action;
                result = async function (page: Page) {
                    let actionExports = await this.loadjs(url);
                    if (!actionExports)
                        throw Errors.exportsCanntNull(url);

                    let actionName = 'default';
                    let _action = actionExports[actionName];
                    if (_action == null) {
                        throw Errors.canntFindAction(page.name);
                    }

                    page.on_load();
                    return _action(page);
                }
            }
            else {
                result = function (page: Page) {
                    page.on_load();
                    return action(page);
                }
            }


            return result;
            // return async function (page: Page) {
            //     let actionExports = await this.loadjs(url);
            //     if (!actionExports)
            //         throw Errors.exportsCanntNull(url);

            //     let actionName = 'default';
            //     let _action = actionExports[actionName];
            //     if (_action == null) {
            //         throw Errors.canntFindAction(page.name);
            //     }
            //     return _action(page);
            // }
        }

        /**
         * 解释路由，将路由字符串解释为 RouteData 对象
         * @param url 要解释的 路由字符串
         */
        protected parseUrl(url: string) {
            let routeData = parseUrl(this, url);
            return routeData;
        }

        /**
         * 创建 url
         * @param pageName 页面名称
         * @param values 页面参数
         */
        protected createUrl(pageName: string, values: { [key: string]: string }) {
            return createUrl(pageName, values);
        }

        private on_pageCreated(page: Page) {
            return this.pageCreated.fire(this, page);
        }

        /**
         * 获取当前页面
         */
        get currentPage(): Page {
            if (this.page_stack.length > 0)
                return this.page_stack[this.page_stack.length - 1];

            return null;
        }

        private getPage(pageName: string, values?: any): Page {

            let allowCache = this.allowCache(pageName);
            console.assert(allowCache != null);

            let cachePage = this.cachePages[pageName];
            if (cachePage != null && allowCache) {
                return cachePage;
            }

            if (cachePage != null)
                cachePage.close();


            let previous_page = this.currentPage; //this.pages[this.pages.length - 1];

            let element = this.createPageElement(pageName);
            let displayer = new this.pageDisplayType(this);

            let siteMapNode = this.findSiteMapNode(pageName);
            let action = siteMapNode ?
                siteMapNode.action :
                (page: Page) => page.element.innerHTML = `page ${pageName} not found`;


            console.assert(this.pageType != null);
            let page = new this.pageType({
                app: this,
                // previous: previous_page,
                name: pageName,
                data: values,
                displayer,
                element,
                action: action as Action,
            });

            let page_onloadComplete = (sender: Page, args) => {
                this.cachePages[sender.name] = sender;
            }
            let page_onclosed = (sender: chitu.Page) => {
                delete this.cachePages[sender.name];
                this.page_stack = this.page_stack.filter(o => o != sender);
                page.closed.remove(page_onclosed);
                page.loadComplete.remove(page_onloadComplete);
            }

            page.closed.add(page_onclosed);
            page.loadComplete.add(page_onloadComplete);

            this.on_pageCreated(page);
            return page;
        }

        private allowCache(pageName: string): boolean {
            let node = this.allNodes[pageName];
            console.assert(node != null);
            return node.cache || false;
        }

        protected createPageElement(pageName: string) {
            let element: HTMLElement = document.createElement(Page.tagName);
            document.body.appendChild(element);
            return element;
        }

        protected hashchange() {

            var routeData = this.parseUrl(location.href);
            if (routeData == null) {
                return;
            }

            this.showPageByUrl(location.href);
        }

        /**
         * 运行当前应用
         */
        public run() {
            if (this._runned) return;

            var app = this;

            this.hashchange();
            window.addEventListener('popstate', (event) => {
                if (event.state == Application.skipStateName)
                    return;

                this.hashchange();
            });

            this._runned = true;
        }

        /**
         * 显示页面
         * @param node 要显示页面的节点
         * @param args 页面参数
         */
        public showPage(node: SiteMapNode, args?: any) {
            if (!node) throw Errors.argumentNull('node');

            let pageName = node.name;
            if (!pageName) throw Errors.argumentNull('pageName');

            if (this.currentPage != null && this.currentPage.name == pageName)
                return;

            args = args || {}
            let oldCurrentPage = this.currentPage;
            let isNewPage = false;
            let page = this.getPage(pageName, args);
            page.show();
            this.pushPage(page);
            console.assert(page == this.currentPage, "page is not current page");

            return this.currentPage;
        }

        /**
         * 显示页面
         * @param url 页面的路径
         * @param args 传递到页面的参数 
         */
        private showPageByUrl(url: string, args?: any): Page {
            if (!url) throw Errors.argumentNull('url');

            var routeData = this.parseUrl(url);
            if (routeData == null) {
                throw Errors.noneRouteMatched(url);
            }

            Object.assign(routeData.values, args || {});
            let node = this.allNodes[routeData.pageName];
            if (node == null) throw Errors.pageNodeNotExists(routeData.pageName);
            return this.showPage(node, routeData.values);
        }

        private pushPage(page: Page) {
            let previous = this.currentPage;
            this.page_stack.push(page);
        }

        private findSiteMapNode(pageName: string) {
            return this.allNodes[pageName];
        }

        public setLocationHash(url: string) {
            history.pushState(EmtpyStateData, "", url)
        }

        /**
         * 关闭当前页面
         */
        public closeCurrentPage() {
            if (this.page_stack.length <= 0)
                return;

            var page = this.page_stack.pop();
            if (this.allowCache(page.name)) {
                page.hide(this.currentPage);
            }
            else {
                page.close();
            }
            if (this.currentPage) {
                this.currentPage.show();
            }
        }

        /**
         * 页面跳转
         * @param node 页面节点
         * @param args 传递到页面的参数
         */
        public redirect(node: SiteMapNode, args?: any): Page {
            if (!node) throw Errors.argumentNull("node");

            let result = this.showPage(node, args);
            let url = this.createUrl(node.name, args);
            this.setLocationHash(url);

            return result;
        }

        /**
         * 返回上一个页面
         */
        public back() {
            history.back();
        }

        /**
         * 使用 requirejs 加载 JS
         * @param path JS 路径
         */
        public loadjs(path): Promise<any> {
            return new Promise<Array<any>>((reslove, reject) => {
                requirejs([path],
                    function (result) {
                        reslove(result);
                    },
                    function (err) {
                        reject(err);
                    });
            });
        }

        public get pageNodes() {
            return this.allNodes;
        }
    }
} 
