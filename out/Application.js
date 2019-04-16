"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const maishu_chitu_service_1 = require("maishu-chitu-service");
const PageMaster_1 = require("./PageMaster");
const Errors_1 = require("./Errors");
const EmtpyStateData = "";
const DefaultPageName = "index";
function parseUrl(app, url) {
    if (!app)
        throw Errors_1.Errors.argumentNull('app');
    if (!url)
        throw Errors_1.Errors.argumentNull('url');
    let sharpIndex = url.indexOf('#');
    let routeString;
    if (sharpIndex >= 0)
        routeString = url.substr(sharpIndex + 1);
    else
        routeString = url;
    if (!routeString)
        throw Errors_1.Errors.canntParseRouteString(url);
    if (routeString.startsWith('!')) {
        throw Errors_1.Errors.canntParseRouteString(routeString);
    }
    let routePath;
    let search = null;
    let param_spliter_index = routeString.indexOf('?');
    if (param_spliter_index >= 0) {
        search = routeString.substr(param_spliter_index + 1);
        routePath = routeString.substring(0, param_spliter_index);
    }
    else {
        routePath = routeString;
    }
    if (!routePath)
        routePath = DefaultPageName;
    let values = {};
    if (search) {
        values = pareeUrlQuery(search);
    }
    let pageName = routePath;
    return { pageName, values };
}
function pareeUrlQuery(query) {
    let match, pl = /\+/g, search = /([^&=]+)=?([^&]*)/g, decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };
    let urlParams = {};
    while (match = search.exec(query))
        urlParams[decode(match[1])] = decode(match[2]);
    return urlParams;
}
function createUrl(pageName, params) {
    let path_parts = pageName.split('.');
    let path = path_parts.join('/');
    if (!params)
        return `#${path}`;
    let paramsText = '';
    for (let key in params) {
        let value = params[key];
        let type = typeof params[key];
        if (type != 'string' || value == null) {
            continue;
        }
        paramsText = paramsText == '' ? `?${key}=${params[key]}` : paramsText + `&${key}=${params[key]}`;
    }
    return `#${path}${paramsText}`;
}
class Application extends PageMaster_1.PageMaster {
    constructor(args) {
        super((args || {}).container || document.body, (args || {}).parser);
        this._runned = false;
        this.closeCurrentOnBack = null;
        this.tempPageData = undefined;
    }
    parseUrl(url) {
        if (!url)
            throw Errors_1.Errors.argumentNull('url');
        let routeData = parseUrl(this, url);
        return routeData;
    }
    createUrl(pageName, values) {
        return createUrl(pageName, values);
    }
    run() {
        if (this._runned)
            return;
        let showPage = () => {
            let url = location.href;
            let sharpIndex = url.indexOf('#');
            let routeString = url.substr(sharpIndex + 1);
            if (routeString.startsWith('!')) {
                return;
            }
            if (sharpIndex < 0) {
                url = '#' + DefaultPageName;
            }
            this.showPageByUrl(url, true);
        };
        showPage();
        window.addEventListener('popstate', () => {
            showPage();
        });
        this._runned = true;
    }
    showPageByUrl(url, fromCache) {
        if (!url)
            throw Errors_1.Errors.argumentNull('url');
        var routeData = this.parseUrl(url);
        if (routeData == null) {
            throw Errors_1.Errors.noneRouteMatched(url);
        }
        let tempPageData = this.fetchTemplatePageData();
        let result = null;
        if (this.closeCurrentOnBack == true) {
            this.closeCurrentOnBack = null;
            if (tempPageData == null)
                this.closeCurrentPage();
            else
                this.closeCurrentPage(tempPageData);
            result = this.currentPage;
        }
        else if (this.closeCurrentOnBack == false) {
            this.closeCurrentOnBack = null;
            var page = this.pageStack.pop();
            if (page == null)
                throw new Error('page is null');
            page.hide(this.currentPage);
            result = this.currentPage;
        }
        if (result == null || result.name != routeData.pageName) {
            let args = routeData.values || {};
            if (tempPageData) {
                args = Object.assign(args, tempPageData);
            }
            result = this.showPage(routeData.pageName, args);
        }
        return result;
    }
    fetchTemplatePageData() {
        if (this.tempPageData == null) {
            return null;
        }
        let data = this.tempPageData;
        this.tempPageData = undefined;
        return data;
    }
    setLocationHash(url) {
        history.pushState(EmtpyStateData, "", url);
    }
    redirect(pageNameOrUrl, args) {
        if (!pageNameOrUrl)
            throw Errors_1.Errors.argumentNull('pageNameOrUrl');
        let page = this.showPageByNameOrUrl(pageNameOrUrl, args);
        let url = this.createUrl(page.name, page.data);
        this.setLocationHash(url);
        return page;
    }
    forward(pageNameOrUrl, args, setUrl) {
        if (!pageNameOrUrl)
            throw Errors_1.Errors.argumentNull('pageNameOrUrl');
        if (setUrl == null)
            setUrl = true;
        let page = this.showPageByNameOrUrl(pageNameOrUrl, args, true);
        if (setUrl) {
            let url = this.createUrl(page.name, page.data);
            this.setLocationHash(url);
        }
        else {
            history.pushState(pageNameOrUrl, "", "");
        }
        return page;
    }
    showPageByNameOrUrl(pageNameOrUrl, args, rerender) {
        let pageName;
        if (pageNameOrUrl.indexOf('?') < 0) {
            pageName = pageNameOrUrl;
        }
        else {
            let obj = this.parseUrl(pageNameOrUrl);
            pageName = obj.pageName;
            args = Object.assign(obj.values, args || {});
        }
        return this.showPage(pageName, args, rerender);
    }
    reload(pageName, args) {
        let result = this.showPage(pageName, args, true);
        return result;
    }
    back(closeCurrentPage, data) {
        const closeCurrentPageDefault = true;
        if (typeof closeCurrentPage == 'object') {
            data = closeCurrentPage;
            closeCurrentPage = null;
        }
        this.closeCurrentOnBack = closeCurrentPage == null ? closeCurrentPageDefault : closeCurrentPage;
        this.tempPageData = data;
        history.back();
    }
    createService(type) {
        type = type || maishu_chitu_service_1.Service;
        let service = new type();
        service.error.add((sender, error) => {
            this.error.fire(this, error, null);
        });
        return service;
    }
}
exports.Application = Application;
