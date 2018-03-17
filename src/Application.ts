
namespace chitu {

    export interface SiteMapNode {
        name?: string,
        action: ((page: Page) => void) | string,
        children?: { [key: string]: SiteMapNode | ((page: Page) => void) | string }
    }

    export interface SiteMap<T extends SiteMapNode> {
        index: T | ((page: Page) => void) | string,
    }

    const DefaultPageName = "index"
    function parseUrl(url: string): RouteData {
        let sharpIndex = url.indexOf('#');
        if (sharpIndex < 0) {
            let pageName = DefaultPageName
            return { pageName, values: {} };
        }
        // throw Errors.canntParseRouteString(url);

        let routeString = url.substr(sharpIndex + 1);
        if (!routeString)
            throw Errors.canntParseRouteString(url);


        /** 以 ! 开头在 hash 忽略掉 */
        if (routeString.startsWith('!')) {
            history.replaceState('chitu', "", `#${this.currentPage.routeData.url}`)
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
            values = this.pareeUrlQuery(search);
        }

        let path_parts = routePath.split(this.path_spliter_char).map(o => o.trim()).filter(o => o != '');
        if (path_parts.length < 1) {
            throw Errors.canntParseRouteString(routeString);
        }

        let file_path = path_parts.join('/');
        let pageName = path_parts.join('.');

        return { pageName, values };
    }

    function createUrl(pageName: string, routeValues?: { [key: string]: string }) {
        let path_parts = pageName.split('.');
        let path = path_parts.join('/');
        if (!routeValues)
            return `#${path}`

        let params = "";
        for (let key in routeValues) {
            params = params + `&${key}=${routeValues[key]}`;
        }

        if (params.length > 0)
            params = params.substr(1);

        return `#${path}?${params}`;
    }

    export interface RouteData {
        pageName: string,
        values: any,
        // url: string
    }


    var PAGE_STACK_MAX_SIZE = 30;
    var CACHE_PAGE_SIZE = 30;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';

    type MySiteMapNode = SiteMapNode & { parent?: SiteMapNode, level?: number };


    export class Application {

        static skipStateName = 'skip';

        /**
         * 当页面创建后发生
         */
        pageCreated = Callbacks<Application, Page>();

        protected pageType: PageConstructor = Page;
        protected pageDisplayType: PageDisplayConstructor = PageDisplayerImplement;

        private _runned: boolean = false;
        private zindex: number;
        private page_stack = new Array<Page>();
        private cachePages: { [name: string]: { page: Page, hitCount: number } } = {};

        private _siteMap: SiteMap<SiteMapNode>;
        private allowCachePage = true;

        /**
         * 调用 back 方法返回上一页面，如果返回上一页面不成功，则引发此事件
         */
        backFail = Callbacks<Application, null>();

        error = Callbacks<Application, Error, Page>();
        constructor(args?: {
            siteMap: SiteMap<SiteMapNode>,
            allowCachePage?: boolean
        }) {
            args = args || {} as any;
            this._siteMap = args.siteMap;
            if (!this._siteMap) {
                throw new Error("site map can not null.");
            }

            if (!this._siteMap.index)
                throw Errors.siteMapRootCanntNull();

            if (typeof this._siteMap.index != 'object') {
                let action = this._siteMap.index;
                this._siteMap.index = { name: DefaultPageName, action }
            }

            this._siteMap.index.name = this._siteMap.index.name || DefaultPageName;
            (this._siteMap.index as MySiteMapNode).level = 0;

            this.travalNode(this._siteMap.index);

            if (args.allowCachePage != null)
                this.allowCachePage = args.allowCachePage;
        }

        private travalNode(node: MySiteMapNode) {
            if (node == null) throw Errors.argumentNull('parent');
            let children = node.children || {};

            for (let key in children) {

                let child_type = typeof children[key];
                if (child_type == 'function' || child_type == 'string') {
                    let action = children[key] as any;
                    children[key] = {
                        name: key,
                        action
                    }
                }

                let child = children[key] as MySiteMapNode;
                child.name = child.name || key;
                child.parent = node;
                child.level = node.level + 1;
                this.travalNode(children[key] as SiteMapNode);
            }
        }

        /**
         * 解释路由，将路由字符串解释为 RouteData 对象
         * @param url 要解释的 路由字符串
         */
        protected parseUrl(url: string): RouteData {
            let routeData = parseUrl(url);
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
            return this.pageCreated.fire(this, page); //fireCallback(this.pageCreated, this, page);
        }

        /**
         * 获取当前页面
         */
        get currentPage(): Page {
            if (this.page_stack.length > 0)
                return this.page_stack[this.page_stack.length - 1];

            return null;
        }

        /**
         * 获取当前应用中的所创建页面容器
         */
        get pages(): Array<Page> {
            return this.page_stack;
        }

        get siteMap(): SiteMap<SiteMapNode> {
            return this._siteMap;
        }

