

namespace chitu {

    export interface PageDisplayConstructor {
        new(app: Application): PageDisplayer
    }

    export interface PageDisplayer {
        show(page: Page): Promise<any>;
        hide(page: Page): Promise<any>;
    }

    export interface PageParams {
        app: Application,
        routeData: RouteData,
        element: HTMLElement,
        displayer: PageDisplayer,
        previous?: Page,
        actionArguments: any
    }

    export class Page {
        private animationTime: number = 300;
        private num: Number;

        private _element: HTMLElement;
        private _previous: Page;
        private _app: Application;
        private _routeData: RouteData;
        //private _name: string;
        private _displayer: PageDisplayer;
        private _actionArguments: any;

        static tagName = 'div';

        error = Callbacks<Page, Error>();

        // allowCache = false;

        load = Callbacks<this, null>();
        loadComplete = Callbacks<this, null>();

        showing = Callbacks<this, null>();
        shown = Callbacks<this, {}>();

        hiding = Callbacks<this, {}>();
        hidden = Callbacks<this, {}>();

        closing = Callbacks<this, {}>();
        closed = Callbacks<this, {}>();

        constructor(params: PageParams) {
            this._element = params.element;
            this._previous = params.previous;
            this._app = params.app;
            this._routeData = params.routeData;
            this._displayer = params.displayer;
            this._actionArguments = params.actionArguments;
            this.loadPageAction();
        }
        on_load(args: any) {
            return fireCallback(this.load, this, args);
        }
        on_showing() {
            return fireCallback(this.showing, this, {});
        }
        on_shown() {
            return fireCallback(this.shown, this, {});
        }
        on_hiding() {
            return fireCallback(this.hiding, this, {});
        }
        on_hidden() {
            return fireCallback(this.hidden, this, {});
        }
        on_closing() {
            return fireCallback(this.closing, this, {});
        }
        on_closed() {
            return fireCallback(this.closed, this, {});
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

        createService<T>(type: ServiceConstructor): Service {
            let service = new type(this);
            service.error.add((ender, error) => {
                this.error.fire(this, error);
            })
            return service;
        }
        get element(): HTMLElement {
            return this._element;
        }
        get previous(): Page {
            return this._previous;
        }
        set previous(value: Page) {
            this._previous = value;
        }
        get routeData(): RouteData {
            return this._routeData;
        }
        get name(): string {
            return this.routeData.pageName;
        }

        private async loadPageAction() {
            console.assert(this._routeData != null);

            let routeData = this._routeData;
            var url = routeData.actionPath;
            let actionResult = await loadjs(url);
            if (!actionResult)
                throw Errors.exportsCanntNull(routeData.pageName);

            let actionName = 'default';
            let action = actionResult[actionName];
            if (action == null) {
                throw Errors.canntFindAction(routeData.pageName);
            }

            if (typeof action == 'function') {
                if (action['prototype'] != null)
                    throw Errors.actionTypeError(routeData.pageName);

                let actionResult = action(this) as Promise<any>;
                if (actionResult.then != null && actionResult.catch != null) {
                    actionResult.then(() => this.loadComplete.fire(this, null));
                }
            }
            else {
                throw Errors.actionTypeError(routeData.pageName);
            }

            let args = {};
            this.on_load(args);
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