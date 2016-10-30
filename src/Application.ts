namespace chitu {

    export interface RouteData {
        /** 页面的路径，即 js 文件 */
        actionPath: string,
        /** 视图的路径，即 html 文件 */
        viewPath: string,
        /** 路由参数值，可以通过它来获取 url 参数 */
        values: any,
        /** 页面名称 */
        pageName: string,
        /** 其它资源文件的路径 */
        resource?: string[]
    }

    class UrlParser {
        private path_string = '';
        private path_spliter_char = '/';
        private param_spliter = '?'
        private name_spliter_char = '.';

        private _actionPath = '';
        private _viewPath = '';
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

        public parseUrl(url: string): RouteData {
            if (!url)
                throw Errors.argumentNull('url');

            let a = document.createElement('a');
            a.href = url;

            if (!a.hash || a.hash.length < this.HASH_MINI_LENGTH)
                throw Errors.canntParseUrl(url);

            let path: string;
            let search: string;
            let param_spliter_index: number = a.hash.indexOf(this.param_spliter);
            if (param_spliter_index > 0) {
                search = a.hash.substr(param_spliter_index + 1);
                path = a.hash.substring(1, param_spliter_index);
            }
            else {
                path = a.hash.substr(1);
            }

            if (!path)
                throw Errors.canntParseUrl(url);

            if (search) {
                this._parameters = this.pareeUrlQuery(search);
            }

            let page_name = path.split(this.path_spliter_char).join(this.name_spliter_char);
            var result = {
                actionPath: this.pathBase + path,
                viewPath: this.pathBase + path + '.html',
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



    var PAGE_STACK_MAX_SIZE = 10;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';

    export interface ApplicationConfig {
        /**
         * 获取页面容器，依据 routeData 获取页面容器
         * param routeData 页面路由数据
         * param previous 上一个页面容器，如果当前页面容器是第一个，则为空值 
         */
        //container?: (routeData: RouteData, prevous: PageContainer) => PageContainer,

        /**
         * 页面的基本路径
         */
        pathBase?: string,
    }

    export class Application {

        /**
         * 当页面创建后发生
         */
        pageCreated = Callbacks<Application, Pageview>();

        private _config: ApplicationConfig;
        private _runned: boolean = false;
        private zindex: number;
        private back_deferred: JQueryDeferred<any>;
        private start_flag_hash: string;
        private start_hash: string;
        private container_stack = new Array<Page>();

        /**
         * 解释 url，将 url 解释为 RouteData
         * param url 要解释的 url
         */
        parseUrl: (url: string) => RouteData;

        /**
         * 调用 back 方法返回上一页面，如果返回上一页面不成功，则引发此事件
         */
        backFail = Callbacks<Application, {}>();

        constructor(config?: ApplicationConfig) {

            config = config || {};
            this._config = config;

            let urlParser = new UrlParser(this._config.pathBase);
            this.parseUrl = (url: string) => {
                return urlParser.parseUrl(url);
            }
        }

        private on_pageCreated(page: Pageview) {
            return chitu.fireCallback(this.pageCreated, this, page);
        }

        /**
         * 获取应用的设置
         */
        get config(): chitu.ApplicationConfig {
            return this._config;
        }

        /**
         * 获取当前页面
         */
        get currentPage(): chitu.Pageview {
            if (this.container_stack.length > 0)
                return this.container_stack[this.container_stack.length - 1].page;

            return null;
        }

        /**
         * 获取当前应用中的所创建页面容器
         */
        get pageContainers(): Array<Page> {
            return this.container_stack;
        }

        private createPageContainer(routeData: RouteData): Page {
            let previous_container = this.pageContainers[this.pageContainers.length - 1];
            let container = PageFactory.createInstance({app:this,routeData,previous:previous_container });

            this.container_stack.push(container);
            if (this.container_stack.length > PAGE_STACK_MAX_SIZE) {
                let c = this.container_stack.shift();
                c.close();
            }

            return container;
        }
        protected hashchange() {
            if (window.location['skip'] == true) {
                window.location['skip'] = false;
                return;
            }

            var back_deferred: JQueryDeferred<any>
            if (this.back_deferred && this.back_deferred['processed'] == null) {
                back_deferred = this.back_deferred;
                back_deferred['processed'] = true;
            }

            var hash = window.location.hash;
            if (!hash || hash == this.start_flag_hash) {
                if (!hash)
                    console.log('The url is not contains hash.url is ' + window.location.href);

                if (hash == this.start_flag_hash) {
                    window.history.pushState({}, '', this.start_hash);
                    console.log('The hash is start url, the hash is ' + hash);
                }

                if (back_deferred)
                    back_deferred.reject();

                return;
            }

            if (!this.start_flag_hash) {
                //TODO:生成随机字符串
                this.start_flag_hash = '#AABBCCDDEEFF';
                this.start_hash = hash;
                window.history.replaceState({}, '', this.start_flag_hash);
                window.history.pushState({}, '', hash);
            }

            var url = location.href;
            var pageInfo = this.parseUrl(url);
            var page = this.getPageView(pageInfo.pageName);
            var container: Page = page != null ? page.container : null;
            if (container != null && $.inArray(container, this.container_stack) == this.container_stack.length - 2) {
                var c = this.container_stack.pop();
                if (c.previous != null) {
                    c.previous.show();
                }
                c.close();
            }
            else {
                this.showPage(url);
            }

            if (back_deferred)
                back_deferred.resolve();
        }

        /**
         * 运行当前应用
         */
        public run() {
            if (this._runned) return;

            var app = this;

            $.proxy(this.hashchange, this)();
            $(window).bind('hashchange', $.proxy(this.hashchange, this));

            this._runned = true;
        }

        /**
         * 通过页面的名称，获取页面
         */
        public getPageView(name: string): Pageview {
            for (var i = this.container_stack.length - 1; i >= 0; i--) {
                var page = this.container_stack[i].page; //.pages[name];
                if (page != null && page.name == name)
                    return page;
            }
            return null;
        }

        /**
         * 显示页面
         * param url 页面的路径
         * param args 传递到页面的参数 
         */
        public showPage<T extends Pageview>(url: string, args?: any): JQueryPromise<T> {
            if (!url) throw Errors.argumentNull('url');

            var routeData = this.parseUrl(url);
            if (routeData == null) {
                throw Errors.noneRouteMatched(url);
            }

            routeData.values = $.extend(routeData.values, args || {});

            let previous = this.currentPage;
            let result = $.Deferred<T>();
            let container = this.createPageContainer(routeData);
            container.pageCreated.add((sender, page: T) => {
                this.on_pageCreated(page);
                result.resolve(page);
            });
            container.show();
            if (previous != null)
                previous.container.hide();

            return result;
        }

        protected createPageNode(): HTMLElement {
            var element = document.createElement('div');
            return element;
        }

        /**
         * 页面跳转
         * param url 页面路径
         * param args 传递到页面的参数
         */
        public redirect<T extends Pageview>(url: string, args?: any): JQueryPromise<T> {
            window.location['skip'] = true;
            window.location.hash = url;
            return this.showPage<T>(url, args);
        }

        /**
         * 页面的返回
         */
        public back(args = undefined): JQueryPromise<any> {
            this.back_deferred = $.Deferred();
            if (window.history.length == 0) {
                this.back_deferred.reject();
                //================================
                // 移除最后一个页面
                this.container_stack.pop();
                //================================
                fireCallback(this.backFail, this, {});
                return this.back_deferred;
            }

            window.history.back();
            return this.back_deferred;
        }
    }
} 
