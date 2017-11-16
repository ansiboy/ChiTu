
namespace chitu {

    export interface SiteMapNode {
        pageName: string,
        children?: this[]
    }

    export interface SiteMap<T extends SiteMapNode> {
        root: T
    }

    const DEFAULT_FILE_BASE_PATH = 'modules'
    export class RouteData {
        private _parameters: any = {};
        private path_string = '';
        private path_spliter_char = '/';
        private path_contact_char = '/';
        private param_spliter = '?'
        private name_spliter_char = '.';
        private _pathBase = '';
        private _pageName;

        private _actionPath: string;
        private _routeString: string;

        constructor(basePath: string, routeString: string, pathSpliterChar?: string) {
            if (!basePath) throw Errors.argumentNull('basePath');
            if (!routeString) throw Errors.argumentNull('routeString');

            if (pathSpliterChar)
                this.path_spliter_char = pathSpliterChar;

            this._routeString = routeString;
            this._pathBase = basePath;
            this.parseRouteString();

            //this._resources = new Resources(this);
            let routeData = this;
        }

        public parseRouteString() {
            let routeString: string = this.routeString;
            let routePath: string;
            let search: string;
            let param_spliter_index: number = routeString.indexOf(this.param_spliter);
            if (param_spliter_index > 0) {
                search = routeString.substr(param_spliter_index + 1);
                routePath = routeString.substring(0, param_spliter_index);
            }
            else {
                routePath = routeString;
            }

            if (!routePath)
                throw Errors.canntParseRouteString(routeString);

            if (search) {
                this._parameters = this.pareeUrlQuery(search);
            }

            let path_parts = routePath.split(this.path_spliter_char).map(o => o.trim()).filter(o => o != '');
            if (path_parts.length < 1) {
                throw Errors.canntParseRouteString(routeString);
            }

            let file_path = path_parts.join(this.path_contact_char);
            this._pageName = path_parts.join(this.name_spliter_char);
            this._actionPath = (this.basePath ? combinePath(this.basePath, file_path) : file_path);
        }

        private pareeUrlQuery(query: string): Object {
            let match,
                pl = /\+/g,  // Regex for replacing addition symbol with a space
                search = /([^&=]+)=?([^&]*)/g,
                decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };

            let urlParams = {};
            while (match = search.exec(query))
                urlParams[decode(match[1])] = decode(match[2]);

            return urlParams;
        }

        get basePath(): string {
            return this._pathBase;
        }

        /** 路由参数值，可以通过它来获取 url 参数 */
        get values(): any {
            return this._parameters;
        }
        set values(value: any) {
            this._parameters = value;
        }

        /** 页面名称 */
        get pageName(): string {
            return this._pageName;
        }

        /** 路由字符串 */
        get routeString(): string {
            return this._routeString;
        }

        /** 页面脚本的路径，即 js 文件 */
        get actionPath(): string {
            return this._actionPath;
        }
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

        private _siteMap: SiteMap<MySiteMapNode>;

        /**
         * 加载文件的基本路径
         */
        fileBasePath: string = DEFAULT_FILE_BASE_PATH;

        /**
         * 调用 back 方法返回上一页面，如果返回上一页面不成功，则引发此事件
         */
        backFail = Callbacks<Application, null>();

        error = Callbacks<Application, Error>();
        constructor(args?: { siteMap?: SiteMap<SiteMapNode> }) {
            args = args || {} as any;
            this._siteMap = args.siteMap;
            if (this._siteMap) {
                if (this._siteMap.root == null)
                    throw Errors.siteMapRootCanntNull();

                this._siteMap.root.level = 0;
                this.setChildrenParent(this._siteMap.root);
            }
        }

        private setChildrenParent(parent: MySiteMapNode) {
            if (parent == null) throw Errors.argumentNull('parent');
            let children = parent.children || [];
            for (let i = 0; i < children.length; i++) {
                children[i].parent = parent;
                children[i].level = parent.level + 1;
                this.setChildrenParent(children[i]);
            }
        }

        /**
         * 解释路由，将路由字符串解释为 RouteData 对象
         * @param routeString 要解释的 路由字符串
         */
        protected parseRouteString(routeString: string): RouteData {
            let routeData = new RouteData(this.fileBasePath, routeString);
            return routeData;
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

        protected createPage(routeData: RouteData): Page {

            let data = this.cachePages[routeData.pageName];
            if (data) {
                data.hitCount = (data.hitCount || 0) + 1;
                data.page.routeData.values = routeData.values;
                return data.page;
            }

            let previous_page = this.pages[this.pages.length - 1];

            let element = this.createPageElement(routeData);
            let displayer = new this.pageDisplayType(this);

            console.assert(this.pageType != null);
            let page = new this.pageType({
                app: this,
                previous: previous_page,
                routeData: routeData,
                displayer,
                element
            } as PageParams);

            // this.cachePages[routeData.pageName] = { page, hitCount: 1 };
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
                this.error.fire(this, error);
            }
            let page_onloadComplete = (sender, args) => {
                this.cachePages[sender.name] = { page: sender, hitCount: 1 };
            }
            let page_onclosed = (sender: chitu.Page) => {
                this.page_stack = this.page_stack.filter(o => o != sender);
                page.closed.remove(page_onclosed);
                page.loadComplete.remove(page_onloadComplete);
                page.error.remove(page_onerror);
            }

            page.error.add(page_onerror);
            page.closed.add(page_onclosed);
            page.loadComplete.remove(page_onloadComplete);

            this.on_pageCreated(page);
            return page;
        }

