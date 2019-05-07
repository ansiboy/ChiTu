define(["require", "exports", "maishu-chitu-service"], function (require, exports, maishu_chitu_service_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Page {
        constructor(params) {
            this.data = {};
            this.showing = maishu_chitu_service_1.Callbacks();
            this.shown = maishu_chitu_service_1.Callbacks();
            this.hiding = maishu_chitu_service_1.Callbacks();
            this.hidden = maishu_chitu_service_1.Callbacks();
            this.closing = maishu_chitu_service_1.Callbacks();
            this.closed = maishu_chitu_service_1.Callbacks();
            this._element = params.element;
            this._app = params.app;
            this._displayer = params.displayer;
            this.data = params.data;
            this._name = params.name;
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
        show() {
            this.on_showing();
            let currentPage = this._app.currentPage;
            if (this == currentPage) {
                currentPage = null;
            }
            return this._displayer.show(this, currentPage).then(o => {
                this.on_shown();
            });
        }
        hide(currentPage) {
            this.on_hiding();
            return this._displayer.hide(this, currentPage).then(o => {
                this.on_hidden();
            });
        }
        close() {
            this.on_closing();
            this._element.remove();
            this.on_closed();
            return Promise.resolve();
        }
        createService(type) {
            type = type || maishu_chitu_service_1.Service;
            let service = new type();
            service.error.add((sender, error) => {
                this._app.error.fire(this._app, error, this);
            });
            return service;
        }
        get element() {
            return this._element;
        }
        get name() {
            return this._name;
        }
        get app() {
            return this._app;
        }
    }
    Page.tagName = 'div';
    exports.Page = Page;
    class PageDisplayerImplement {
        show(page, previous) {
            page.element.style.display = 'block';
            if (previous != null) {
                previous.element.style.display = 'none';
            }
            return Promise.resolve();
        }
        hide(page, previous) {
            page.element.style.display = 'none';
            if (previous != null) {
                previous.element.style.display = 'block';
            }
            return Promise.resolve();
        }
    }
    exports.PageDisplayerImplement = PageDisplayerImplement;
});
