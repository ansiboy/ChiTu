
namespace chitu {

    const DEFAULT_FILE_BASE_PATH = 'modules'

    export class Resources {
        private items: Array<{ name: string, path: string }> = [];
        private routeData: RouteData;
        private _loadCompleted;

        constructor(routeData: RouteData) {
            this.routeData = routeData;
        }

        push(...items: { name: string, path: string }[]) {

            //=========================================================================
            // 说明：检查是否有名称重复
            let tmp: Array<{ name: string, path: string }> = this.items;
            for (let i = 0; i < tmp.length; i++) {
                for (let j = 0; j < items.length; j++) {
                    if (tmp[i].name == items[j].name) {
                        throw Errors.resourceExists(tmp[i].name, this.routeData.pageName);
                    }
                }
            }

            for (let i = 0; i < items.length; i++) {
                for (let j = i + 1; j < items.length; j++) {
                    if (items[i].name == items[j].name) {
                        throw Errors.resourceExists(items[i].name, this.routeData.pageName);
                    }
                }
            }
            //=========================================================================
            return this.items.push(...items);
        }

        load() {
            this._loadCompleted = false;
            return new Promise((reslove, reject) => {
                let resourcePaths = this.items.map(o => o.path);
                let resourceNames = this.items.map(o => o.name)
                loadjs(...resourcePaths || []).then((resourceResults) => {
                    this._loadCompleted = true;
                    //let resourceResults = data[1];
                    resourceResults = resourceResults || [];
                    let args = {};
                    for (let i = 0; i < resourceResults.length; i++) {
                        let name = resourceNames[i];
                        args[name] = resourceResults[i];
                    }
                    reslove(args);
                }).catch((err) => {
                    reject(err);
                });
            });
        }

        map<U>(callbackfn: (value: { name: string, path: string }) => U): U[] {
            return this.items.map(callbackfn);
        }
    }


    export class RouteData {
        private _parameters: any = {};
        private path_string = '';
        private path_spliter_char = '/';
        private param_spliter = '?'
        private name_spliter_char = '.';
        private _pathBase = '';
        private _pageName;

        private _actionPath: string;

        private _resources: Resources;
        private _routeString: string;
        private _loadCompleted: boolean;

        constructor(basePath, routeString: string) {
            if (!basePath) throw Errors.argumentNull('basePath');
            if (!routeString) throw Errors.argumentNull('routeString');

            this._loadCompleted = false;
            this._routeString = routeString;
            this._pathBase = basePath;
            this.parseRouteString();

            this._resources = new Resources(this);
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

            let file_path = path_parts.join(this.path_spliter_char);
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

        /** 页面名称 */
        get pageName(): string {
            return this._pageName;
        }

        /** 其它资源文件的路径 */
        get resources(): Resources {
            return this._resources;
        }

        /** 路由字符串 */
        get routeString(): string {
            return this._routeString;
        }

        /** 页面脚本的路径，即 js 文件 */
        get actionPath(): string {
            return this._actionPath;
        }

        get loadCompleted(): boolean {
            return this._loadCompleted;
        }
    }

    interface MyLocation extends Location {
        skipHashChanged: boolean
    }

    var PAGE_STACK_MAX_SIZE = 16;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';

    export class Application {

        /**
         * 当页面创建后发生
         */
        pageCreated = Callbacks<Application, Page>();

        protected pageType: PageConstructor = Page;
        protected pageDisplayType: PageDisplayConstructor = PageDisplayerImplement;

        private _runned: boolean = false;
        private zindex: number;
        private page_stack = new Array<Page>();

        /**
         * 加载文件的基本路径
         */
        fileBasePath: string = DEFAULT_FILE_BASE_PATH;

        /**
         * 调用 back 方法返回上一页面，如果返回上一页面不成功，则引发此事件
         */
        backFail = Callbacks<Application, {}>();

        constructor() {
            // config = config || {};
            // this._config = config;
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
            return fireCallback(this.pageCreated, this, page);
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
            let previous_page = this.pages[this.pages.length - 1];

            let element = this.createPageElement(routeData);
            let displayer = new PageDisplayerImplement();

            console.assert(this.pageType != null);
            let page = new this.pageType({
                app: this,
                previous: previous_page,
                routeData: routeData,
                displayer,
                element
            });

            this.page_stack.push(page);
            if (this.page_stack.length > PAGE_STACK_MAX_SIZE) {
                let c = this.page_stack.shift();
                c.close();
            }

            return page;
        }

        protected createPageElement(routeData: chitu.RouteData) {
            let element: HTMLElement = document.createElement(Page.tagName);
            document.body.appendChild(element);
            return element;
        }

        protected hashchange() {
            let location = window.location as MyLocation;
            if (location.skipHashChanged == true) {
                location.skipHashChanged = false;
                return;
            }

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
            if (page != null && this.page_stack.indexOf(page) == previousPageIndex) {
                this.closeCurrentPage();
            }
            else {
                this.showPage(routeString);
            }
        }

        /**
         * 运行当前应用
         */
        public run() {
            if (this._runned) return;

            var app = this;

            this.hashchange();
            window.addEventListener('hashchange', () => {
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

        /**
         * 显示页面
         * @param url 页面的路径
         * @param args 传递到页面的参数 
         */
        public showPage<T extends Page>(routeString: string, args?: any): Promise<T> {
            if (!routeString) throw Errors.argumentNull('routeString');

            var routeData = this.parseRouteString(routeString);
            if (routeData == null) {
                throw Errors.noneRouteMatched(routeString);
            }

            Object.assign(routeData.values, args || {});

            let previous = this.currentPage;
            let result = new Promise((resolve, reject) => {
                let page = this.createPage(routeData);
                this.on_pageCreated(page);
                page.show();
                resolve(page);

                //this.setLocationHash(routeData.routeString);
            });

            return result;
        }

        private setLocationHash(routeString: string) {
            if (window.location.hash == '#' + routeString) {
                return;
            }

            let location = window.location as MyLocation;
            location.skipHashChanged = true;
            location.hash = '#' + routeString;
        }

        private closeCurrentPage() {
            if (this.page_stack.length <= 0)
                return;

            var c = this.page_stack.pop();
            c.close();
            if (this.currentPage != null)
                this.setLocationHash(this.currentPage.routeData.routeString);
        }

        /**
         * 页面跳转
         * @param url 页面路径
         * @param args 传递到页面的参数
         */
        public redirect<T extends Page>(routeString: string, args?: any): Promise<T> {
            let location = window.location as MyLocation;
            // location.skipHashChanged = true;
            // window.location.hash = routeString;
            let result = this.showPage<T>(routeString, args);
            this.setLocationHash(routeString);
            return result;
        }

        /**
         * 页面的返回
         */
        public back(args = undefined): Promise<void> {
            return new Promise<void>((reslove, reject) => {
                // 如果只有一个页，就回退不了
                if (this.page_stack.length <= 1) {
                    reject();

                    fireCallback(this.backFail, this, {});
                    return;
                }

                this.closeCurrentPage();

                reslove();
            });

        }
    }
} 
