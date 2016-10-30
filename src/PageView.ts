namespace chitu {

    // var u = chitu.Utility;
    // var e = chitu.Errors;

    //var LOAD_COMPLETE_HTML = '<span style="padding-left:10px;">数据已全部加载完毕</span>';

    // export enum PageLoadType {
    //     init,
    //     scroll,
    //     pullDown,
    //     pullUp,
    //     custom
    // }

    // export interface PageLoading {
    //     show()
    //     hide()
    // }

    // enum ShowTypes {
    //     swipeLeft,
    //     swipeRight,
    //     none
    // }

    // enum PageNodeParts {
    //     header = 1,
    //     body = 2,
    //     loading = 4,
    //     footer = 8
    // }

    // enum PageStatus {
    //     open,
    //     closed
    // }

    // export enum SwipeDirection {
    //     None,
    //     Left,
    //     Right,
    //     Up,
    //     Down,
    // }

    // export enum ScrollType {
    //     IScroll,
    //     Div,
    //     Document,
    // }

    export type PageArguemnts = { container: Page, routeData: RouteData, element: HTMLElement };
    export interface PageConstructor {
        new (args: PageArguemnts): Pageview;
    }


    export class Pageview {

        private _name: string;
        // private _viewDeferred: JQueryPromise<string>;
        // private _actionDeferred: JQueryPromise<Function>;

        //private _loadViewModelResult = null;
        private _openResult: JQueryDeferred<any> = null;
        private _hideResult = null;

        private _routeData: RouteData;
        //private _enableScrollLoad = false;
        private is_closed = false;
        //private _scrollLoad_loading_bar: HTMLElement;

        //private isActionExecuted = false;

        // private _formLoading: PageLoading;
        // private _bottomLoading: PageLoading;
        private _pageContainer: Page;
        private _viewHtml: string;
        private _element: HTMLElement;
        //private _loading: Control;

        load = chitu.Callbacks<Pageview, any>();

        closing = Callbacks<Pageview, any>();
        closed = Callbacks<Pageview, any>();

        hiding = Callbacks<Pageview, any>();
        hidden = Callbacks<Pageview, any>();

        constructor(args: PageArguemnts) {

            if (args == null) throw Errors.argumentNull('args');

            this._element = args.element;
            this._pageContainer = args.container;
            this._routeData = args.routeData;

            $(this.element).data('page', this);

            this._pageContainer.closing.add(() => this.on_closing(this.routeData.values));
            this._pageContainer.closed.add(() => this.on_closed(this.routeData.values))
        }

        get element(): HTMLElement {
            return this._element;
        }

        get routeData(): RouteData {
            return this._routeData;
        }
        get name(): string {
            if (!this._name)
                this._name = this.routeData.pageName;

            return this._name;
        }
        get visible(): boolean {
            return $(this.element).is(':visible');
        }
        get container(): Page {
            return this._pageContainer;
        }
        hide() {
            return this.container.hide();
        }

        on_load(args: Object): JQueryPromise<any> {
            return this.fireEvent(this.load,args);
        }

        private fireEvent<A>(callback: chitu.Callback<Pageview, A>, args): JQueryPromise<any> {
            return fireCallback(callback, this, args);
        }

        on_closing(args) {
            return this.fireEvent(this.closing, args);
        }
        on_closed(args) {
            return this.fireEvent(this.closed, args);
        }

        on_hiding(args) {
            return this.fireEvent(this.hiding, args);
        }
        on_hidden(args) {
            return this.fireEvent(this.hidden, args);
        }
    }
};