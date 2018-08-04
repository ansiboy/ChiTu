namespace chitu {
    /**
     * 页面管理，用于管理各个页面
     */
    export class PageMaster {

        /**
         * 当页面创建后发生
         */
        pageCreated = Callbacks<this, Page>();

        pageLoad = Callbacks<this, Page, any>();

        protected pageType: PageConstructor = Page;
        protected pageDisplayType: PageDisplayConstructor = PageDisplayerImplement;

        private cachePages: { [name: string]: Page } = {};
        private page_stack = new Array<Page>();
        private container: HTMLElement;

        /** 
         * 错误事件 
         */
        error = Callbacks<this, Error, Page>();
        siteMap: SiteMap;

        /**
         * 构造函数
         * @param siteMap 地图，描述站点各个页面结点
         * @param allowCachePage 是允许缓存页面，默认 true
         */
        constructor(siteMap: SiteMap, container: HTMLElement) {
            if (!siteMap)
                throw Errors.argumentNull("siteMap");

            this.siteMap = siteMap;
            if (!container)
                throw Errors.argumentNull("container");

            this.siteMap.actions = this.siteMap.actions || {};
            this.container = container;
        }

        private wrapAction(action: string | Action): Action {
            console.assert(action != null, 'action is null');

            let result: Action;
            if (typeof action == 'string') {
                let url = action;
                result = async (page: Page) => {
                    let actionExports = await chitu.loadjs(url);
                    if (!actionExports)
                        throw Errors.exportsCanntNull(url);

                    let actionName = 'default';
                    let _action = actionExports[actionName];
                    if (_action == null) {
                        throw Errors.canntFindAction(page.name);
                    }

                    let result = _action(page);
                    return result;
                }
            }
            else {
                // result = function (page: Page) {
                //     let result = action(page);
                //     return result;
                // }
                result = action;

            }

            return result;
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

        private getPage(node: PageNode, allowCache: boolean, values?: any): Page {
            console.assert(node != null);

            values = values || {};
            let pageName = node.name;
            let cachePage = this.cachePages[pageName];
            if (cachePage != null && allowCache) {
                cachePage.data = Object.assign(cachePage.data || {}, values);
                return cachePage;
            }

            if (cachePage != null)
                cachePage.close();

            let page = this.createPage(pageName, values);

            let page_onloadComplete = (sender: Page, args: PageData) => {
                this.cachePages[sender.name] = sender;
            }
            let page_onclosed = (sender: chitu.Page) => {
                delete this.cachePages[sender.name];
                this.page_stack = this.page_stack.filter(o => o != sender);
                page.closed.remove(page_onclosed);
                page.load.remove(page_onloadComplete);
            }

            page.closed.add(page_onclosed);
            page.load.add(page_onloadComplete);

            this.on_pageCreated(page);
            return page;
        }

        protected createPage(pageName: string, values: any): Page {
            let element = this.createPageElement(pageName);
            let displayer = new this.pageDisplayType(this);

            let siteMapNode = this.findSiteMapNode(pageName);
            if (siteMapNode == null)
                throw Errors.pageNodeNotExists(pageName);

            let action = siteMapNode.action;
            if (action == null)
                throw Errors.actionCanntNull(pageName);

            if (typeof action == 'string') {
                action = this.wrapAction(action);
            }

            console.assert(this.pageType != null);
            let page = new this.pageType({
                app: this,
                name: pageName,
                data: values,
                displayer,
                element,
                action,
            });

            return page;
        }

        protected createPageElement(pageName: string) {
            let element: HTMLElement = document.createElement(Page.tagName);
            this.container.appendChild(element);
            return element;
        }

        public showPage(node: PageNode, args?: any): Page
        public showPage(node: PageNode, fromCache?: boolean, args?: any): Page
        public showPage(pageName: string, args?: any): Page
        public showPage(pageName: string, fromCache?: boolean, args?: any): Page
        /**
         * 显示页面
         * @param node 要显示页面的节点
         * @param fromCache 页面是否从缓存读取，true 为从缓存读取，false 为重新加载，默认为 true
         * @param args 页面参数
         */
        public showPage(node: PageNode | string | null, fromCache?: any, args?: any): Page | null {
            if (!node) throw Errors.argumentNull('node');
            if (typeof node == 'string') {
                let pageName = node;
                node = this.findSiteMapNode(pageName);
                if (node == null)
                    throw Errors.pageNodeNotExists(pageName)
            }

            let pageName = node.name;
            if (!pageName) throw Errors.argumentNull('pageName');

            if (this.currentPage != null && this.currentPage.name == pageName)
                return this.currentPage;


            if (typeof (fromCache) == 'object') {
                args = fromCache;
                fromCache = null;
            }

            const fromCacheDefault = false;
            fromCache = fromCache == null ? fromCacheDefault : fromCache;
            args = args || {}
            let page = this.getPage(node, fromCache, args);
            page.show();
            this.pushPage(page);
            console.assert(page == this.currentPage, "page is not current page");

            return this.currentPage;
        }

        private pushPage(page: Page) {
            this.page_stack.push(page);
        }

        protected findSiteMapNode(pageName: string): PageNode | null {
            let node: PageNode | null = null;
            let action = this.siteMap.actions[pageName];
            if (action != null) {
                action = this.wrapAction(action);
                node = { action, name: pageName }
            }

            if (node == null && this.siteMap.pageNameParse != null) {
                node = this.siteMap.pageNameParse(pageName);
                console.assert(node.action != null);
                node.action = this.wrapAction(node.action);
            }

            return node;
        }

        /**
         * 关闭当前页面
         * @param passData 传递到前一个页面的数据
         */
        public closeCurrentPage(passData?: PageData) {
            var page = this.page_stack.pop();
            if (page == null)
                return;

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
    }
}