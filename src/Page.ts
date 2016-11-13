
namespace chitu {
    export interface PageActionConstructor {
        new (args: Page);
    }

    export interface PageDisplayer {
        show(page: Page);
        hide(page: Page);
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

        load = Callbacks<Page>();

        showing = Callbacks<Page>();
        shown = Callbacks<Page>();

        hiding = Callbacks<Page>();
        hidden = Callbacks<Page>();

        closing = Callbacks<Page>();
        closed = Callbacks<Page>();

        constructor(params: {
            app: Application,
            routeData: RouteData,
            element: HTMLElement,
            displayer: PageDisplayer,
            previous?: Page,
        }) {

            this._element = params.element;
            this._previous = params.previous;
            this._app = params.app;
            this._routeData = params.routeData;
            this._displayer = params.displayer;
            this.loadPageAction(params.routeData);
        }
        on_load(...resources: Array<any>) {
            return fireCallback(this.load, this, resources);
        }
        on_showing() {
            return fireCallback(this.showing, this);
        }
        on_shown() {
            return fireCallback(this.shown, this);
        }
        on_hiding() {
            return fireCallback(this.hiding, this);
        }
        on_hidden() {
            return fireCallback(this.hidden, this);
        }
        on_closing() {
            return fireCallback(this.closing, this);
        }
        on_closed() {
            return fireCallback(this.closed, this);
        }
        show(): void {
            // if (this.visible == true)
            //     return;

            this.on_showing();
            this._displayer.show(this);
            this.on_shown();
        }
        hide() {
            // if (this._displayer.visible(this))
            //     return;

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
                        console.warn(chitu.Utility.format('加载活动“{0}”失败。', routeData.pageName));
                        reject();
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
                    let actionName = routeData.actionName || 'default';
                    let action = actionResult[actionName];
                    if (action == null) {
                        throw Errors.canntFindAction(routeData.actionName, routeData.pageName);
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
                        throw Errors.actionTypeError(routeData.actionName, routeData.pageName);
                    }
                });
            });

            let result = Promise.all([action_deferred, loadjs(...routeData.resource || [])]).then((results) => {
                let resourceResults = results[1];
                this.on_load(...resourceResults);
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
        // visible(page: Page) {
        //     return page.element.style.display == 'block' || !page.element.style.display;
        // }
    }

    // export class PageFactory {
    //     private _app: Application;
    //     constructor(app: Application) {
    //         this._app = app;
    //     }
    //     static createInstance(params: {
    //         app: Application,
    //         routeData: RouteData,
    //         previous?: Page,
    //     }): Page {

    //         params = params || <{ app: Application, routeData: RouteData, }>{}
    //         if (params.app == null) throw Errors.argumentNull('app');
    //         if (params.routeData == null) throw Errors.argumentNull('routeData');

    //         let displayer = new PageDisplayerImplement();
    //         let element: HTMLElement = document.createElement('page');
    //         element.setAttribute('name', params.routeData.pageName);
    //         let c = new Page({
    //             app: params.app,
    //             previous: params.previous,
    //             routeData: params.routeData,
    //             displayer,
    //             element
    //         });

    //         document.body.appendChild(element);

    //         return c;
    //     }
    // }
}