        protected createPageElement(routeData: chitu.RouteData) {
            let element: HTMLElement = document.createElement(Page.tagName);
            document.body.appendChild(element);
            return element;
        }

        protected hashchange() {
            var hash = window.location.hash;
            if (!hash) {
                console.log('The url is not contains hash.url is ' + window.location.href);
                return;
            }

            var routeString: string;
            if (location.hash.length > 1)
                routeString = location.hash.substr(1);

            var routeData = this.parseRouteString(routeString);
            var page = this.getPage(routeData.pageName);
            let previousPageIndex = this.page_stack.length - 2;
            this.showPage(routeString);
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
        public getPage(name: string): Page {
            for (var i = this.page_stack.length - 1; i >= 0; i--) {
                var page = this.page_stack[i]; //.pages[name];
                if (page != null && page.name == name)
                    return page;
            }
            return null;
        }


        private getPageByRouteString(routeString: string) {
            for (var i = this.page_stack.length - 1; i >= 0; i--) {
                var page = this.page_stack[i]; //.pages[name];
                if (page != null && page.routeData.routeString == routeString)
                    return page;
            }
            return null;
        }

        /**
         * 显示页面
         * @param url 页面的路径
         * @param args 传递到页面的参数 
         */
        public showPage(routeString: string, args?: any): Page {
            if (!routeString) throw Errors.argumentNull('routeString');

            if (this.currentPage != null && this.currentPage.routeData.routeString == routeString)
                return;

            var routeData = this.parseRouteString(routeString);
            if (routeData == null) {
                throw Errors.noneRouteMatched(routeString);
            }

            Object.assign(routeData.values, args || {});

            let oldCurrentPage = this.currentPage;

            var page = this.getPage(routeData.pageName);
            let previousPageIndex = this.page_stack.length - 2;
            if (page != null && this.page_stack.indexOf(page) == previousPageIndex) {
                this.closeCurrentPage();
                // return;
            }
            else {
                let page = this.createPage(routeData);
                this.pushPage(page);
                page.show();
                console.assert(page == this.currentPage, "page is not current page");
            }

            if (oldCurrentPage)
                oldCurrentPage.deactive.fire(oldCurrentPage, null);

            console.assert(this.currentPage != null);
            this.currentPage.active.fire(this.currentPage, null);

            return this.currentPage;
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

                // var otherReference = this.page_stack.indexOf(page);
                // if (otherReference < 0)     //  如果没有其它引用，就关掉
                //     c.close();
            }

            page.previous = previous;
        }

        private findSiteMapNode(pageName: string) {
            if (this._siteMap == null)
                return;

            let stack = new Array<MySiteMapNode>();
            stack.push(this._siteMap.root);
            while (stack.length > 0) {
                let node = stack.pop();
                if (node.pageName == pageName) {
                    return node;
                }
                let children = node.children || [];
                children.forEach(c => stack.push(c));
            }

            return null;
        }

        public setLocationHash(routeString: string) {
            if (window.location.hash == '#' + routeString) {
                return;
            }
            history.pushState('chitu', "", `#${routeString}`)
        }

        public closeCurrentPage() {
            if (this.page_stack.length <= 0)
                return;

            var page = this.page_stack.pop();
            // if (page.allowCache) {
            page.previous = this.currentPage;
            page.hide();
            // }
            // else {
            // page.close();
            // if (this.cachePages[page.name])
            //     this.cachePages[page.name] = null;
            // }

            // if (this.currentPage != null)
            //     this.setLocationHash(this.currentPage.routeData.routeString);
        }

        private clearPageStack() {
            this.page_stack = [];
        }

        /**
         * 页面跳转
         * @param url 页面路径
         * @param args 传递到页面的参数
         */
        public redirect(routeString: string, args?: any): Page {
            // let location = window.location as MyLocation;

            let result = this.showPage(routeString, args);
            this.setLocationHash(routeString);

            return result;
        }

        public back() {
            history.back();
        }

        // /**
        //  * 页面的返回
        //  */
        // public _back(args = undefined) {
        //     if (this.currentPage == null) {
        //         this.backFail.fire(this, null);
        //         return;
        //     }

        //     let routeData = this.currentPage.routeData;
        //     this.closeCurrentPage();

        //     //================================
        //     // 表示成功返回
        //     if (this.page_stack.length > 0) {
        //         return;
        //     }
        //     //================================

        //     // 如果页面没有了，就表示回退失败
        //     // if (this.page_stack.length == 0) {
        //     if (this._siteMap == null) {
        //         this.backFail.fire(this, null);
        //         return;
        //     }

        //     let siteMapNode = this.findSiteMapNode(routeData.pageName);
        //     if (siteMapNode != null && siteMapNode.parent != null) {
        //         let p = siteMapNode.parent;
        //         let routeString = typeof p.routeString == 'function' ? p.routeString() : p.routeString;
        //         this.redirect(routeString);
        //         return;
        //     }
        //     // }

        //     // fireCallback(this.backFail, this, {});
        //     this.backFail.fire(this, null);
        //     // }
        // }
    }
} 
