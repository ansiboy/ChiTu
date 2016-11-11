namespace chitu {

    export interface RouteData {
        /** 页面的路径，即 js 文件 */
        actionPath: string,
        /** action 名称 */
        actionName: string;
        /** 路由参数值，可以通过它来获取 url 参数 */
        values: any,
        /** 页面名称 */
        pageName: string,
        /** 其它资源文件的路径 */
        resource?: string[],
    }

    export class RouteParser {
        private path_string = '';
        private path_spliter_char = '/';
        private param_spliter = '?'
        private name_spliter_char = '.';

        private _actionPath = '';
        private _cssPath = '';
        private _parameters: any = {};
        private _pageName = '';
        private pathBase = '';

        private HASH_MINI_LENGTH = 2;

        constructor(pathBase?: string) {
            if (pathBase == null)
                pathBase = 'modules/'

            this.pathBase = pathBase;
        }

        public parseRouteString(routeString: string): RouteData {
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

            let path_parts = routePath.split(this.path_spliter_char).filter(o => (o || '').trim() != '');
            if (routePath[routePath.length - 1] != '/' && path_parts.length < 2) {
                throw Errors.canntParseRouteString(routeString);
            }

            let actionName = path_parts[path_parts.length - 1];
            if (routePath[routePath.length - 1] != '/') {
                path_parts.pop();
            }

            let file_path = path_parts.join(this.path_spliter_char);
            let page_name = file_path.split(this.path_spliter_char)
                .join(this.name_spliter_char) + this.name_spliter_char + actionName;

            var result = {
                actionPath: this.pathBase + file_path,
                actionName,
                values: this._parameters,
                pageName: page_name,
            }

            return result;
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
    }

    interface MyLocation extends Location {
        skip: boolean//HashChanged
    }



    var PAGE_STACK_MAX_SIZE = 16;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';

    export interface ApplicationConfig {
        /**
         * 页面的基本路径
         */
        pathBase?: string,
    }

    export class Application {

        /**
         * 当页面创建后发生
         */
        pageCreated = Callbacks<Application, Page>();

        private _config: ApplicationConfig;
        private _runned: boolean = false;
        private zindex: number;
        //private start_flag_hash: string;
        //private start_hash: string;
        private page_stack = new Array<Page>();

        /**
         * 解释 url，将 url 解释为 RouteData
         * param url 要解释的 url
         */
        parseRouteString: (routeString: string) => RouteData;

        /**
         * 调用 back 方法返回上一页面，如果返回上一页面不成功，则引发此事件
         */
        backFail = Callbacks<Application, {}>();

        constructor(config?: ApplicationConfig) {

            config = config || {};
            this._config = config;

            let urlParser = new RouteParser(this._config.pathBase);
            this.parseRouteString = (routeString: string) => {
                return urlParser.parseRouteString(routeString);
            }
        }

        private on_pageCreated(page: Page) {
            return fireCallback(this.pageCreated, this, page);
        }

        /**
         * 获取应用的设置
         */
        get config(): ApplicationConfig {
            return this._config;
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

        private createPage(routeData: RouteData): Page {
            let previous_page = this.pages[this.pages.length - 1];
            let page = PageFactory.createInstance({ app: this, routeData, previous: previous_page });

            this.page_stack.push(page);
            if (this.page_stack.length > PAGE_STACK_MAX_SIZE) {
                let c = this.page_stack.shift();
                c.close();
            }

            return page;
        }

        protected hashchange() {
            let location = window.location as MyLocation;
            if (location.skip == true) {
                location.skip = false;
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

            var pageInfo = this.parseRouteString(routeString);
            var page = this.getPage(pageInfo.pageName);


            this.showPage(routeString);
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

            routeData.values = Utility.extend(routeData.values, args || {});

            let previous = this.currentPage;
            let result = new Promise((resolve, reject) => {
                let page = this.createPage(routeData);
                this.on_pageCreated(page);
                page.show();
                resolve(page);

                this.changeLocationHash(routeString);
            });

            return result;
        }

        private changeLocationHash(hash: string) {
            let location = window.location as MyLocation;
            location.skip = true;
            location.hash = '#' + hash;
        }

        protected createPageNode(): HTMLElement {
            var element = document.createElement('div');
            return element;
        }

        /**
         * 页面跳转
         * @param url 页面路径
         * @param args 传递到页面的参数
         */
        public redirect<T extends Page>(routeString: string, args?: any): Promise<T> {
            let location = window.location as MyLocation;
            location.skip = true;
            window.location.hash = routeString;
            return this.showPage<T>(routeString, args);
        }

        /**
         * 页面的返回
         */
        public back(args = undefined): Promise<void> {
            return new Promise<void>((reslove, reject) => {
                if (this.page_stack.length == 0) {
                    reject();

                    fireCallback(this.backFail, this, {});
                    return;
                }

                this.currentPage.close();
                //================================
                // 移除最后一个页面
                this.page_stack.pop();
                //================================

                reslove();
            });

        }
    }
} 
