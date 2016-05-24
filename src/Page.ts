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

    export interface PageConstructor {
        new (): Page;
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
        private _prevous: chitu.Page;

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
        //loadCompleted = ns.Callbacks();
        closing = ns.Callbacks<Page, any>();
        closed = ns.Callbacks();
        showing = ns.Callbacks();
        shown = ns.Callbacks();
        hiding = ns.Callbacks();
        hidden = ns.Callbacks();
        //viewChanged = ns.Callbacks();

        constructor() {
        }

        public initialize(container: PageContainer, pageInfo: RouteData, html: string, previous?: chitu.Page) {
            if (!container) throw e.argumentNull('container');
            if (pageInfo == null) throw e.argumentNull('pageInfo');

            this._pageContainer = container;
            this._node = document.createElement('page');
            this._node.innerHTML = html;
            $(this._node).data('page', this);

            this._prevous = previous;
            this._routeData = pageInfo

            this._controls = this.createControls(this.element);
        }

        private createControls(element: HTMLElement): Control[] {
            this._controls = ControlFactory.createControls(element, this);
            var stack = new Array<Control>();

            for (var i = 0; i < this._controls.length; i++) {
                stack.push(this._controls[i]);
            }
            return this._controls;
        }

        // public set view(value: string) {
        //     this._viewHtml = value;
        //     this.on_viewChanged({});
        // }
        // public get view(): string {
        //     return this._viewHtml;
        // }
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
        get previous(): chitu.Page {
            return this._prevous;
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

        private fireEvent<S, A>(callback: chitu.Callback<S, A>, args): JQueryPromise<any> {
            return chitu.fireCallback(callback, [this, args]);
        }
        on_load(args: Object): JQueryPromise<any> {
            var promises = new Array<JQueryPromise<any>>();
            promises.push(this.fireEvent(this.load, args));
            for (var i = 0; i < this._controls.length; i++) {
                var p = this._controls[i].on_load(args);
                promises.push(p);
            }
            var result = $.when.apply($, promises);
            //===============================================================
            // 必须是 view 加载完成，并且 on_load 完成后，才触发 on_loadCompleted 事件
            // if (this.view == null) {
            //     result.done(() => this.on_loadCompleted(args));
            // }
            // else {
            //     if (this.view.state() == 'resolved') {
            //         result.done(() => this.on_loadCompleted(args));
            //     }
            //     else {
            //         $.when(this.view, result).done(() => this.on_loadCompleted(args));
            //     }
            // }
            //===============================================================

            return result;
        }
        // on_loadCompleted(args: Object) {
        //     var result = this.fireEvent(this.loadCompleted, args);
        // }
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

        // on_viewChanged(args) {
        //     return this.fireEvent(this.viewChanged, args);
        // }

    }
};