var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "maishu-chitu-service", "./Page", "./Application", "./Errors"], function (require, exports, maishu_chitu_service_1, Page_1, Application_1, Errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class PageMaster {
        constructor(container, parser) {
            this.pageCreated = maishu_chitu_service_1.Callbacks();
            this.pageShowing = maishu_chitu_service_1.Callbacks();
            this.pageShown = maishu_chitu_service_1.Callbacks();
            this.pageType = Page_1.Page;
            this.pageDisplayType = Page_1.PageDisplayerImplement;
            this.cachePages = {};
            this.page_stack = new Array();
            this.nodes = {};
            this.MAX_PAGE_COUNT = 100;
            this.error = maishu_chitu_service_1.Callbacks();
            this.parser = parser || this.defaultPageNodeParser();
            if (!container)
                throw Errors_1.Errors.argumentNull("container");
            this.parser.actions = this.parser.actions || {};
            this.container = container;
        }
        defaultPageNodeParser() {
            let nodes = {};
            let p = {
                actions: {},
                parse: (pageName) => {
                    let node = nodes[pageName];
                    if (node == null) {
                        let path = `modules_${pageName}`.split('_').join('/');
                        node = { action: this.createDefaultAction(path, this.loadjs), name: pageName };
                        nodes[pageName] = node;
                    }
                    return node;
                }
            };
            return p;
        }
        createDefaultAction(url, loadjs) {
            return (page) => __awaiter(this, void 0, void 0, function* () {
                let actionExports = yield loadjs(url);
                if (!actionExports)
                    throw Errors_1.Errors.exportsCanntNull(url);
                let _action = actionExports.default;
                if (_action == null) {
                    throw Errors_1.Errors.canntFindAction(page.name);
                }
                let result;
                if (PageMaster.isClass(_action)) {
                    let action = _action;
                    result = new action(page, this);
                }
                else {
                    let action = _action;
                    result = action(page, this);
                }
                return result;
            });
        }
        loadjs(path) {
            return new Promise((reslove, reject) => {
                requirejs([path], function (result) {
                    reslove(result);
                }, function (err) {
                    reject(err);
                });
            });
        }
        on_pageCreated(page) {
            return this.pageCreated.fire(this, page);
        }
        get currentPage() {
            if (this.page_stack.length > 0)
                return this.page_stack[this.page_stack.length - 1];
            return null;
        }
        getPage(pageUrl, values) {
            if (!pageUrl)
                throw Errors_1.Errors.argumentNull('pageUrl');
            values = values || {};
            let cachePage = this.cachePages[pageUrl];
            if (cachePage != null) {
                cachePage.data = values || {};
                return { page: cachePage, isNew: false };
            }
            let page = this.createPage(pageUrl, values);
            this.cachePages[pageUrl] = page;
            this.on_pageCreated(page);
            return { page, isNew: true };
        }
        createPage(pageUrl, values) {
            if (!pageUrl)
                throw Errors_1.Errors.argumentNull('pageUrl');
            values = values || {};
            let element = this.createPageElement(pageUrl);
            let displayer = new this.pageDisplayType(this);
            console.assert(this.pageType != null);
            let page = new this.pageType({
                app: this,
                url: pageUrl,
                data: values,
                displayer,
                element,
            });
            let showing = (sender) => {
                this.pageShowing.fire(this, sender);
            };
            let shown = (sender) => {
                this.pageShown.fire(this, sender);
            };
            page.showing.add(showing);
            page.shown.add(shown);
            page.closed.add(() => {
                page.showing.remove(showing);
                page.shown.remove(shown);
            });
            return page;
        }
        createPageElement(pageName) {
            let element = document.createElement(Page_1.Page.tagName);
            this.container.appendChild(element);
            return element;
        }
        showPage(pageUrl, args, forceRender) {
            args = args || {};
            forceRender = forceRender == null ? false : true;
            if (!pageUrl)
                throw Errors_1.Errors.argumentNull('pageName');
            if (this.currentPage != null && this.currentPage.url == pageUrl)
                return this.currentPage;
            let { page, isNew } = this.getPage(pageUrl, args);
            if (isNew || forceRender) {
                let action = this.findPageAction(pageUrl);
                if (action == null)
                    throw Errors_1.Errors.actionCanntNull(pageUrl);
                action(page, this);
            }
            page.show();
            this.pushPage(page);
            console.assert(page == this.currentPage, "page is not current page");
            return page;
        }
        closePage(page) {
            if (page == null)
                throw Errors_1.Errors.argumentNull('page');
            page.close();
            delete this.cachePages[page.url];
            this.page_stack = this.page_stack.filter(o => o != page);
        }
        pushPage(page) {
            this.page_stack.push(page);
            if (this.page_stack.length > this.MAX_PAGE_COUNT) {
                let page = this.page_stack.shift();
                if (page)
                    this.closePage(page);
            }
        }
        findPageAction(pageUrl) {
            let routeData = Application_1.parseUrl(pageUrl);
            let pageName = routeData.pageName;
            let node = this.findSiteMapNode(pageName);
            if (node == null)
                throw Errors_1.Errors.pageNodeNotExists(pageName);
            let action = node.action;
            if (action == null)
                throw Errors_1.Errors.actionCanntNull(pageName);
            return node.action;
        }
        findSiteMapNode(pageName) {
            if (this.nodes[pageName])
                return this.nodes[pageName];
            let node = null;
            let action = this.parser.actions ? this.parser.actions[pageName] : null;
            if (action != null) {
                node = { action, name: pageName };
            }
            if (node == null && this.parser.parse != null) {
                node = this.parser.parse(pageName);
                console.assert(node.action != null);
            }
            if (node != null)
                this.nodes[pageName] = node;
            return node;
        }
        closeCurrentPage(passData) {
            var page = this.page_stack.pop();
            if (page == null)
                return;
            this.closePage(page);
            if (this.currentPage) {
                if (passData) {
                    console.assert(this.currentPage.data != null);
                    this.currentPage.data = Object.assign(this.currentPage.data, passData);
                }
                this.currentPage.show();
            }
        }
        get pageStack() {
            return this.page_stack;
        }
    }
    PageMaster.isClass = (function () {
        var toString = Function.prototype.toString;
        function fnBody(fn) {
            return toString.call(fn).replace(/^[^{]*{\s*/, '').replace(/\s*}[^}]*$/, '');
        }
        function isClass(fn) {
            return (typeof fn === 'function' &&
                (/^class(\s|\{\}$)/.test(toString.call(fn)) ||
                    (/^.*classCallCheck\(/.test(fnBody(fn)))));
        }
        return isClass;
    })();
    exports.PageMaster = PageMaster;
});
