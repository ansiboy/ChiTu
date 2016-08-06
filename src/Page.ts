namespace chitu {

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

    export type PageArguemnts = { container: PageContainer, routeData: RouteData, element: HTMLElement };
    export interface PageConstructor {
        new (args: PageArguemnts): Page;
    }


    export class Page extends Control {
        static animationTime: number = 300;

        //private _name: string;
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
        private _viewHtml: string;

        // Controls
        private _loading: Control;

        closing = Callbacks<Page, any>();
        closed = Callbacks<Page, any>();

        hiding = Callbacks<Page, any>();
        hidden = Callbacks<Page, any>();

        constructor(args: PageArguemnts) {
            super(args.element);
            if (args == null) throw Errors.argumentNull('args');

            $(this.element).data('page', this);

            this._pageContainer = args.container;
            this._routeData = args.routeData;

            this._pageContainer.closing.add(() => this.on_closing(this.routeData.values));
            this._pageContainer.closed.add(() => this.on_closed(this.routeData.values))
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
            for (var i = 0; i < this.children.length; i++) {
                let control = this.children[i];
                stack.push(control);
            }
            while (stack.length > 0) {
                let control = stack.pop();
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