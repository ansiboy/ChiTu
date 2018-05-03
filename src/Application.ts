/// <reference path="PageMaster"/>

namespace chitu {

    export type Action = ((page: Page) => void);
    export type SiteMapChildren<T extends PageNode> = { [key: string]: T }

    /**
     * 页面结点
     */
    export interface PageNode {
        action: Action | string,
        name?: string,
        cache?: boolean,
    }

    export interface SiteMap<T extends PageNode> {
        nodes: { [key: string]: T }
    }

    const EmtpyStateData = "";
    const DefaultPageName = "index"
    function parseUrl(app: Application, url: string): { pageName: string, values: PageData } {
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

        let pageName = routePath;
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
     * 应用，处理页面 URL 和 Page 之间的关联
     */
    export class Application extends PageMaster {

        private static skipStateName = 'skip';
        private _runned: boolean = false;

        /**
         * 构造函数
         * @param siteMap 地图，描述站点各个页面结点
         * @param allowCachePage 是允许缓存页面，默认 true
         */
        constructor(siteMap: SiteMap<PageNode>) {
            super(siteMap, document.body);
        }

        /**
         * 解释路由，将路由字符串解释为 RouteData 对象
         * @param url 要解释的 路由字符串
         */
        parseUrl(url: string) {
            let routeData = parseUrl(this, url);
            return routeData;
        }

        /**
         * 创建 url
         * @param pageName 页面名称
         * @param values 页面参数
         */
        createUrl(pageName: string, values?: { [key: string]: string }) {
            return createUrl(pageName, values);
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
         * @param url 页面的路径
         * @param args 传递到页面的参数 
         */
        private showPageByUrl(url: string): Page {
            if (!url) throw Errors.argumentNull('url');

            var routeData = this.parseUrl(url);
            if (routeData == null) {
                throw Errors.noneRouteMatched(url);
            }

            let node = this.siteMap.nodes[routeData.pageName];
            if (node == null) throw Errors.pageNodeNotExists(routeData.pageName);
            return this.showPage(node, routeData.values);
        }

        public setLocationHash(url: string) {
            history.pushState(Application.skipStateName, "", url)
        }

        /**
         * 页面跳转
         * @param node 页面节点
         * @param args 传递到页面的参数
         */
        public redirect(node: PageNode, args?: any): Page {
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
    }
} 
