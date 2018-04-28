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

        siteMap: chitu.SiteMap<PageNode>;

        /** 
         * 错误事件 
         */
        error = Callbacks<this, Error, Page>();

        /**
         * 构造函数
         * @param siteMap 地图，描述站点各个页面结点
         * @param allowCachePage 是允许缓存页面，默认 true
         */
        constructor(siteMap: SiteMap<PageNode>, container: HTMLElement) {
            if (!siteMap)
                throw Errors.argumentNull("siteMap");

            if (!container)
                throw Errors.argumentNull("container");

            for (let key in siteMap.nodes) {
                siteMap.nodes[key].name = key;
                let action = siteMap.nodes[key].action;
                if (action == null)
                    throw Errors.actionCanntNull(key);

                siteMap.nodes[key].action = this.wrapAction(action);
            }

            this.container = container;
        }

        private wrapAction(action: string | Action): (page: Page) => void {
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

        private getPage(node: PageNode, values?: any): Page {
            console.assert(node != null);

            values = values || {};

            let pageName = node.name;
            let allowCache = this.allowCache(pageName);
            console.assert(allowCache != null);

            let cachePage = this.cachePages[pageName];
            if (cachePage != null && allowCache) {
                cachePage.data = values;
                return cachePage;
            }

            if (cachePage != null)
                cachePage.close();

            let page = this.createPage(pageName, values);

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

        private allowCache(pageName: string): boolean {
            let node = this.siteMap.nodes[pageName];
            console.assert(node != null);
            return node.cache || false;
        }

        protected createPageElement(pageName: string) {
            let element: HTMLElement = document.createElement(Page.tagName);
            this.container.appendChild(element);
            return element;
        }

        /**
         * 显示页面
         * @param node 要显示页面的节点
         * @param args 页面参数
         */
        public showPage(node: PageNode, args?: any) {
            if (!node) throw Errors.argumentNull('node');

            let pageName = node.name;
            if (!pageName) throw Errors.argumentNull('pageName');

            if (this.currentPage != null && this.currentPage.name == pageName)
                return;

            args = args || {}
            let oldCurrentPage = this.currentPage;
            let isNewPage = false;
            let page = this.getPage(node, args);
            page.show();
            this.pushPage(page);
            console.assert(page == this.currentPage, "page is not current page");

            return this.currentPage;
        }

        private pushPage(page: Page) {
            let previous = this.currentPage;
            this.page_stack.push(page);
        }

        private findSiteMapNode(pageName: string) {
            return this.siteMap.nodes[pageName];
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
         * 添加或更新页面结点
         * @param name 页面结点名称
         * @param action 页面执行
         */
        public setPageNode(name: string, action: string | Action): PageNode {
            let node: PageNode = {
                name,
                action: this.wrapAction(action)
            }
            this.siteMap[name] = node;
            return node;
        }

    }
}