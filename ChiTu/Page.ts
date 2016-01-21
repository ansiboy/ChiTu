
namespace chitu {


    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;

    function eventDeferred(callback: chitu.Callback, sender, args = {}): JQueryDeferred<any> {
        return chitu.fireCallback(callback, [sender, args]);
    };

    const PAGE_CLASS_NAME = 'page-node';
    const PAGE_HEADER_CLASS_NAME = 'page-header';
    const PAGE_BODY_CLASS_NAME = 'page-body';
    const PAGE_FOOTER_CLASS_NAME = 'page-footer';
    const PAGE_LOADING_CLASS_NAME = 'page-loading';
    const PAGE_CONTENT_CLASS_NAME = 'page-content';
    //var zindex: number;


    var LOAD_COMPLETE_HTML = '<span style="padding-left:10px;">数据已全部加载完毕</span>';

    export enum PageLoadType {
        open,
        scroll,
        pullDown,
        pullUp,
        custom
    }

    export interface PageLoading {
        show()
        hide()
    }

    export class PageLoadArguments {
        private _page: chitu.Page;

        constructor(page: chitu.Page, loadType?: PageLoadType, loading?: PageLoading) {
            if (page == null)
                throw chitu.Errors.argumentNull('page');

            this._page = page;
            this.loadType = loadType;
            this.loading = loading;
        }
        loadType: PageLoadType
        loading: PageLoading
        set enableScrollLoad(value: boolean) {
            (<any>this._page).enableScrollLoad = value;
        }
        get enableScrollLoad(): boolean {
            return (<any>this._page).enableScrollLoad;
        }
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
            $(this.loading).hide();
            this.body.appendChild(this.loading);

