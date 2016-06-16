namespace chitu {

    export interface RouteData {
        actionPath: string,
        viewPath: string,
        values: any,
        pageName: string,
        resource?: string[]
    }

    export class UrlParser {
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

        public pareeUrl(url: string): RouteData {
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

    // type ParamConfig = {
    //     container?: (routeData: RouteData, prevous: PageContainer) => PageContainer,
    //     openSwipe?: (routeData: RouteData) => SwipeDirection,
    //     closeSwipe?: (route: RouteData) => SwipeDirection,
    //     pathBase?: string
    // };
    export interface ApplicationConfig {
        container?: (routeData: RouteData, prevous: PageContainer) => PageContainer,
        openSwipe?: (routeData: RouteData) => SwipeDirection,
        closeSwipe?: (route: RouteData) => SwipeDirection,
        pathBase?: string,
    }

    export class Application {
        pageCreating = Callbacks<Application, any>();
        pageCreated = Callbacks<Application, Page>();

        private _config: ApplicationConfig;
        private _runned: boolean = false;
        private zindex: number;
        private back_deferred: JQueryDeferred<any>;
        private start_flag_hash: string;
        private start_hash: string;
        private container_stack = new Array<PageContainer>();

        parseUrl: (url: string) => RouteData;

        constructor(config?: ApplicationConfig) {
            if (config == null)
                config = {};

            this._config = {};
            this._config.openSwipe = config.openSwipe || function (routeData: RouteData) { return SwipeDirection.None; };
            this._config.closeSwipe = config.closeSwipe || function (routeData: RouteData) { return SwipeDirection.None; };
            this._config.container = config.container || $.proxy(function (routeData: RouteData, previous: PageContainer) {
                return PageContainerFactory.createInstance(this.app, routeData, previous);
            }, { app: this });

            let urlParser = new UrlParser(this._config.pathBase);
            this.parseUrl = (url: string) => {
                return urlParser.pareeUrl(url);
            }
        }

        private on_pageCreating() {
            return chitu.fireCallback(this.pageCreating, this, {});
        }
        private on_pageCreated(page: chitu.Page) {
            return chitu.fireCallback(this.pageCreated, this, page);
        }
        get config(): chitu.ApplicationConfig {
            return this._config;
        }
        currentPage(): chitu.Page {
            if (this.container_stack.length > 0)
                return this.container_stack[this.container_stack.length - 1].currentPage;

            return null;
        }
        get pageContainers(): Array<PageContainer> {
            return this.container_stack;
        }
        private createPageContainer(routeData: RouteData): PageContainer {
            var container = this.config.container(routeData, this.pageContainers[this.pageContainers.length - 1]);

            this.container_stack.push(container);
            if (this.container_stack.length > PAGE_STACK_MAX_SIZE) {
                var c = this.container_stack.shift();
                c.close(SwipeDirection.None);
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
            var page = this.getPage(pageInfo.pageName);
            var container: PageContainer = page != null ? page.container : null;
            if (container != null && $.inArray(container, this.container_stack) == this.container_stack.length - 2) {
                var c = this.container_stack.pop();
                var swipe = this.config.closeSwipe(c.currentPage.routeData);
                if (c.previous != null) {
                    c.previous.visible = true;
                }
                c.close(swipe);
            }
            else {
                this.showPage(url);
            }

            if (back_deferred)
                back_deferred.resolve();
        }

        public run() {
            if (this._runned) return;

            var app = this;

            $.proxy(this.hashchange, this)();
            $(window).bind('hashchange', $.proxy(this.hashchange, this));

            this._runned = true;
        }
        public getPage(name: string): chitu.Page {
            for (var i = this.container_stack.length - 1; i >= 0; i--) {
                var page = this.container_stack[i].pages[name];
                if (page != null)
                    return page;
            }
            return null;
        }
        public showPage<T extends Page>(url: string, args?: any): JQueryPromise<T> {
            if (!url) throw Errors.argumentNull('url');

            var routeData = this.parseUrl(url);
            if (routeData == null) {
                throw Errors.noneRouteMatched(url);
            }

            routeData.values = $.extend(routeData.values, args || {});

            var container = this.createPageContainer(routeData);
            container.pageCreated.add((sender, page: Page) => this.on_pageCreated(page));
            var swipe = this.config.openSwipe(routeData);
            var result = container.showPage(routeData, swipe);

            return result;
        }
        protected createPageNode(): HTMLElement {
            var element = document.createElement('div');
            return element;
        }
        public redirect<T extends Page>(url: string, args?: any): JQueryPromise<T> {
            window.location['skip'] = true;
            window.location.hash = url;
            return this.showPage<T>(url, args);
        }
        public back(args = undefined): JQueryPromise<any> {
            this.back_deferred = $.Deferred();
            if (window.history.length == 0) {
                this.back_deferred.reject();
                return this.back_deferred;
            }

            window.history.back();
            return this.back_deferred;
        }
    }
} 
