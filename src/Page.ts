
namespace chitu {


    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;

    // function eventDeferred(callback: chitu.Callback, sender, args = {}): JQueryPromise<any> {
    //     return chitu.fireCallback(callback, [sender, args]);
    // };

    const PAGE_CLASS_NAME = 'page-node';
    const PAGE_HEADER_CLASS_NAME = 'page-header';
    const PAGE_BODY_CLASS_NAME = 'page-body';
    const PAGE_FOOTER_CLASS_NAME = 'page-footer';
    const PAGE_LOADING_CLASS_NAME = 'page-loading';
    const PAGE_CONTENT_CLASS_NAME = 'page-content';

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

    export class Page {// extends Control
        static animationTime: number = 300;
        //private _context: ControllerContext
        private _name: string;
        private _viewDeferred: JQueryPromise<string>;
        private _actionDeferred: JQueryPromise<Function>;

        private _loadViewModelResult = null;
        private _openResult: JQueryDeferred<any> = null;
        private _hideResult = null;

        private _showTime = Page.animationTime;
        private _hideTime = Page.animationTime;
        private _prevous: chitu.Page;

        private _routeData: PageInfo;
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

        preLoad = ns.Callbacks();
        load = ns.Callbacks();
        loadCompleted = ns.Callbacks();
        closing = ns.Callbacks();
        closed = ns.Callbacks();
        //scroll = ns.Callbacks();
        showing = ns.Callbacks();
        shown = ns.Callbacks();
        hiding = ns.Callbacks();
        hidden = ns.Callbacks();
        //scrollEnd = ns.Callbacks();
        viewChanged = ns.Callbacks();

        constructor(container: PageContainer, routeData: PageInfo, actionArguments: Array<any>,
            //action: JQueryPromise<Function>, view: JQueryPromise<string>,
            previous?: chitu.Page) {

            //super(container);
            if (!container) throw e.argumentNull('container');
            if (routeData == null) throw e.argumentNull('scrorouteDatallType');
            // if (action == null) throw e.argumentNull('action');
            // if (view == null) throw e.argumentNull('view');

            this._pageContainer = container;
            this._node = document.createElement('page');
            $(this._node).data('page', this);

            // this._actionDeferred = action;
            // this._viewDeferred = view;
            this._prevous = previous;
            this._routeData = routeData

            //this.action.done((type: Function) => {
                //action.execute(this, actionArguments);

                // if (this.view) {
                //     this.view.done((html) => {
           
                //     });
                // }
                
            //})
        }

        private createControls(element: HTMLElement): Control[] {
            //var control_parser = new ControlParser(this);
            this._controls = ControlFactory.createControls(element, this);//, this
            var stack = new Array<Control>();

            for (var i = 0; i < this._controls.length; i++) {
                stack.push(this._controls[i]);
            }
            return this._controls;
        }

        // get view(): JQueryPromise<string> {
        //     return this._viewDeferred;
        // }
        // set view(value: JQueryPromise<string>) {
        //     this._viewDeferred = value;
        // }
        // get action(): JQueryPromise<Function> {
        //     return this._actionDeferred;
        // }
        // set action(value: JQueryPromise<Function>) {
        //     this._actionDeferred = value;
        // }
        private get enableScrollLoad(): boolean {
            return this._enableScrollLoad;
        }
        private set enableScrollLoad(value: boolean) {
            this._enableScrollLoad = value;
        }
        public set viewHtml(value: string) {
            this._viewHtml = value;
            this._controls = this.createControls(this.element);
            this.on_viewChanged({});
        }
        public get viewHtml(): string {
            //return this.conatiner.nodes.content.innerHTML;
            return this._viewHtml;
        }
        // static getPageName(routeValue: { controller: string, action: string }): string {
        //     var name: string;
        //     name = routeValue.controller + '.' + routeValue.action;
        //     return name;
        // }
        get routeData(): PageInfo {
            return this._routeData;
        }
        get name(): string {
            if (!this._name)
                this._name = this.routeData.pageName; //Page.getPageName(this.routeData.values());

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

        private fireEvent(callback: chitu.Callback, args): JQueryPromise<any> {
            return chitu.fireCallback(callback, [this, args]);
        }
        on_load(args: Object) {
            var promises = new Array<JQueryPromise<any>>();
            promises.push(this.fireEvent(this.load, args));
            for (var i = 0; i < this._controls.length; i++) {
                var p = this._controls[i].on_load(args);
                //if (chitu.Utility.isDeferred(p))
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
        on_loadCompleted(args: Object) {
            var result = this.fireEvent(this.loadCompleted, args);
            //result.done(() => this.container.hideLoading());
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

        on_viewChanged(args) {
            return this.fireEvent(this.viewChanged, args);
        }

    }
};