namespace chitu {

    export type PageData = { [key: string]: any }

    export interface PageDisplayConstructor {
        new(app: Application<any>): PageDisplayer
    }

    export interface PageDisplayer {
        show(targetPage: Page, currentPage: chitu.Page): Promise<any>;
        hide(targetPage: Page, currentPage: chitu.Page): Promise<any>;
    }

    export interface PageParams {
        app: Application<any>,
        action: Action,
        element: HTMLElement,
        displayer: PageDisplayer,
        // previous?: Page,
        name: string,
        data: PageData,
    }

    /**
     * 页面，用把 HTML Element 包装起来。
     */
    export class Page {
        private animationTime: number = 300;
        private num: Number;

        private _element: HTMLElement;
        // private _previous: Page;
        private _app: Application<any>;
        // private _routeData: RouteData;
        private _displayer: PageDisplayer;
        private _action: Action;
        private _name: string

        static tagName = 'div';

        // error = Callbacks<Page, Error>();
        data: PageData = null

        /** 脚本文件加载完成后引发 */
        load = Callbacks<this, PageData>();

        /** 脚本执行完成后引发 */
        loadComplete = Callbacks<this, PageData>();

        /** 页面显示时引发 */
        showing = Callbacks<this, PageData>();

        /** 页面显示时完成后引发 */
        shown = Callbacks<this, PageData>();

        hiding = Callbacks<this, PageData>();
        hidden = Callbacks<this, PageData>();

        closing = Callbacks<this, PageData>();
        closed = Callbacks<this, PageData>();

        active = Callbacks<this, PageData>();
        deactive = Callbacks<this, PageData>();

        constructor(params: PageParams) {
            this._element = params.element;
            // this._previous = params.previous;
            this._app = params.app;
            this._displayer = params.displayer;
            this._action = params.action;
            this.data = params.data
            this._name = params.name;
            setTimeout(() => {
                this.loadPageAction();
            });
        }
        on_load() {
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
        public on_active(args: PageData) {
            console.assert(args != null, 'args is null')
            Object.assign(this.data, args);
            this.active.fire(this, args);
        }
        public on_deactive() {
            this.deactive.fire(this, this.data);
        }
        show(currentPage: chitu.Page): Promise<any> {
            this.on_showing();
            return this._displayer.show(this, currentPage).then(o => {
                this.on_shown();
            });
        }
        hide(currentPage: chitu.Page): Promise<any> {
            this.on_hiding();
            return this._displayer.hide(this, currentPage).then(o => {
                this.on_hidden();
            });
        }
        close(): Promise<any> {
            return new Promise((resolve, reject) => {
                this.on_closing();
                this._element.remove();
                this.on_closed();
                resolve();
            })
        }

        /**
         * 创建服务
         * @param type 服务类型
         */
        createService<T extends Service>(type?: ServiceConstructor<T>): T {
            type = type || chitu.Service as any
            let service = new type();
            service.error.add((ender, error) => {
                this._app.error.fire(this._app, error, this)
            })
            return service;
        }

        /**
         * 元素，与页面相对应的元素
         */
        get element(): HTMLElement {
            return this._element;
        }
        // get previous(): Page {
        //     return this._previous;
        // }
        // set previous(value: Page) {
        //     this._previous = value;
        // }

        /**
         * 名称
         */
        get name(): string {
            return this._name;
        }

        private async loadPageAction() {
            let pageName: string = this.name;
            let action;
            // if (typeof this._action == 'function') {
            action = this._action;
            // }
            // else {
            //     let actionResult;
            //     actionResult = await this._app.loadjs(this._action);


            //     if (!actionResult)
            //         throw Errors.exportsCanntNull(pageName);

            //     let actionName = 'default';
            //     action = actionResult[actionName];
            //     if (action == null) {
            //         throw Errors.canntFindAction(pageName);
            //     }
            // }

            // this.on_load();
            let actionExecuteResult;
            if (typeof action != 'function') {
                throw Errors.actionTypeError(pageName);
            }

            let actionResult = await action(this) as Promise<any>;
            // if (actionResult != null && actionResult.then != null && actionResult.catch != null) {
            //     actionResult.then(() => this.on_loadComplete());
            // }
            // else {
            //     this.on_loadComplete();
            // }
            this.on_loadComplete();
        }

        reload() {
            return this.loadPageAction();
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
    show(page: chitu.Page, previous: chitu.Page) {
        page.element.style.display = 'block';
        if (previous != null) {
            previous.element.style.display = 'none';
        }
        return Promise.resolve();
    }
    hide(page: chitu.Page, previous: chitu.Page) {
        page.element.style.display = 'none';
        if (previous != null) {
            previous.element.style.display = 'block';
        }
        return Promise.resolve();
    }
}