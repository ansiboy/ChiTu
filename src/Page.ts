
namespace chitu {
    export interface PageActionConstructor {
        new (args: Page);
    }

    export interface PageConstructor {
        new (args: PageParams)
    }

    export interface PageDisplayer {
        show(page: Page);
        hide(page: Page);
    }

    export interface PageParams {
        app: Application,
        routeData: RouteData,
        element: HTMLElement,
        displayer: PageDisplayer,
        previous?: Page,
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

        static tagName = 'div';

        allowCache = false;

        load = Callbacks<Page, any>();

        showing = Callbacks<Page, {}>();
        shown = Callbacks<Page, {}>();

        hiding = Callbacks<Page, {}>();
        hidden = Callbacks<Page, {}>();

        closing = Callbacks<Page, {}>();
        closed = Callbacks<Page, {}>();

        constructor(params: PageParams) {
            this._element = params.element;
            this._previous = params.previous;
            this._app = params.app;
            this._routeData = params.routeData;
            this._displayer = params.displayer;
            this.loadPageAction(params.routeData);
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
        show(): void {
            this.on_showing();
            this._displayer.show(this);
            this.on_shown();
        }
        hide() {
            this.on_hiding();
            this._displayer.hide(this);
            this.on_hidden();
        }
        close() {
            this.hide();
            this.on_closing();
            this._element.remove();
            this.on_closed();
        }
        get element(): HTMLElement {
            return this._element;
        }
        get previous(): Page {
            return this._previous;
        }
        set previous(value:Page){
            this._previous = value;
        }
        get routeData(): RouteData {
            return this._routeData;
        }
        get name(): string {
            return this.routeData.pageName;
        }
        private createActionDeferred(routeData: RouteData): Promise<PageActionConstructor> {

            return new Promise((resolve, reject) => {
                var url = routeData.actionPath;
                requirejs([url], (obj: any) => {
                    //加载脚本失败
                    if (!obj) {
                        let msg = `Load action '${routeData.pageName}' fail.`;
                        let err = new Error(msg);
                        reject(err);
                        return;
                    }

                    resolve(obj);
                },

                    (err) => reject(err)
                );

            });
        }

        private loadPageAction(routeData: RouteData) {
            var action_deferred = new Promise((reslove, reject) => {
                this.createActionDeferred(routeData).then((actionResult) => {
                    if (!actionResult)
                        throw Errors.exportsCanntNull(routeData.pageName);

                    let actionName = 'default';
                    let action = actionResult[actionName];
                    if (action == null) {
                        throw Errors.canntFindAction(routeData.pageName);
                    }

                    if (typeof action == 'function') {
                        if (action['prototype'] != null)
                            new action(this);
                        else
                            action(this);

                        reslove();
                    }
                    else {
                        reject();
                        throw Errors.actionTypeError(routeData.pageName);
                    }
                }).catch((err) => {
                    reject(err);
                });
            });

            let resourcePaths = routeData.resources.map(o => o.path);
            let resourceNames = routeData.resources.map(o => o.name);
            let result = Promise.all([action_deferred, loadjs(...resourcePaths || [])]).then((data) => {
                let resourceResults = data[1];
                let args = {};
                for (let i = 0; i < resourceResults.length; i++) {
                    let name = resourceNames[i];
                    args[name] = resourceResults[i];
                }
                this.on_load(args);
            });

            return result;
        }
    }

    export class PageDisplayerImplement implements PageDisplayer {
        show(page: Page) {
            page.element.style.display = 'block';
            if (page.previous != null) {
                page.previous.element.style.display = 'none';
            }
        }
        hide(page: Page) {
            page.element.style.display = 'none';
            if (page.previous != null) {
                page.previous.element.style.display = 'block';
            }
        }
    }
}