        private getPage(pageName: string, values?: any): { page: Page, isNew: boolean } {//routeData: RouteData

            let data = this.cachePages[pageName];
            if (data) {
                data.hitCount = (data.hitCount || 0) + 1;
                data.page.routeData.values = values || {};
                return { page: data.page, isNew: false };
            }

            let previous_page = this.pages[this.pages.length - 1];

            let element = this.createPageElement(pageName);
            let displayer = new this.pageDisplayType(this);

            let siteMapNode = this.findSiteMapNode(pageName);
            if (siteMapNode == null)
                throw Errors.pageNodeNotExists(pageName);

            console.assert(this.pageType != null);
            let page = new this.pageType({
                app: this,
                previous: previous_page,
                routeData: { pageName, values },
                displayer,
                element,
                action: siteMapNode.action
            });

            let keyes = Object.keys(this.cachePages);
            if (keyes.length > CACHE_PAGE_SIZE) {
                let key = keyes[0]
                // 寻找点击最少的
                for (let i = 1; i < keyes.length; i++) {
                    let data0 = this.cachePages[key];
                    let data1 = this.cachePages[keyes[i]];

                    if (data1.hitCount < data0.hitCount) {
                        key = keyes[i];
                    }
                }

                this.cachePages[key].page.close();
                delete this.cachePages[key];
            }


            let page_onerror = (sender: Page, error: Error) => {
                this.error.fire(this, error, sender);
            }
            let page_onloadComplete = (sender, args) => {
                if (this.allowCachePage)
                    this.cachePages[sender.name] = { page: sender, hitCount: 1 };
            }
            let page_onclosed = (sender: chitu.Page) => {
                delete this.cachePages[sender.name];
                this.page_stack = this.page_stack.filter(o => o != sender);
                page.closed.remove(page_onclosed);
                page.loadComplete.remove(page_onloadComplete);
                page.error.remove(page_onerror);
            }

            page.error.add(page_onerror);
            page.closed.add(page_onclosed);
            page.loadComplete.add(page_onloadComplete);

            this.on_pageCreated(page);
            return { page, isNew: true };
        }

        protected createPageElement(pageName: string) {
            let element: HTMLElement = document.createElement(Page.tagName);
            document.body.appendChild(element);
            return element;
        }

        protected hashchange() {

            var routeData = this.parseUrl(location.href); //this.parseUrl(routeString);
            if (routeData == null) {
                return;
            }

            var page = this.findPageFromStack(routeData.pageName);
            let previousPageIndex = this.page_stack.length - 2;
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
         * 通过页面的名称，获取页面
         */
        public findPageFromStack(name: string): Page {
            for (var i = this.page_stack.length - 1; i >= 0; i--) {
                var page = this.page_stack[i]; //.pages[name];
                if (page != null && page.name == name)
                    return page;
            }
            return null;
        }

        public showPage(pageName: string, args?: any) {
            if (!pageName) throw Errors.argumentNull('pageName');

            if (this.currentPage != null && this.currentPage.name == pageName)
                return;

            args = args || {}
            let oldCurrentPage = this.currentPage;
            let page = this.findPageFromStack(pageName);
            let isNewPage = false;
            let previousPageIndex = this.page_stack.length - 2;
            if (page != null && this.page_stack.indexOf(page) == previousPageIndex) {
                this.closeCurrentPage();
            }
            else {
                let obj = this.getPage(pageName, args);
                page = obj.page;
                isNewPage = obj.isNew;
                this.pushPage(page);
                page.show();
                console.assert(page == this.currentPage, "page is not current page");
            }

            let preRouteData = null;
            if (oldCurrentPage) {
                preRouteData = oldCurrentPage.routeData
                oldCurrentPage.on_deactive()
            }

            console.assert(this.currentPage != null);
            if (isNewPage) {
                this.currentPage.on_active(args, preRouteData);
            }
            else {
                let onload = (sender: Page, args: any) => {
                    sender.on_active(args, preRouteData);
                    sender.load.remove(onload);
                }
                this.currentPage.load.add(onload);
            }

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

            return this.showPage(routeData.pageName, routeData.values);
        }

        private pushPage(page: Page) {
            if (this.currentPage != null) {
                let currentSiteNode = this.findSiteMapNode(this.currentPage.name);
                let pageNode = this.findSiteMapNode(page.name);
                if (currentSiteNode != null && pageNode != null && pageNode.level <= currentSiteNode.level) {
                    this.clearPageStack();
                }
            }

            let previous = this.currentPage;
            this.page_stack.push(page);
            if (this.page_stack.length > PAGE_STACK_MAX_SIZE) {
                let c = this.page_stack.shift();
            }

            page.previous = previous;
        }

        private findSiteMapNode(pageName: string) {
            if (this._siteMap == null)
                return;

            let stack = new Array<MySiteMapNode>();
            stack.push(this._siteMap.index as SiteMapNode);
            while (stack.length > 0) {
                let node = stack.pop();
                if (node.name == pageName) {
                    return node;
                }
                let children = node.children || [];
                // children.forEach(c => stack.push(c));
                for (let key in children) {
                    stack.push(children[key]);
                }
            }

            return null;
        }

        public setLocationHash(url: string) {
            // if (window.location.hash == '#' + routeString) {
            //     return;
            // }
            history.pushState('chitu', "", url)
        }

        public closeCurrentPage() {
            if (this.page_stack.length <= 0)
                return;

            var page = this.page_stack.pop();
            if (this.allowCachePage) {
                page.previous = this.currentPage;
                page.hide();
            }
            else {
                page.close();
            }
        }

        private clearPageStack() {
            if (this.allowCachePage) {
                this.page_stack.forEach(o => o.hide())
            }
            else {
                this.page_stack.forEach(o => {
                    o.close()
                })
            }
            this.page_stack = [];
        }

        /**
         * 页面跳转
         * @param url 页面路径
         * @param args 传递到页面的参数
         */
        public redirect(pageName: string, args?: any): Page {
            let result = this.showPage(pageName, args);
            let url = this.createUrl(pageName, args);
            this.setLocationHash(url);

            return result;
        }

        public back() {
            history.back();
        }
    }
} 