            this.footer = document.createElement('div');
            this.footer.className = PAGE_FOOTER_CLASS_NAME;
            //this.footerNode.style.display = 'none';
            node.appendChild(this.footer);
        }
    }

    class PageBottomLoading implements PageLoading {
        private LOADDING_HTML = '<i class="icon-spinner icon-spin"></i><span style="padding-left:10px;">数据正在加载中...</span>';
        private _page: chitu.Page;
        private _scrollLoad_loading_bar: HTMLElement;

        constructor(page: chitu.Page) {
            if (!page)
                throw chitu.Errors.argumentNull('page');

            this._page = page;

            this._scrollLoad_loading_bar = document.createElement('div');
            this._scrollLoad_loading_bar.innerHTML = '<div name="scrollLoad_loading" style="padding:10px 0px 10px 0px;"><h5 class="text-center"></h5></div>';
            this._scrollLoad_loading_bar.style.display = 'none';
            $(this._scrollLoad_loading_bar).find('h5').html(this.LOADDING_HTML);
            page.nodes().content.appendChild(this._scrollLoad_loading_bar);
        }
        show() {
            if (this._scrollLoad_loading_bar.style.display == 'block')
                return;

            this._scrollLoad_loading_bar.style.display = 'block';
            this._page.refreshUI();
        }
        hide() {
            if (this._scrollLoad_loading_bar.style.display == 'none')
                return;

            this._scrollLoad_loading_bar.style.display = 'none';
            this._page.refreshUI();
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
        private _scrollLoad_loading_bar: HTMLElement;
        private actionExecuted = $.Deferred<boolean>();
        private isActionExecuted = false;
        private _scrollType: ScrollType;
        private _formLoading: PageLoading;
        private _bottomLoading: PageLoading;

        preLoad = ns.Callbacks();
        load = ns.Callbacks();
        loadCompleted = ns.Callbacks();
        closing = ns.Callbacks();
        closed = ns.Callbacks();
        scroll = ns.Callbacks();
        showing = ns.Callbacks();
        shown = ns.Callbacks();
        hiding = ns.Callbacks();
        hidden = ns.Callbacks();
        scrollEnd = ns.Callbacks();
        viewChanged = $.Callbacks();



        constructor(element: HTMLElement, scrollType: ScrollType, previous?: chitu.Page) {
            if (!element) throw e.argumentNull('element');
            if (scrollType == null) throw e.argumentNull('scrollType');

            this._prevous = previous;
            this._pageNode = new PageNodes(element);
            this.disableHeaderFooterTouchMove();

            this._scrollType = scrollType;
            if (scrollType == ScrollType.IScroll) {
                $(this.nodes().container).addClass('ios');
                this.ios_scroller = new IOSScroll(this);
                gesture.enable_iscroll_gesture(this, null, null);
            }
            else if (scrollType == ScrollType.Div) {
                $(this.nodes().container).addClass('div');
                new DisScroll(this);
                gesture.enable_divfixed_gesture(this, null, null);
            }
            else if (scrollType == ScrollType.Document) {
                $(this.nodes().container).addClass('doc');
                new DocumentScroll(this);
            }

            this.scrollEnd.add(Page.page_scrollEnd);
            if (previous)
                previous.closed.add(() => this.close());


        }
        private createPageLoadArguments(args, loadType: PageLoadType, loading: PageLoading): PageLoadArguments {
            var result: PageLoadArguments = new PageLoadArguments(this, loadType, loading);
            result = $.extend(result, args || {});

            return result;
        }
        get formLoading(): PageLoading {
            if (this._formLoading == null) {
                this._formLoading = {
                    show: () => {
                        if ($(this.nodes().loading).is(':visible'))
                            return;

                        $(this.nodes().loading).show();
                        $(this.nodes().content).hide();
                    },
                    hide: () => {
                        $(this.nodes().loading).hide();
                        $(this.nodes().content).show();
                    }
                }
            }
            return this._formLoading;
        }
        set formLoading(value: PageLoading) {
            if (!value)
                throw chitu.Errors.argumentNull('value');

            this._formLoading = value;
        }
        get bottomLoading(): PageLoading {
            if (this._bottomLoading == null)
                this._bottomLoading = new PageBottomLoading(this);

            return this._bottomLoading;
        }
        set bottomLoading(value: PageLoading) {
            if (!value)
                throw chitu.Errors.argumentNull('value');

            this._bottomLoading = value;
        }
        get view(): JQueryPromise<string> {
            return this._viewDeferred;
        }
        set view(value: JQueryPromise<string>) {
            this._viewDeferred = value;
        }
        get action(): JQueryPromise<Action> {
            return this._actionDeferred;
        }
        set action(value: JQueryPromise<Action>) {
            this._actionDeferred = value;
        }
        private get enableScrollLoad(): boolean {
            return this._enableScrollLoad;
        }
        private set enableScrollLoad(value: boolean) {
            this._enableScrollLoad = value;
        }
        private set viewHtml(value: string) {
            this.nodes().content.innerHTML = value;

            var q = this.nodes().content.querySelector('[ch-part="header"]');
            if (q) this.nodes().header.appendChild(q);

            q = this.nodes().content.querySelector('[ch-part="footer"]');
            if (q) this.nodes().footer.appendChild(q);

            this.viewChanged.fire();
        }
        private get viewHtml(): string {
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
        get previous(): chitu.Page {
            return this._prevous;
        }
        get scrollType(): ScrollType {
            return this._scrollType;
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
                //if (this._prevous != null)
                //    this._prevous.hide();
                
                this.on_shown({});
            });

            return result;
        }

        //private ensureScrollLoadingBar() {
        //    if (this.scrollLoad_loading_bar == null) {
        //        this.scrollLoad_loading_bar = document.createElement('div');
        //        this.scrollLoad_loading_bar.innerHTML = '<div name="scrollLoad_loading" style="padding:10px 0px 10px 0px;"><h5 class="text-center"></h5></div>';
        //        this.scrollLoad_loading_bar.style.display = 'none';
        //        $(this.scrollLoad_loading_bar).find('h5').html(LOADDING_HTML);
        //        this.nodes().content.appendChild(this.scrollLoad_loading_bar);
        //    }
        //}
        //private get scrollLoad_loading_bar(): HTMLElement {
        //    if (this._scrollLoad_loading_bar == null) {
        //        this._scrollLoad_loading_bar = document.createElement('div');
        //        this._scrollLoad_loading_bar.innerHTML = '<div name="scrollLoad_loading" style="padding:10px 0px 10px 0px;"><h5 class="text-center"></h5></div>';
        //        this._scrollLoad_loading_bar.style.visibility = 'hidden';
        //        $(this._scrollLoad_loading_bar).find('h5').html(LOADDING_HTML);
        //        this.nodes().content.appendChild(this._scrollLoad_loading_bar);
        //        this.refreshUI();
        //    }
        //    return this._scrollLoad_loading_bar;
        //}
        //private showScrollLoadingBar() {
        //    //this.ensureScrollLoadingBar();
        //    if (this.scrollLoad_loading_bar.style.visibility == 'hidden') {
        //        this.scrollLoad_loading_bar.style.visibility = 'visible';
        //        //this.refreshUI();
        //    }
        //}
        //private hideScrollLoadingBar() {
        //    //this.ensureScrollLoadingBar();
        //    if (this.scrollLoad_loading_bar.style.visibility == 'visible') {
        //        this.scrollLoad_loading_bar.style.visibility = 'hidden';
        //        //this.refreshUI();
        //    }
        //}
        private fireEvent(callback: chitu.Callback, args) {
            if (this.actionExecuted.state() == 'resolved')
                return eventDeferred(callback, this, args);

            return this.actionExecuted.pipe(() => eventDeferred(callback, this, args));
        }
        private disableHeaderFooterTouchMove() {
            $([this.nodes().footer, this.nodes().header]).on('touchmove', function (e) {
                e.preventDefault();
            })
        }
        on_load(args: PageLoadArguments | { loadType: PageLoadType, loading?: PageLoading }) {

            var load_args: PageLoadArguments = args instanceof PageLoadArguments ?
                args : new PageLoadArguments(this, args.loadType, args.loading);

            if (load_args.loading == null) {
                load_args.loading = load_args.loadType == chitu.PageLoadType.scroll ? this.bottomLoading : this.formLoading;
            }

            load_args.loading.show();
            var result = this.fireEvent(this.load, load_args);
            result.done(() => load_args.loading.hide());

            //===============================================================
            // 必须是 view 加载完成，并且 on_load 完成后，才触发 on_loadCompleted 事件
            if (this.view == null) {
                result.done(() => this.on_loadCompleted(load_args));
            }
            else {
                if (this.view.state() == 'resolved') {
                    result.done(() => this.on_loadCompleted(load_args));
                }
                else {
                    $.when(this.view, result).done(() => this.on_loadCompleted(load_args));
                }
            }
            //===============================================================

            return result;
        }
        on_loadCompleted(args) {
            return this.fireEvent(this.loadCompleted, args).done(() => {
                window.setTimeout(() => this.refreshUI(), 100);
            });
        }
        on_closing(args) {
            return this.fireEvent(this.closing, args);
        }
        on_closed(args) {
            return this.fireEvent(this.closed, args);
        }
        on_scroll(args) {
            return this.fireEvent(this.scroll, args);
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
        on_scrollEnd(args) {
            return this.fireEvent(this.scrollEnd, args);
        }
        open(args?: Object, swipe?: SwipeDirection): JQueryPromise<any> {
            /// <summary>
            /// Show the page.
            /// </summary>
            /// <param name="args" type="Object">
            /// The value passed to the show event functions.
            /// </param>
            if (this._openResult)
                return this._openResult;

            //不能多次打开？？？

            swipe = swipe || SwipeDirection.None;
            var result = this.showPageNode(swipe);

            var load_args = this.createPageLoadArguments(args, chitu.PageLoadType.open, this.formLoading);
            load_args.loading.show();

            if (this.view == null && this.viewHtml == null) {
                throw chitu.Errors.viewCanntNull();
            }

            if (this.action) {
                this.action.done((action) => {
                    action.execute(this);
                    this.actionExecuted.resolve();

                    if (this.view) {
                        this.view.done((html) => this.viewHtml = html);
                    }

                    this.on_load(load_args);
                });
            }

            return result;
        }
        close(args?: Object, swipe?: SwipeDirection) {
            /// <summary>
            /// Colse the page.
            /// </summary>
            /// <param name="args" type="Object" canBeNull="true">
            /// The value passed to the hide event functions.
            /// </param>

            if (this.is_closed)
                return;

            this.on_closing(args);

            if (this.visible()) {
                this.hidePageNode(swipe).done(() => {
                    $(this.node()).remove();
                });
            }
            else {
                $(this.node()).remove();
            }

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

            var scroll_arg = $.extend(sender.routeData.values(), <PageLoadArguments>{
                loadType: PageLoadType.scroll,
                loading: sender.bottomLoading,
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