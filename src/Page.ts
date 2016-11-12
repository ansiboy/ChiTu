
namespace chitu {
    export interface PageActionConstructor {
        new (args: Page);
    }

    export interface PageDisplayer {
        show(page: Page);
        hide(page: Page);
        //visible(page: Page): boolean;
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

        load = Callbacks<Page, any>();

        showing = Callbacks<Page, any>();
        shown = Callbacks<Page, any>();

        hiding = Callbacks<Page, any>();
        hidden = Callbacks<Page, any>();

        closing = Callbacks<Page, any>();
        closed = Callbacks<Page, any>();

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
        on_load(args) {
            return fireCallback(this.load, this, args);
        }
        on_showing(args) {
            return fireCallback(this.showing, this, args);
        }
        on_shown(args) {
            return fireCallback(this.shown, this, args);
        }
        on_hiding(args) {
            return fireCallback(this.hiding, this, args);
        }
        on_hidden(args) {
            return fireCallback(this.hidden, this, args);
        }
        on_closing(args) {
            return fireCallback(this.closing, this, args);
        }
        on_closed(args) {
            return fireCallback(this.closed, this, args);
        }
        show(): void {
            // if (this.visible == true)
            //     return;

            this.on_showing(this.routeData.values);
            this._displayer.show(this);
            this.on_shown(this.routeData.values);
        }
        hide() {
            // if (this._displayer.visible(this))
            //     return;

            this.on_hiding(this.routeData.values);
            this._displayer.hide(this);
            this.on_hidden(this.routeData.values);
        }
        close() {
            this.hide();
            this.on_closing(this.routeData.values);
            this._element.remove();
            this.on_closed(this.routeData.values);
        }
        // get visible() {
        //     return this._displayer.visible(this);
        // }
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
            var action_deferred = this.createActionDeferred(routeData);
            return action_deferred
                .then((obj) => {
                    let actionName = routeData.actionName || 'default';
                    let action = obj[actionName];
                    if (action == null) {
                        throw Errors.canntFindAction(routeData.actionName, routeData.pageName);
                    }

                    if (typeof action == 'function') {
                        if (action['prototype'] != null)
                            new action(this);
                        else
                            action(this);
                    }
                    else {
                        throw Errors.actionTypeError(routeData.actionName, routeData.pageName);
                    }


                    let q: Promise<any> = Promise.resolve();// = $.Deferred();
                    if (routeData.resource != null && routeData.resource.length > 0) {
                        q = Utility.loadjs.apply(Utility, routeData.resource);
                    }

                    q.then(() => {
                        this.on_load(routeData.values);
                    });

                })
                .catch((err) => {
                    //result.reject();
                    console.error(err);
                    throw Errors.createPageFail(routeData.pageName);
                });
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

    export class PageFactory {
        private _app: Application;
        constructor(app: Application) {
            this._app = app;
        }
        static createInstance(params: {
            app: Application,
            routeData: RouteData,
            previous?: Page,
        }): Page {

            params = params || <{ app: Application, routeData: RouteData, }>{}
            if (params.app == null) throw Errors.argumentNull('app');
            if (params.routeData == null) throw Errors.argumentNull('routeData');

            let displayer = new PageDisplayerImplement();
            let element: HTMLElement = document.createElement('page');
            element.setAttribute('name', params.routeData.pageName);
            let c = new Page({
                app: params.app,
                previous: params.previous,
                routeData: params.routeData,
                displayer,
                element
            });

            document.body.appendChild(element);

            return c;
        }
    }
}