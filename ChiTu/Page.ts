
namespace chitu {


    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;

    function eventDeferred(callback, sender, args = {}): JQueryDeferred<any> {
        return chitu.fireCallback(callback, [sender, args]);
    };

    const PAGE_CLASS_NAME = 'page-node';
    const PAGE_HEADER_CLASS_NAME = 'page-header';
    const PAGE_BODY_CLASS_NAME = 'page-body';
    const PAGE_FOOTER_CLASS_NAME = 'page-footer';
    const PAGE_LOADING_CLASS_NAME = 'page-loading';
    const PAGE_CONTENT_CLASS_NAME = 'page-content';
    //var zindex: number;

    var LOAD_MORE_HTML = '<span>上拉加载更多数据</span>';
    var LOADDING_HTML = '<i class="icon-spinner icon-spin"></i><span style="padding-left:10px;">数据正在加载中...</span>';
    var LOAD_COMPLETE_HTML = '<span style="padding-left:10px;"></span>';//数据已全部加载完毕

    export enum PageLoadType {
        open,
        scroll,
        pullDown,
        pullUp,
        custom
    }

    export interface PageLoadArguments {
        //loadCompleted: (value: boolean) => void,
        loadType: PageLoadType,
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
        Donw,
    }

    export enum ScrollType {
        IScroll,
        Div,
        Document,
    }

    class PageNodes {
        container: HTMLElement
        header: HTMLElement
        body: HTMLElement
        footer: HTMLElement
        loading: HTMLElement
        content: HTMLElement

        constructor(node: HTMLElement) {
            node.className = PAGE_CLASS_NAME;
            this.container = node;

            this.header = document.createElement('div');
            this.header.className = PAGE_HEADER_CLASS_NAME;
            //this.headerNode.style.display = 'none';
            node.appendChild(this.header);

            this.body = document.createElement('div');
            this.body.className = PAGE_BODY_CLASS_NAME;
            //$(this.body).hide();
            node.appendChild(this.body);

            this.content = document.createElement('div');
            this.content.className = PAGE_CONTENT_CLASS_NAME;
            $(this.content).hide();
            this.body.appendChild(this.content);

            this.loading = document.createElement('div');
            this.loading.className = PAGE_LOADING_CLASS_NAME;
            this.loading.innerHTML = '<div class="spin"><i class="icon-spinner icon-spin"></i><div>';
            //$(this.loading).hide();
            this.body.appendChild(this.loading);

            this.footer = document.createElement('div');
            this.footer.className = PAGE_FOOTER_CLASS_NAME;
            //this.footerNode.style.display = 'none';
            node.appendChild(this.footer);
        }
    }


    export class Page {
        static animationTime: number = 300
        //private _context: ControllerContext
        private _name: string
        private _viewDeferred: JQueryPromise<string>
        private _actionDeferred: JQueryPromise<Action>

        private _loadViewModelResult = null
        private _openResult: JQueryDeferred<any> = null
        private _hideResult = null;
        private _pageNode: PageNodes;
        private _showTime = Page.animationTime;
        private _hideTime = Page.animationTime
        private _prevous: chitu.Page;
        private ios_scroller: IOSScroll;
        private _routeData: chitu.RouteData;
        private _enableScrollLoad = false;
        private is_closed = false;
        private scrollLoad_loading_bar: HTMLElement;

        preLoad = ns.Callbacks();
        load = ns.Callbacks();
        //loadCompleted = ns.Callbacks();
        closing = ns.Callbacks();
        closed = ns.Callbacks();
        scroll = ns.Callbacks();
        showing = ns.Callbacks();
        shown = ns.Callbacks();
        hiding = ns.Callbacks();
        hidden = ns.Callbacks();
        scrollEnd = ns.Callbacks();
        viewChanged = $.Callbacks();

        //scrollLoadData: (sender: chitu.Page, args: PageLoadArguments) => JQueryPromise<any>;

        constructor(element: HTMLElement, scrollType: ScrollType, parent?: chitu.Page) {
            //if (!context) throw e.argumentNull('context');
            if (!element) throw e.argumentNull('element');
            if (scrollType == null) throw e.argumentNull('scrollType');

            this._prevous = parent;
            this._pageNode = new PageNodes(element);

            if (scrollType == ScrollType.IScroll) {
                $(this.nodes().container).addClass('ios');
                this.ios_scroller = new IOSScroll(this);
            }
            else if (scrollType == ScrollType.Div) {
                $(this.nodes().container).addClass('div');
                new DisScroll(this);
            }
            else if (scrollType == ScrollType.Document) {
                $(this.nodes().container).addClass('doc');
                new DocumentScroll(this);
            }

            this.scrollEnd.add(Page.page_scrollEnd);
            if (parent)
                parent.closing.add(() => this.close());
        }

        //init(routeData: RouteData) {
        //    var controllerName = routeData.values().controller;
        //    var actionName = routeData.values().action;
        //    //this._name = Page.getPageName(routeData);



