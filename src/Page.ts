

namespace chitu {

    export type PageDataType = { [key: string]: any }

    export interface PageDisplayConstructor {
        new(app: Application): PageDisplayer
    }

    export interface PageDisplayer {
        show(page: Page): Promise<any>;
        hide(page: Page): Promise<any>;
    }

    export interface PageParams {
        app: Application,
        action: ActionType,
        element: HTMLElement,
        displayer: PageDisplayer,
        previous?: Page,
        name: string,
        data: PageDataType,
    }

    /**
     * 页面，用把 HTML Element 包装起来。
     */
    export class Page {
        private animationTime: number = 300;
        private num: Number;

        private _element: HTMLElement;
        private _previous: Page;
        private _app: Application;
        // private _routeData: RouteData;
        private _displayer: PageDisplayer;
        private _action: ((page: Page) => void) | string;
        private _name: string

        static tagName = 'div';

        // error = Callbacks<Page, Error>();
        data: PageDataType = null

        /** 脚本文件加载完成后引发 */
        load = Callbacks<this, PageDataType>();

        /** 脚本执行完成后引发 */
        loadComplete = Callbacks<this, PageDataType>();

        /** 页面显示时引发 */
        showing = Callbacks<this, PageDataType>();

        /** 页面显示时完成后引发 */
        shown = Callbacks<this, PageDataType>();

        hiding = Callbacks<this, PageDataType>();
        hidden = Callbacks<this, PageDataType>();

        closing = Callbacks<this, PageDataType>();
        closed = Callbacks<this, PageDataType>();

        active = Callbacks<this, PageDataType>();
        deactive = Callbacks<this, PageDataType>();

        constructor(params: PageParams) {
            this._element = params.element;
            this._previous = params.previous;
            this._app = params.app;
            // this._routeData = params.routeData;
            this._displayer = params.displayer;
            this._action = params.action;
            this.data = params.data
            this._name = params.name;

            this.loadPageAction(this.name);
        }
        private on_load() {
            return this.load.fire(this, this.data);
        }
        private on_loadComplete() {
            return this.loadComplete.fire(this, this.data);
        }
        private on_showing() {
            return this.showing.fire(this, this.data);
        }
        private on_shown() {
            return this.shown.fire(this, this.data);
        }
        private on_hiding() {
            return this.hiding.fire(this, this.data);
        }
        private on_hidden() {
            return this.hidden.fire(this, this.data);
        }
        private on_closing() {
            return this.closing.fire(this, this.data);
        }
        private on_closed() {
            return this.closed.fire(this, this.data);
        }
        public on_active(args: PageDataType) {
            console.assert(args != null, 'args is null')
            Object.assign(this.data, args);
            this.active.fire(this, args);
        }
        public on_deactive() {
            this.deactive.fire(this, this.data);
        }
        show(): Promise<any> {
            this.on_showing();
            return this._displayer.show(this).then(o => {
                this.on_shown();
            });
        }
        hide(): Promise<any> {
            this.on_hiding();
            return this._displayer.hide(this).then(o => {
                this.on_hidden();
            });
        }
        close(): Promise<any> {
            return this.hide().then(() => {
                this.on_closing();
                this._element.remove();
                this.on_closed();
            });
        }

        /**
         * 创建服务
         * @param type 服务类型
         */
        createService<T extends Service>(type: ServiceConstructor<T>): T {
            let service = new type();
            service.error.add((ender, error) => {
                this._app.throwError(error, this)
            })
            return service;
        }

        /**
         * 元素，与页面相对应的元素
         */
        get element(): HTMLElement {
            return this._element;
        }
        get previous(): Page {
            return this._previous;
        }
        set previous(value: Page) {
            this._previous = value;
        }

        /**
         * 名称
         */
        get name(): string {
            return this._name;
        }

        private async loadPageAction(pageName: string) {
            let action;
            if (typeof this._action == 'function') {
                action = this._action;
            }
            else {
                let actionResult;
                try {
                    actionResult = await loadjs(this._action);
                }
                catch (err) {
                    this._app.throwError(err, this)
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
                let actionResult = action(this) as Promise<any>;
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
        }

        reload() {
            return this.loadPageAction(this.name);
        }
    }


}


interface PageActionConstructor {
    new(page: chitu.Page);
}

interface PageConstructor {
    new(args: chitu.PageParams): chitu.Page
}

class PageDisplayerImplement implements chitu.PageDisplayer {
    show(page: chitu.Page) {
        page.element.style.display = 'block';
        if (page.previous != null) {
            page.previous.element.style.display = 'none';
        }
        return Promise.resolve();
    }
    hide(page: chitu.Page) {
        page.element.style.display = 'none';
        if (page.previous != null) {
            page.previous.element.style.display = 'block';
        }
        return Promise.resolve();
    }
}