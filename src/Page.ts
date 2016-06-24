namespace chitu {

    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;

    var LOAD_COMPLETE_HTML = '<span style="padding-left:10px;">数据已全部加载完毕</span>';

    export enum PageLoadType {
        init,
        scroll,
        pullDown,
        pullUp,
        custom
    }

    export interface PageLoading {
        show()
        hide()
    }

    enum ShowTypes {
        swipeLeft,
        swipeRight,
        none
    }

    enum PageNodeParts {
        header = 1,
        body = 2,
        loading = 4,
        footer = 8
    }

    enum PageStatus {
        open,
        closed
    }

    export enum SwipeDirection {
        None,
        Left,
        Right,
        Up,
        Down,
    }

    export enum ScrollType {
        IScroll,
        Div,
        Document,
    }

    export  type PageArguemnts = { container: PageContainer, routeData: RouteData, view: string };
    export interface PageConstructor {
        new (args: PageArguemnts): Page;
    }


    export class Page {
        static animationTime: number = 300;

        private _name: string;
        private _viewDeferred: JQueryPromise<string>;
        private _actionDeferred: JQueryPromise<Function>;

        private _loadViewModelResult = null;
        private _openResult: JQueryDeferred<any> = null;
        private _hideResult = null;

        private _showTime = Page.animationTime;
        private _hideTime = Page.animationTime;
        //private _prevous: chitu.Page;

        private _routeData: RouteData;
        private _enableScrollLoad = false;
        private is_closed = false;
        private _scrollLoad_loading_bar: HTMLElement;

        private isActionExecuted = false;

        private _formLoading: PageLoading;
        private _bottomLoading: PageLoading;
        private _pageContainer: PageContainer;
        private _node: HTMLElement;
        private _viewHtml: string;

        // Controls
        private _loading: Control;
        private _controls: Array<Control>;

        preLoad = ns.Callbacks<Page, any>();
        load = ns.Callbacks<Page, any>();

        closing = ns.Callbacks<Page, any>();
        closed = ns.Callbacks<Page, any>();
        showing = ns.Callbacks<Page, any>();
        shown = ns.Callbacks<Page, any>();
        hiding = ns.Callbacks<Page, any>();
        hidden = ns.Callbacks<Page, any>();

        constructor(args: PageArguemnts) {
            if(args == null) throw Errors.argumentNull('args');
            if (args.view == null) throw Errors.argumentNull('view');

            this._node = document.createElement('page');
            this._node.innerHTML = args.view;
            this._controls = this.createControls(this.element);
            $(this._node).data('page', this);

            this.initialize(args.container,args.routeData);
        }

        private initialize(container: PageContainer, pageInfo: RouteData) {
            if (!container) throw e.argumentNull('container');
            if (pageInfo == null) throw e.argumentNull('pageInfo');

            this._pageContainer = container;
            this._routeData = pageInfo;
        }

        private createControls(element: HTMLElement): Control[] {
            this._controls = ControlFactory.createControls(element, this);
            var stack = new Array<Control>();

            for (var i = 0; i < this._controls.length; i++) {
                stack.push(this._controls[i]);
            }
            return this._controls;
        }
        get routeData(): RouteData {
            return this._routeData;
        }
        get name(): string {
            if (!this._name)
                this._name = this.routeData.pageName;

            return this._name;
        }
        get element(): HTMLElement {
            return this._node;
        }
        get visible(): boolean {
            return $(this._node).is(':visible');
        }
        get container(): PageContainer {
            return this._pageContainer;
        }
        hide(swipe?: SwipeDirection): JQueryPromise<any> {
            swipe = swipe || SwipeDirection.None;
            return this.container.hide(swipe);
        }
        findControl<T extends Control>(name: string): T {
            if (!name) throw Errors.argumentNull('name');

            var stack = new Array<Control>();
            for (var i = 0; i < this._controls.length; i++) {
                var control = this._controls[i];
                stack.push(control);
            }
            while (stack.length > 0) {
                var control = stack.pop();
                if (control.name == name)
                    return <T>control;

                for (var i = 0; i < control.children.length; i++)
                    stack.push(control.children[i]);
            }
            return null;
        }

        private fireEvent<A>(callback: chitu.Callback<Page, A>, args): JQueryPromise<any> {
            return fireCallback(callback, this, args);
        }

        on_load(args: Object): JQueryPromise<any> {
            var promises = new Array<JQueryPromise<any>>();
            promises.push(this.fireEvent(this.load, args));
            for (var i = 0; i < this._controls.length; i++) {
                var p = this._controls[i].on_load(args);
                promises.push(p);
            }
            var result = $.when.apply($, promises);
            return result;
        }
        on_closing(args) {
            return this.fireEvent(this.closing, args);
        }
        on_closed(args) {
            return this.fireEvent(this.closed, args);
        }

        on_showing(args) {
            return this.fireEvent(this.showing, args);
        }
        on_shown(args) {
            return this.fireEvent(this.shown, args);
        }
        on_hiding(args) {
            return this.fireEvent(this.hiding, args);
        }
        on_hidden(args) {
            return this.fireEvent(this.hidden, args);
        }
    }
};