        //    var args: PageLoadArguments = routeData.values();
        //    args.loadType = PageLoadType.start;
        //    args.loadCompleted = Page.createLoadCompletedFunc(this); //(value) => this._isLoadAllData = value;

        //    //this.on_load(args);
        //}

        get viewDeferred(): JQueryPromise<string> {
            return this._viewDeferred;
        }
        set viewDeferred(value: JQueryPromise<string>) {
            this._viewDeferred = value;
        }
        get actionDeferred(): JQueryPromise<Action> {
            return this._actionDeferred;
        }
        set actionDeferred(value: JQueryPromise<Action>) {
            this._actionDeferred = value;
        }
        get enableScrollLoad(): boolean {
            return this._enableScrollLoad;
        }
        set enableScrollLoad(value: boolean) {
            this._enableScrollLoad = value;

            if (this.scrollLoad_loading_bar == null) {
                this.scrollLoad_loading_bar = document.createElement('div');
                this.scrollLoad_loading_bar.innerHTML = '<div name="scrollLoad_loading" style="padding:10px 0px 10px 0px;"><h5 class="text-center"></h5></div>';
                this.scrollLoad_loading_bar.style.display = 'none';
                $(this.scrollLoad_loading_bar).find('h5').html(LOADDING_HTML);
                this.nodes().content.appendChild(this.scrollLoad_loading_bar);
            }

            if (!value && this.scrollLoad_loading_bar != null) {
                $(this.scrollLoad_loading_bar).hide();
                this.refreshUI();
            }
        }
        set view(value: string) {
            this.nodes().content.innerHTML = value;

            var q = this.nodes().content.querySelector('[ch-part="header"]');
            if (q) this.nodes().header.appendChild(q);

            q = this.nodes().content.querySelector('[ch-part="footer"]');
            if (q) this.nodes().footer.appendChild(q);

            this.viewChanged.fire();
        }
        get view(): string {
            return this.nodes().container.innerHTML;
        }
        static getPageName(routeData: RouteData): string {
            var name: string;
            if (routeData.pageName()) {
                var route = window['crossroads'].addRoute(routeData.pageName());
                name = route.interpolate(routeData.values());
            }
            else {
                name = routeData.values().controller + '.' + routeData.values().action;
            }
            return name;
        }
        get routeData(): chitu.RouteData {
            return this._routeData;
        }
        set routeData(value: chitu.RouteData) {
            this._routeData = value;
        }
        get name(): string {
            if (!this._name)
                this._name = Page.getPageName(this.routeData);

            return this._name;
        }
        node(): HTMLElement {
            /// <returns type="HTMLElement"/>
            return this._pageNode.container;
        }
        nodes(): PageNodes {
            return this._pageNode;
        }
        get parent(): chitu.Page {
            return this._prevous;
        }
        hide(swipe?: SwipeDirection) {
            if (!$(this.node()).is(':visible'))
                return;

            swipe = swipe || SwipeDirection.None;
            this.hidePageNode(swipe);
        }
        show(swipe?: SwipeDirection) {
            if ($(this.node()).is(':visible'))
                return;

            swipe = swipe || SwipeDirection.None;
            this.showPageNode(swipe);
        }
        visible() {
            return $(this.node()).is(':visible');
        }
        private hidePageNode(swipe: SwipeDirection): JQueryDeferred<any> {
            this.on_hiding({});

            if (!window['move']) {
                swipe = SwipeDirection.None;
                console.warn('Move is not loaded and swipe is auto disabled.');
            }

            var result = $.Deferred();
            var container_width = $(this.nodes().container).width();
            var container_height = $(this.nodes().container).height();

            var on_end = () => {
                $(this.node()).hide();
                result.resolve();
                this.on_hidden({});
            };

            switch (swipe) {
                case SwipeDirection.None:
                default:
                    on_end();
                    break;
                case SwipeDirection.Up:
                    move(this.nodes().container).y(container_height).end()
                        .y(0 - container_height).duration(this._hideTime).end(on_end);
                    break;
                case SwipeDirection.Donw:
                    move(this.nodes().container).y(container_height).duration(this._hideTime).end(on_end);
                    break;
                case SwipeDirection.Right:
                    move(this.node())
                        .x(container_width)
                        .duration(this._hideTime)
                        .end(on_end);
                    break;
                case SwipeDirection.Left:
                    move(this.node())
                        .x(0 - container_width)
                        .duration(this._hideTime)
                        .end(on_end);
                    break;
            }

            return result;
        }
        private showPageNode(swipe: SwipeDirection): JQueryPromise<any> {
            if (!window['move']) {
                swipe = SwipeDirection.None;
                console.warn('Move is not loaded and swipe is auto disabled.');
            }

            this.on_showing({});
            var result = $.Deferred();

            this.node().style.display = 'block';
            //if ($(this.nodes().loading).is(':visible'))
            //    $(this.nodes().loading).hide();

            var container_width = $(this.nodes().container).width();
            var container_height = $(this.nodes().container).height();
            var on_end = () => {
                result.resolve();
            };

            switch (swipe) {
                case SwipeDirection.None:
                default:
                    on_end();
                    break;
                case SwipeDirection.Donw:
                    move(this.node()).y(0 - container_height).duration(0).end(on_end);
                    move(this.node()).y(0).duration(0).end(on_end);
                    break;
                case SwipeDirection.Up:
                    move(this.node()).y(container_height).duration(0).end();
                    move(this.node()).y(0).duration(this._showTime).end(on_end);
                    break;
                case SwipeDirection.Right:
                    move(this.node()).x(0 - container_width).duration(0).end()
                    move(this.node()).x(0).duration(this._showTime).end(on_end);
                    break;
                case SwipeDirection.Left:
                    move(this.node()).x(container_width).duration(0).end();
                    move(this.node()).x(0).duration(this._showTime).end(on_end);
                    break;
            }

            result.done(() => {
                if (this._prevous != null)
                    this._prevous.hide();

                this.on_shown({});
            });

            return result;
        }

