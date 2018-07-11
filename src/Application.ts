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
    }

    export interface SiteMap {
        nodes: { [key: string]: PageNode },
        pageNameParse?: (pageName: string) => PageNode
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
        // 移除 function, null, object 字段
        let paramsText = '';
        for (let key in params) {
            let value = params[key];
            let type = typeof params[key];
            if (type == 'function' || type == 'object' || value == null) {
                continue;
            }
            paramsText = paramsText == '' ? `?${key}=${params[key]}` : paramsText + `&${key}=${params[key]}`;
        }
        //==============================================
        return `#${path}${paramsText}`;
    }

    /**
     * 应用，处理页面 URL 和 Page 之间的关联
     */
    export class Application extends PageMaster {

        private _runned: boolean = false;
        private closeCurrentOnBack: boolean;
        // private pageStack = new Array<string>();

        /**
         * 构造函数
         * @param siteMap 地图，描述站点各个页面结点
         * @param allowCachePage 是允许缓存页面，默认 true
         */
        constructor(siteMap: SiteMap) {
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

        // protected hashchange() {

        //     var routeData = this.parseUrl(location.href);
        //     if (routeData == null) {
        //         return;
        //     }

        //     this.showPageByUrl(location.href);
        // }

        /**
         * 运行当前应用
         */
        public run() {
            if (this._runned) return;

            this.showPageByUrl(location.href);
            window.addEventListener('popstate', () => {
                this.showPageByUrl(location.href);
            });

            this._runned = true;
        }

        /**
         * 显示页面
         * @param url 页面的路径
         */
        private showPageByUrl(url: string): Page {
            if (!url) throw Errors.argumentNull('url');

            var routeData = this.parseUrl(url);
            if (routeData == null) {
                throw Errors.noneRouteMatched(url);
            }

            let isBack = this.pageStack.length >= 2 && routeData.pageName == this.pageStack[this.pageStack.length - 2].name;
            if (isBack) {
                if (this.closeCurrentOnBack)
                    this.closeCurrentPage();
                else {
                    var page = this.pageStack.pop();
                    page.hide(this.currentPage);
                }

                return this.currentPage;
            }

            let node = this.findSiteMapNode(routeData.pageName); //this.nodes[routeData.pageName];
            if (node == null) throw Errors.pageNodeNotExists(routeData.pageName);
            return this.showPage(node, routeData.values);
        }

        public setLocationHash(url: string) {
            history.pushState(EmtpyStateData, "", url)
        }

        public redirect(node: PageNode, args?: any): Page
        public redirect(node: PageNode, fromCache?: boolean, args?: any): Page
        public redirect(pageName: string, args?: any): Page
        public redirect(pageName: string, fromCache?: boolean, args?: any): Page
        /**
         * 页面跳转
         * @param node 页面节点
         * @param fromCache 是否从缓存读取
         * @param args 传递到页面的参数
         */
        public redirect(node: PageNode | string, fromCache?: any, args?: any): Page {
            if (!node) throw Errors.argumentNull("node");
            if (typeof node == 'string') {
                let pageName = node;
                node = this.findSiteMapNode(pageName);
                if (node == null)
                    throw Errors.pageNodeNotExists(pageName);
            }

            let result = this.showPage(node, fromCache, args);
            if (typeof (fromCache) == 'object') {
                args = fromCache;
            }
            let url = this.createUrl(node.name, args);
            this.setLocationHash(url);

            return result;
        }


        /**
         * 返回上一个页面
         * @param closeCurrentPage 返回上一个页面时，是否关闭当前页面，true 关闭当前页，false 隐藏当前页。默认为 true。
         */
        public back(closeCurrentPage?: boolean) {
            this.closeCurrentOnBack = closeCurrentPage == null ? true : closeCurrentPage;
            history.back();
        }
    }
} 
