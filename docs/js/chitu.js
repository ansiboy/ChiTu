

/*!
 * CHITU v1.5.0
 * https://github.com/ansiboy/ChiTu
 *
 * Copyright (c) 2016-2018, shu mai <ansiboy@163.com>
 * Licensed under the MIT License.
 *
 */

(function(factory) { 
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') { 
        // [1] CommonJS/Node.js 
        var target = module['exports'] || exports;
        var chitu = factory(target, require);
        Object.assign(target,chitu);
    } else if (typeof define === 'function' && define['amd']) {
        define(factory); 
    } else { 
        factory();
    } 
})(function() {
var chitu;
(function (chitu) {
    const EmtpyStateData = "";
    const DefaultPageName = "index";
    function parseUrl(app, url) {
        let sharpIndex = url.indexOf('#');
        if (sharpIndex < 0) {
            let pageName = DefaultPageName;
            return { pageName, values: {} };
        }
        let routeString = url.substr(sharpIndex + 1);
        if (!routeString)
            app.throwError(Errors.canntParseRouteString(url));
        if (routeString.startsWith('!')) {
            let url = createUrl(app.currentPage.name, app.currentPage.data);
            history.replaceState(EmtpyStateData, "", url);
            return;
        }
        let routePath;
        let search;
        let param_spliter_index = routeString.indexOf('?');
        if (param_spliter_index > 0) {
            search = routeString.substr(param_spliter_index + 1);
            routePath = routeString.substring(0, param_spliter_index);
        }
        else {
            routePath = routeString;
        }
        if (!routePath)
            app.throwError(Errors.canntParseRouteString(routeString));
        let values = {};
        if (search) {
            values = this.pareeUrlQuery(search);
        }
        let path_parts = routePath.split(this.path_spliter_char).map(o => o.trim()).filter(o => o != '');
        if (path_parts.length < 1) {
            app.throwError(Errors.canntParseRouteString(routeString));
        }
        let file_path = path_parts.join('/');
        let pageName = path_parts.join('.');
        return { pageName, values };
    }
    function createUrl(pageName, routeValues) {
        let path_parts = pageName.split('.');
        let path = path_parts.join('/');
        if (!routeValues)
            return `#${path}`;
        let params = "";
        for (let key in routeValues) {
            params = params + `&${key}=${routeValues[key]}`;
        }
        if (params.length > 0)
            params = params.substr(1);
        return `#${path}?${params}`;
    }
    var PAGE_STACK_MAX_SIZE = 30;
    var CACHE_PAGE_SIZE = 30;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';
    class Application {
        constructor(siteMap, allowCachePage) {
            this.pageCreated = chitu.Callbacks();
            this.pageType = chitu.Page;
            this.pageDisplayType = PageDisplayerImplement;
            this._runned = false;
            this.page_stack = new Array();
            this.cachePages = {};
            this.allowCachePage = true;
            this.allNodes = {};
            this.error = chitu.Callbacks();
            if (!siteMap) {
                this.throwError(Errors.argumentNull("siteMap"));
            }
            if (!siteMap.index)
                this.throwError(Errors.siteMapRootCanntNull());
            let indexNode = this.translateSiteMapNode(siteMap.index, DefaultPageName);
            this.travalNode(indexNode)
            if (allowCachePage != null)
                this.allowCachePage = allowCachePage;
        }
        translateSiteMapNode(source, name) {
            let action, children;
            let source_children;
            if (typeof source == 'object') {
                action = source.action;
                source_children = source.children;
            }
            else {
                action = source;
                source_children = {};
            }
            children = {};
            for (let key in source_children) {
                children[key] = this.translateSiteMapNode(source_children[key], key);
            }
            return {
                name,
                action,
                level: 0,
                children
            };
        }
        travalNode(node) {
            if (node == null)
                throw Errors.argumentNull('parent');
            let children = node.children || {};
            if (this.allNodes[node.name]) {
                this.throwError(Errors.duplicateSiteMapNode(node.name));
            }
            this.allNodes[node.name] = node;
            for (let key in children) {
                this.travalNode(children[key]);
            }
        }
        parseUrl(url) {
            let routeData = parseUrl(this, url);
            return routeData;
        }
        createUrl(pageName, values) {
            return createUrl(pageName, values);
        }
        on_pageCreated(page) {
            return this.pageCreated.fire(this, page);
        }
        get currentPage() {
            if (this.page_stack.length > 0)
                return this.page_stack[this.page_stack.length - 1];
            return null;
        }
        get pages() {
            return this.page_stack;
        }
        getPage(pageName, values) {
            let data = this.cachePages[pageName];
            if (data) {
                data.hitCount = (data.hitCount || 0) + 1;
                data.page.data = values || {};
                return { page: data.page, isNew: false };
            }
            let previous_page = this.pages[this.pages.length - 1];
            let element = this.createPageElement(pageName);
            let displayer = new this.pageDisplayType(this);
            let siteMapNode = this.findSiteMapNode(pageName);
            let action = siteMapNode ?
                siteMapNode.action :
                (page) => page.element.innerHTML = `page ${pageName} not found`;
            console.assert(this.pageType != null);
            let page = new this.pageType({
                app: this,
                previous: previous_page,
                name: pageName,
                data: values,
                displayer,
                element,
                action,
            });
            let keyes = Object.keys(this.cachePages);
            if (keyes.length > CACHE_PAGE_SIZE) {
                let key = keyes[0];
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
            let page_onloadComplete = (sender, args) => {
                if (this.allowCachePage)
                    this.cachePages[sender.name] = { page: sender, hitCount: 1 };
            };
            let page_onclosed = (sender) => {
                delete this.cachePages[sender.name];
                this.page_stack = this.page_stack.filter(o => o != sender);
                page.closed.remove(page_onclosed);
                page.loadComplete.remove(page_onloadComplete);
            };
            page.closed.add(page_onclosed);
            page.loadComplete.add(page_onloadComplete);
            this.on_pageCreated(page);
            return { page, isNew: true };
        }
        createPageElement(pageName) {
            let element = document.createElement(chitu.Page.tagName);
            document.body.appendChild(element);
            return element;
        }
        hashchange() {
            var routeData = this.parseUrl(location.href);
            if (routeData == null) {
                return;
            }
            var page = this.findPageFromStack(routeData.pageName);
            let previousPageIndex = this.page_stack.length - 2;
            this.showPageByUrl(location.href);
        }
        run() {
            if (this._runned)
                return;
            var app = this;
            this.hashchange();
            window.addEventListener('popstate', (event) => {
                if (event.state == Application.skipStateName)
                    return;
                this.hashchange();
            });
            this._runned = true;
        }
        findPageFromStack(name) {
            for (var i = this.page_stack.length - 1; i >= 0; i--) {
                var page = this.page_stack[i];
                if (page != null && page.name == name)
                    return page;
            }
            return null;
        }
        showPage(pageName, args) {
            if (!pageName)
                throw Errors.argumentNull('pageName');
            if (this.currentPage != null && this.currentPage.name == pageName)
                return;
            args = args || {};
            let oldCurrentPage = this.currentPage;
            let page = this.findPageFromStack(pageName);
            let isNewPage = false;
            let previousPageIndex = this.page_stack.length - 2;
            if (page != null && this.page_stack.indexOf(page) == previousPageIndex) {
                this.closeCurrentPage();
            }
            else {
                let obj = this.getPage(pageName, args);
                page = obj.page;
                isNewPage = obj.isNew;
                this.pushPage(page);
                page.show();
                console.assert(page == this.currentPage, "page is not current page");
            }
            let preRouteData = null;
            if (oldCurrentPage) {
                preRouteData = oldCurrentPage.data;
                oldCurrentPage.on_deactive();
            }
            console.assert(this.currentPage != null);
            if (isNewPage) {
                this.currentPage.on_active(args);
            }
            else {
                let onload = (sender, args) => {
                    sender.on_active(args);
                    sender.load.remove(onload);
                };
                this.currentPage.load.add(onload);
            }
            return this.currentPage;
        }
        showPageByUrl(url, args) {
            if (!url)
                this.throwError(Errors.argumentNull('url'));
            var routeData = this.parseUrl(url);
            if (routeData == null) {
                this.throwError(Errors.noneRouteMatched(url));
            }
            Object.assign(routeData.values, args || {});
            return this.showPage(routeData.pageName, routeData.values);
        }
        pushPage(page) {
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
            }
            page.previous = previous;
        }
        findSiteMapNode(pageName) {
            return this.allNodes[pageName];
        }
        setLocationHash(url) {
            history.pushState(EmtpyStateData, "", url);
        }
        closeCurrentPage() {
            if (this.page_stack.length <= 0)
                return;
            var page = this.page_stack.pop();
            if (this.allowCachePage) {
                page.previous = this.currentPage;
                page.hide();
            }
            else {
                page.close();
            }
        }
        clearPageStack() {
            if (this.allowCachePage) {
                this.page_stack.forEach(o => o.hide());
            }
            else {
                this.page_stack.forEach(o => {
                    o.close();
                });
            }
            this.page_stack = [];
        }
        redirect(pageName, args) {
            let result = this.showPage(pageName, args);
            let url = this.createUrl(pageName, args);
            this.setLocationHash(url);
            return result;
        }
        back() {
            history.back();
        }
        throwError(err, page) {
            let e = err;
            this.error.fire(this, e, page);
            if (!e.processed) {
                throw e;
            }
        }
    }
    Application.skipStateName = 'skip';
    chitu.Application = Application;
})(chitu || (chitu = {}));
class Errors {
    static pageNodeNotExists(pageName) {
        let msg = `Page node named ${pageName} is not exists.`;
        return new Error(msg);
    }
    static argumentNull(paramName) {
        var msg = `The argument "${paramName}" cannt be null.`;
        return new Error(msg);
    }
    static modelFileExpecteFunction(script) {
        var msg = `The eval result of script file "${script}" is expected a function.`;
        return new Error(msg);
    }
    static paramTypeError(paramName, expectedType) {
        var msg = `The param "${paramName}" is expected "${expectedType}" type.`;
        return new Error(msg);
    }
    static paramError(msg) {
        return new Error(msg);
    }
    static viewNodeNotExists(name) {
        var msg = `The view node "${name}" is not exists.`;
        return new Error(msg);
    }
    static pathPairRequireView(index) {
        var msg = `The view value is required for path pair, but the item with index "${index}" is miss it.`;
        return new Error(msg);
    }
    static notImplemented(name) {
        var msg = `'The method "${name}" is not implemented.'`;
        return new Error(msg);
    }
    static routeExists(name) {
        var msg = `Route named "${name}" is exists.`;
        return new Error(msg);
    }
    static noneRouteMatched(url) {
        var msg = `None route matched with url "${url}".`;
        var error = new Error(msg);
        return error;
    }
    static emptyStack() {
        return new Error('The stack is empty.');
    }
    static canntParseUrl(url) {
        var msg = `Can not parse the url "${url}" to route data.`;
        return new Error(msg);
    }
    static canntParseRouteString(routeString) {
        var msg = `Can not parse the route string "${routeString}" to route data.;`;
        return new Error(msg);
    }
    static routeDataRequireController() {
        var msg = 'The route data does not contains a "controller" file.';
        return new Error(msg);
    }
    static routeDataRequireAction() {
        var msg = 'The route data does not contains a "action" file.';
        return new Error(msg);
    }
    static viewCanntNull() {
        var msg = 'The view or viewDeferred of the page cannt null.';
        return new Error(msg);
    }
    static createPageFail(pageName) {
        var msg = `Create page "${pageName}" fail.`;
        return new Error(msg);
    }
    static actionTypeError(pageName) {
        let msg = `The action in page '${pageName}' is expect as function.`;
        return new Error(msg);
    }
    static canntFindAction(pageName) {
        let msg = `Cannt find action in page '${pageName}', is the exports has default field?`;
        return new Error(msg);
    }
    static exportsCanntNull(pageName) {
        let msg = `Exports of page '${pageName}' is null.`;
        return new Error(msg);
    }
    static scrollerElementNotExists() {
        let msg = "Scroller element is not exists.";
        return new Error(msg);
    }
    static resourceExists(resourceName, pageName) {
        let msg = `Rosource '${resourceName}' is exists in the resources of page '${pageName}'.`;
        return new Error(msg);
    }
    static siteMapRootCanntNull() {
        let msg = `The site map root node can not be null.`;
        return new Error(msg);
    }
    static duplicateSiteMapNode(name) {
        let msg = `The site map node ${name} is exists.`;
        return new Error(name);
    }
}
var chitu;
(function (chitu) {
    class Callback {
        constructor() {
            this.funcs = new Array();
        }
        add(func) {
            this.funcs.push(func);
        }
        remove(func) {
            this.funcs = this.funcs.filter(o => o != func);
        }
        fire(...args) {
            this.funcs.forEach(o => o(...args));
        }
    }
    chitu.Callback = Callback;
    function Callbacks() {
        return new Callback();
    }
    chitu.Callbacks = Callbacks;
    class ValueStore {
        constructor(value) {
            this.items = new Array();
            this._value = value;
        }
        add(func, sender) {
            this.items.push({ func, sender });
            return func;
        }
        remove(func) {
            this.items = this.items.filter(o => o.func != func);
        }
        fire(value) {
            this.items.forEach(o => o.func(value, o.sender));
        }
        get value() {
            return this._value;
        }
        set value(value) {
            this._value = value;
            this.fire(value);
        }
    }
    chitu.ValueStore = ValueStore;
})(chitu || (chitu = {}));
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var chitu;
(function (chitu) {
    class Page {
        constructor(params) {
            this.animationTime = 300;
            this.data = null;
            this.load = chitu.Callbacks();
            this.loadComplete = chitu.Callbacks();
            this.showing = chitu.Callbacks();
            this.shown = chitu.Callbacks();
            this.hiding = chitu.Callbacks();
            this.hidden = chitu.Callbacks();
            this.closing = chitu.Callbacks();
            this.closed = chitu.Callbacks();
            this.active = chitu.Callbacks();
            this.deactive = chitu.Callbacks();
            this._element = params.element;
            this._previous = params.previous;
            this._app = params.app;
            this._displayer = params.displayer;
            this._action = params.action;
            this.data = params.data;
            this._name = params.name;
            this.loadPageAction(this.name);
        }
        on_load() {
            return this.load.fire(this, this.data);
        }
        on_loadComplete() {
            return this.loadComplete.fire(this, this.data);
        }
        on_showing() {
            return this.showing.fire(this, this.data);
        }
        on_shown() {
            return this.shown.fire(this, this.data);
        }
        on_hiding() {
            return this.hiding.fire(this, this.data);
        }
        on_hidden() {
            return this.hidden.fire(this, this.data);
        }
        on_closing() {
            return this.closing.fire(this, this.data);
        }
        on_closed() {
            return this.closed.fire(this, this.data);
        }
        on_active(args) {
            console.assert(args != null, 'args is null');
            Object.assign(this.data, args);
            this.active.fire(this, args);
        }
        on_deactive() {
            this.deactive.fire(this, this.data);
        }
        show() {
            this.on_showing();
            return this._displayer.show(this).then(o => {
                this.on_shown();
            });
        }
        hide() {
            this.on_hiding();
            return this._displayer.hide(this).then(o => {
                this.on_hidden();
            });
        }
        close() {
            return this.hide().then(() => {
                this.on_closing();
                this._element.remove();
                this.on_closed();
            });
        }
        createService(type) {
            let service = new type();
            service.error.add((ender, error) => {
                this._app.throwError(error, this);
            });
            return service;
        }
        get element() {
            return this._element;
        }
        get previous() {
            return this._previous;
        }
        set previous(value) {
            this._previous = value;
        }
        get name() {
            return this._name;
        }
        loadPageAction(pageName) {
            return __awaiter(this, void 0, void 0, function* () {
                let action;
                if (typeof this._action == 'function') {
                    action = this._action;
                }
                else {
                    let actionResult;
                    try {
                        actionResult = yield loadjs(this._action);
                    }
                    catch (err) {
                        this._app.throwError(err, this);
                    }
                    if (!actionResult)
                        this._app.throwError(Errors.exportsCanntNull(pageName), this);
                    let actionName = 'default';
                    action = actionResult[actionName];
                    if (action == null) {
                        this._app.throwError(Errors.canntFindAction(pageName), this);
                    }
                }
                let actionExecuteResult;
                if (typeof action == 'function') {
                    let actionResult = action(this);
                    if (actionResult != null && actionResult.then != null && actionResult.catch != null) {
                        actionResult.then(() => this.on_loadComplete());
                    }
                    else {
                        this.on_loadComplete();
                    }
                }
                else {
                    this._app.throwError(Errors.actionTypeError(pageName), this);
                }
                this.on_load();
            });
        }
        reload() {
            return this.loadPageAction(this.name);
        }
    }
    Page.tagName = 'div';
    chitu.Page = Page;
})(chitu || (chitu = {}));
class PageDisplayerImplement {
    show(page) {
        page.element.style.display = 'block';
        if (page.previous != null) {
            page.previous.element.style.display = 'none';
        }
        return Promise.resolve();
    }
    hide(page) {
        page.element.style.display = 'none';
        if (page.previous != null) {
            page.previous.element.style.display = 'block';
        }
        return Promise.resolve();
    }
}
function ajax(url, options) {
    return __awaiter(this, void 0, void 0, function* () {
        let response = yield fetch(url, options);
        let responseText = response.text();
        let p;
        if (typeof responseText == 'string') {
            p = new Promise((reslove, reject) => {
                reslove(responseText);
            });
        }
        else {
            p = responseText;
        }
        let text = yield responseText;
        let textObject;
        let isJSONContextType = (response.headers.get('content-type') || '').indexOf('json') >= 0;
        if (isJSONContextType) {
            textObject = JSON.parse(text);
        }
        else {
            textObject = text;
        }
        if (response.status >= 300) {
            let err = new Error();
            err.method = options.method;
            err.name = `${response.status}`;
            err.message = isJSONContextType ? (textObject.Message || textObject.message) : textObject;
            err.message = err.message || response.statusText;
            throw err;
        }
        return textObject;
    });
}
function callAjax(url, options, service, error) {
    return new Promise((reslove, reject) => {
        let timeId;
        if (options.method == 'get') {
            timeId = setTimeout(() => {
                let err = new Error();
                err.name = 'timeout';
                err.message = '网络连接超时';
                reject(err);
                error.fire(service, err);
                clearTimeout(timeId);
            }, chitu.Service.settings.ajaxTimeout * 1000);
        }
        ajax(url, options)
            .then(data => {
            reslove(data);
            if (timeId)
                clearTimeout(timeId);
        })
            .catch(err => {
            reject(err);
            error.fire(service, err);
            if (timeId)
                clearTimeout(timeId);
        });
    });
}
var chitu;
(function (chitu) {
    class Service {
        constructor() {
            this.error = chitu.Callbacks();
        }
        ajax(url, options) {
            options = options || {};
            let data = options.data;
            let method = options.method;
            let headers = options.headers;
            let body;
            if (data != null) {
                let is_json = (headers['content-type'] || '').indexOf('json');
                if (is_json) {
                    body = JSON.stringify(data);
                }
                else {
                    body = new URLSearchParams();
                    for (let key in data) {
                        body.append(key, data[key]);
                    }
                }
            }
            return callAjax(url, { headers, body, method }, this, this.error);
        }
    }
    Service.settings = {
        ajaxTimeout: 30,
    };
    chitu.Service = Service;
})(chitu || (chitu = {}));
function combinePath(path1, path2) {
    if (!path1)
        throw Errors.argumentNull('path1');
    if (!path2)
        throw Errors.argumentNull('path2');
    path1 = path1.trim();
    if (!path1.endsWith('/'))
        path1 = path1 + '/';
    return path1 + path2;
}
function loadjs(path) {
    return new Promise((reslove, reject) => {
        requirejs([path], function (result) {
            reslove(result);
        }, function (err) {
            reject(err);
        });
    });
}
var chitu;
(function (chitu) {
    var mobile;
    (function (mobile) {
        let isCordovaApp = location.protocol === 'file:';
        class Page extends chitu.Page {
            constructor(params) {
                super(params);
                this.displayStatic = false;
                this.allowSwipeBackGestrue = false;
            }
        }
        Page.className = "mobile-page";
        mobile.Page = Page;
        class Application extends chitu.Application {
            constructor(args) {
                super(args);
                this.pageShown = chitu.Callbacks();
                this.pageType = Page;
                if (isiOS)
                    this.pageDisplayType = PageDisplayImplement;
                else
                    this.pageDisplayType = LowMachinePageDisplayImplement;
                this.pageCreated.add((sender, page) => {
                    this.pageShown.fire(this, { page });
                    return page;
                });
            }
        }
        mobile.Application = Application;
        var touch_move_time = 0;
        window.addEventListener('touchmove', function (e) {
            touch_move_time = Date.now();
        });
        var isiOS = (navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/) || []).filter(o => o).length > 0;
        function calculateAngle(x, y) {
            let d = Math.atan(Math.abs(y / x)) / 3.14159265 * 180;
            return d;
        }
        class PageDisplayImplement {
            constructor(app) {
                this.animationTime = 400;
                this.app = app;
                this.windowWidth = window.innerWidth;
                this.previousPageStartX = 0 - this.windowWidth / 3;
            }
            enableGesture(page) {
                let startY, currentY;
                let startX, currentX;
                let moved = false;
                let SIDE_WIDTH = 20;
                let enable = false;
                let horizontal_swipe_angle = 35;
                let vertical_pull_angle = 65;
                let colse_position = window.innerWidth / 2;
                let previousPageStartX = 0 - window.innerWidth / 3;
                page.element.addEventListener('touchstart', function (event) {
                    startY = event.touches[0].pageY;
                    startX = event.touches[0].pageX;
                    enable = startX <= SIDE_WIDTH;
                });
                page.element.addEventListener('touchmove', (event) => {
                    currentX = event.targetTouches[0].pageX;
                    currentY = event.targetTouches[0].pageY;
                    if (isiOS && currentX < 0 || !enable) {
                        return;
                    }
                    let deltaX = currentX - startX;
                    let angle = calculateAngle(deltaX, currentY - startY);
                    if (angle < horizontal_swipe_angle && deltaX > 0) {
                        page.element.style.transform = `translate(${deltaX}px, 0px)`;
                        page.element.style.transition = '0s';
                        if (page.previous != null) {
                            page.previous.element.style.transform = `translate(${previousPageStartX + deltaX / 3}px, 0px)`;
                            page.previous.element.style.transition = '0s';
                            page.previous.element.style.display = 'block';
                        }
                        disableNativeScroll(page.element);
                        moved = true;
                        event.preventDefault();
                        console.log('preventDefault gestured');
                    }
                });
                let end = (event) => {
                    if (!moved)
                        return;
                    let deltaX = currentX - startX;
                    if (deltaX > colse_position) {
                        console.assert(this.app != null);
                        this.app.back();
                    }
                    else {
                        page.element.style.transform = `translate(0px, 0px)`;
                        page.element.style.transition = '0.4s';
                        if (page.previous) {
                            page.previous.element.style.transform = `translate(${previousPageStartX}px,0px)`;
                            page.previous.element.style.transition = `0.4s`;
                            window.setTimeout(function () {
                                page.previous.element.style.display = 'none';
                                page.previous.element.style.removeProperty('transform');
                                page.previous.element.style.removeProperty('transition');
                                page.element.style.removeProperty('transform');
                                page.element.style.removeProperty('transition');
                            }, 400);
                        }
                    }
                    moved = false;
                };
                page.element.addEventListener('touchcancel', (event) => end(event));
                page.element.addEventListener('touchend', (event) => end(event));
                function disableNativeScroll(element) {
                    element.style.overflowY = 'hidden';
                }
                function enableNativeScroll(element) {
                    element.style.overflowY = 'scroll';
                }
            }
            show(page) {
                if (!page.gestured) {
                    page.gestured = true;
                    if (page.allowSwipeBackGestrue)
                        this.enableGesture(page);
                }
                let maxZIndex = 1;
                let pageElements = document.getElementsByClassName(Page.className);
                for (let i = 0; i < pageElements.length; i++) {
                    let zIndex = new Number(pageElements.item(i).style.zIndex || '0').valueOf();
                    if (zIndex > maxZIndex) {
                        maxZIndex = zIndex;
                    }
                }
                page.element.style.zIndex = `${maxZIndex + 1}`;
                page.element.style.display = 'block';
                if (page.displayStatic) {
                    if (page.previous) {
                        page.previous.element.style.display = 'none';
                    }
                    return Promise.resolve();
                }
                page.element.style.transform = `translate(100%,0px)`;
                if (page.previous) {
                    page.previous.element.style.transform = `translate(0px,0px)`;
                    page.previous.element.style.transition = `${this.animationTime / 1000}s`;
                }
                return new Promise(reslove => {
                    let delay = 100;
                    window.setTimeout(() => {
                        page.element.style.transform = `translate(0px,0px)`;
                        page.element.style.transition = `${this.animationTime / 1000}s`;
                        if (page.previous) {
                            page.previous.element.style.transform = `translate(${this.previousPageStartX}px,0px)`;
                            page.previous.element.style.transition = `${(this.animationTime + 200) / 1000}s`;
                        }
                    }, delay);
                    window.setTimeout(reslove, delay + this.animationTime);
                }).then(() => {
                    page.element.style.removeProperty('transform');
                    page.element.style.removeProperty('transition');
                    if (page.previous) {
                        page.previous.element.style.display = 'none';
                        page.previous.element.style.removeProperty('transform');
                        page.previous.element.style.removeProperty('transition');
                    }
                });
            }
            hide(page) {
                return new Promise(reslove => {
                    let now = Date.now();
                    if (!isCordovaApp && isiOS && now - touch_move_time < 500 || page.displayStatic) {
                        page.element.style.display = 'none';
                        if (page.previous) {
                            page.previous.element.style.display = 'block';
                            page.previous.element.style.transition = `0s`;
                            page.previous.element.style.transform = 'translate(0,0)';
                        }
                        reslove();
                        return;
                    }
                    page.element.style.transition = `${this.animationTime / 1000}s`;
                    page.element.style.transform = `translate(100%,0px)`;
                    if (page.previous) {
                        page.previous.element.style.display = 'block';
                        let delay = 0;
                        if (!page.previous.element.style.transform) {
                            page.previous.element.style.transform = `translate(${this.previousPageStartX}px, 0px)`;
                            delay = 50;
                        }
                        window.setTimeout(() => {
                            page.previous.element.style.transform = `translate(0px, 0px)`;
                            page.previous.element.style.transition = `${(this.animationTime - delay) / 1000}s`;
                        }, delay);
                    }
                    window.setTimeout(() => {
                        page.element.style.display = 'none';
                        page.element.style.removeProperty('transform');
                        page.element.style.removeProperty('transition');
                        if (page.previous) {
                            page.previous.element.style.removeProperty('transform');
                            page.previous.element.style.removeProperty('transition');
                        }
                        reslove();
                    }, 500);
                });
            }
        }
        class LowMachinePageDisplayImplement {
            constructor(app) {
                this.app = app;
                this.windowWidth = window.innerWidth;
            }
            enableGesture(page) {
                let startY, currentY;
                let startX, currentX;
                let moved = false;
                let SIDE_WIDTH = 20;
                let enable = false;
                let horizontal_swipe_angle = 35;
                let vertical_pull_angle = 65;
                let colse_position = window.innerWidth / 2;
                let previousPageStartX = 0 - window.innerWidth / 3;
                page.element.addEventListener('touchstart', function (event) {
                    startY = event.touches[0].pageY;
                    startX = event.touches[0].pageX;
                    enable = startX <= SIDE_WIDTH;
                    if (page.previous) {
                        page.previous.element.style.display = 'block';
                    }
                });
                page.element.addEventListener('touchmove', (event) => {
                    currentX = event.targetTouches[0].pageX;
                    currentY = event.targetTouches[0].pageY;
                    if (isiOS && currentX < 0 || !enable) {
                        return;
                    }
                    let deltaX = currentX - startX;
                    let angle = calculateAngle(deltaX, currentY - startY);
                    if (angle < horizontal_swipe_angle && deltaX > 0) {
                        page.element.style.transform = `translate(${deltaX}px, 0px)`;
                        page.element.style.transition = '0s';
                        disableNativeScroll(page.element);
                        moved = true;
                        event.preventDefault();
                        console.log('preventDefault gestured');
                    }
                });
                let end = (event) => {
                    if (!moved)
                        return;
                    let deltaX = currentX - startX;
                    if (deltaX > colse_position) {
                        console.assert(this.app != null);
                        this.app.back();
                    }
                    else {
                        page.element.style.transform = `translate(0px, 0px)`;
                        page.element.style.transition = '0.4s';
                        setTimeout(() => {
                            if (page.previous) {
                                page.previous.element.style.display = 'none';
                            }
                        }, 500);
                    }
                    setTimeout(() => {
                        page.element.style.removeProperty('transform');
                        page.element.style.removeProperty('transition');
                    }, 500);
                    moved = false;
                };
                page.element.addEventListener('touchcancel', (event) => end(event));
                page.element.addEventListener('touchend', (event) => end(event));
                function disableNativeScroll(element) {
                    element.style.overflowY = 'hidden';
                }
                function enableNativeScroll(element) {
                    element.style.overflowY = 'scroll';
                }
            }
            show(page) {
                if (!page.gestured) {
                    page.gestured = true;
                    if (page.allowSwipeBackGestrue)
                        this.enableGesture(page);
                }
                let maxZIndex = 1;
                let pageElements = document.getElementsByClassName('page');
                for (let i = 0; i < pageElements.length; i++) {
                    let zIndex = new Number(pageElements.item(i).style.zIndex || '0').valueOf();
                    if (zIndex > maxZIndex) {
                        maxZIndex = zIndex;
                    }
                }
                page.element.style.zIndex = `${maxZIndex + 1}`;
                page.element.style.display = 'block';
                if (page.displayStatic) {
                    if (page.previous) {
                        page.previous.element.style.display = 'none';
                    }
                    return Promise.resolve();
                }
                page.element.style.transform = `translate(100%,0px)`;
                return new Promise(reslove => {
                    const playTime = 500;
                    let delay = 50;
                    window.setTimeout(() => {
                        page.element.style.transform = `translate(0px,0px)`;
                        page.element.style.transition = `${playTime / 1000}s`;
                    }, delay);
                    window.setTimeout(reslove, delay + playTime);
                }).then(() => {
                    page.element.style.removeProperty('transform');
                    page.element.style.removeProperty('transition');
                    if (page.previous) {
                        page.previous.element.style.display = 'none';
                    }
                });
            }
            hide(page) {
                if (isiOS && Date.now() - touch_move_time < 500 || page.displayStatic) {
                    page.element.style.display = 'none';
                    if (page.previous) {
                        page.previous.element.style.display = 'block';
                        page.previous.element.style.removeProperty('transform');
                        page.previous.element.style.removeProperty('transition');
                    }
                    return Promise.resolve();
                }
                page.element.style.transform = `translate(100%,0px)`;
                page.element.style.transition = '0.4s';
                if (page.previous) {
                    page.previous.element.style.display = 'block';
                }
                return new Promise(reslove => {
                    window.setTimeout(function () {
                        page.element.style.display = 'none';
                        page.element.style.removeProperty('transform');
                        page.element.style.removeProperty('transition');
                        reslove();
                    }, 500);
                });
            }
        }
    })(mobile = chitu.mobile || (chitu.mobile = {}));
})(chitu || (chitu = {}));

window['chitu'] = window['chitu'] || chitu 
                            
 return chitu;
            });