        //private showBodyNode() {
        //    $(this._pageNode.container).show();
        //    $(this._pageNode.loading).hide();
        //    $(this._pageNode.body).show();

        //    this.on_shown({});
        //}

        on_load(args: PageLoadArguments) {
            var result = eventDeferred(this.load, this, args);
            if (args.loadType == PageLoadType.open) {
                result.done(() => {
                    $(this.nodes().loading).hide();
                    $(this.nodes().content).show();
                })
            }

            result.done(() => {
                window.setTimeout(() => this.refreshUI(), 100);
            })

            return result;
        }
        on_closed(args) {
            return eventDeferred(this.closed, this, args);
        }
        on_scroll(args) {
            return eventDeferred(this.scroll, this, args);
        }
        on_showing(args) {
            return eventDeferred(this.showing, this, args);
        }
        on_shown(args) {
            return eventDeferred(this.shown, this, args);
        }
        on_hiding(args) {
            return eventDeferred(this.hiding, this, args);
        }
        on_hidden(args) {
            return eventDeferred(this.hidden, this, args);
        }
        on_scrollEnd(args) {
            return eventDeferred(this.scrollEnd, this, args);
        }
        open(args?: Object, swipe?: SwipeDirection): JQueryDeferred<any> {
            /// <summary>
            /// Show the page.
            /// </summary>
            /// <param name="args" type="Object">
            /// The value passed to the show event functions.
            /// </param>
            /// <returns type="jQuery.Deferred"/>
            if (this._openResult)
                return this._openResult;


            swipe = swipe || SwipeDirection.None;
            this.showPageNode(swipe);

            args = $.extend(args || {}, <PageLoadArguments>{
                loadType: chitu.PageLoadType.open,
                //loadCompleted: Page.createLoadCompletedFunc(this)
            });

            if (this.viewDeferred == null && this.view == null) {
                throw chitu.Errors.viewCanntNull();
            }

            //var viewDeferred = this.viewDeferred || $.Deferred<string>().resolve(this.view)
            //var actionDeferred = this.actionDeferred || $.Deferred<Action>().resolve();

            if (this.actionDeferred) {
                this.actionDeferred.done((action) => {
                    action.execute(this);
                    if (this.viewDeferred) {
                        this.viewDeferred.done((html) => this.view = html);
                    }
                    var load_args = <PageLoadArguments>args;
                    load_args.loadType = chitu.PageLoadType.open;
                    this.on_load(load_args);
                });
            }



        }
        close(args?: Object, swipe?: SwipeDirection) {
            /// <summary>
            /// Colse the page.
            /// </summary>
            /// <param name="args" type="Object" canBeNull="true">
            /// The value passed to the hide event functions.
            /// </param>
            /// <returns type="jQuery.Deferred"/>

            if (this.is_closed)
                return;

            this.hidePageNode(swipe).done(() => {
                $(this.node()).remove();
            });

            args = args || {};
            this.on_closed(args);
            this.is_closed = true;
        }

        private static page_scrollEnd(sender: chitu.Page, args) {
            //scrollStatus = ScrollStatus.ScrollEnd;

            var scrollTop = args.scrollTop;
            var scrollHeight = args.scrollHeight;
            var clientHeight = args.clientHeight;
        
            //====================================================================

            var marginBottom = clientHeight / 3;
            if (clientHeight + scrollTop < scrollHeight - marginBottom)
                return;

            if (!sender.enableScrollLoad)
                return;


            if (sender.scrollLoad_loading_bar != null && sender.scrollLoad_loading_bar.style.display == 'none') {
                sender.scrollLoad_loading_bar.style.display = 'block';
                sender.refreshUI();
            }

            var scroll_arg = $.extend(sender.routeData.values(), {
                loadType: PageLoadType.scroll,
            });
            var result = sender.on_load(scroll_arg);
        }

        refreshUI() {
            if (this.ios_scroller) {    //仅 IOS 需要刷新
                this.ios_scroller.refresh();
            }
        }
    }
};