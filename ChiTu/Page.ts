
module chitu {


    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;

    function eventDeferred(callback, sender, args = {}) {
        return chitu.fireCallback(callback, [sender, args]);
    };

    const PAGE_CLASS_NAME = 'page-node';
    const PAGE_HEADER_CLASS_NAME = 'page-header';
    const PAGE_BODY_CLASS_NAME = 'page-body';
    const PAGE_FOOTER_CLASS_NAME = 'page-footer';
    const PAGE_LOADING_CLASS_NAME = 'page-loading';
    const PAGE_CONTENT_CLASS_NAME = 'page-content';
    //var zindex: number;

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
            $(this.body).hide();
            node.appendChild(this.body);

            this.content = document.createElement('div');
            this.content.className = PAGE_CONTENT_CLASS_NAME;
            this.body.appendChild(this.content);

            this.loading = document.createElement('div');
            this.loading.className = PAGE_LOADING_CLASS_NAME;
            this.loading.innerHTML = '<div><i class="icon-spinner icon-spin"></i><div>';
            $(this.loading).hide();
            node.appendChild(this.loading);

            this.footer = document.createElement('div');
            this.footer.className = PAGE_FOOTER_CLASS_NAME;
            //this.footerNode.style.display = 'none';
            node.appendChild(this.footer);
        }
    }


    export class Page {

        private _context: chitu.ControllerContext
        private _name: string
        private _viewDeferred: any
        private _actionDeferred: any
        //_node: HTMLElement;
        //_visible = true;
        private _loadViewModelResult = null
        private _openResult: JQueryDeferred<any> = null
        private _hideResult = null;
        private _pageNode: PageNodes;
        private _container: HTMLElement;
        private _showDelay = 100;
        private _moveTime = 1000;
        private _prevous: chitu.Page;

        public swipe = true;

        init = ns.Callbacks();
        preLoad = ns.Callbacks();
        load = ns.Callbacks();
        closing = ns.Callbacks();
        closed = ns.Callbacks();
        scroll = ns.Callbacks();
        showing = ns.Callbacks();
        shown = ns.Callbacks();
        hiding = ns.Callbacks();
        hidden = ns.Callbacks();

        constructor(context: chitu.ControllerContext, container: HTMLElement, previous: chitu.Page) {
            if (!context) throw e.argumentNull('context');
            if (!container) throw e.argumentNull('container');

            this._container = container;
            this._prevous = previous;
            var element = document.createElement('div');
            container.appendChild(element);

            this._context = context;
            var controllerName = context.routeData().values().controller;
            var actionName = context.routeData().values().action;

            var name = Page.getPageName(context.routeData());

            var viewDeferred = context.view();
            var actionDeferred = context.controller().action(context.routeData());

            this._pageNode = new PageNodes(element);

            this._init(name, viewDeferred, actionDeferred, element);
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
        context(): chitu.ControllerContext {
            /// <returns type="chitu.ControllerContext"/>
            return this._context;
        }
        name(): string {
            return this._name;
        }
        node(): HTMLElement {
            /// <returns type="HTMLElement"/>
            return this._pageNode.container;
        }
        nodes(): PageNodes {
            return this._pageNode;
        }
        hide() {
            if (!$(this.node()).is(':visible'))
                return;

            this.hidePageNode(false);
        }
        show() {
            if ($(this.node()).is(':visible'))
                return;

            this.showPageNode(false);
        }
        visible() {
            return $(this.node()).is(':visible');
        }
        private hidePageNode(swipe: boolean): JQueryDeferred<any> {
            var result = $.Deferred();
            if (swipe) {
                var container_width = $(this._container).width();

                var times = 1000;
                //====================================================
                // 说明：必须要 setTimeout，移动才有效。
                window.setTimeout(() => {
                    window['move'](this.node()).set('left', container_width + 'px').duration(times).end();
                }, 100);
                //====================================================
                setTimeout(() => {
                    $(this.node()).hide();
                    result.resolve();
                    this.on_hidden({});
                }, times);
            }
            else {
                $(this.node()).hide();
                result.resolve();
                this.on_hidden({});
            }
            return result;
        }
        private showPageNode(swipe): JQueryPromise<any> {//, is_loading: boolean
            this.on_showing({});
            var result = $.Deferred();
            if (swipe) {
                var container_width = $(this._container).width();
                this.node().style.left = container_width + 'px';
                this.node().style.display = 'block';

                //var times = 1000;
                //====================================================
                // 说明：必须要 setTimeout，移动才有效。
                window.setTimeout(() => {
                    window['move'](this.node()).set('left', '0px').duration(this._moveTime).end();
                    if (this._openResult != null) {                 //正在加载中
                        $(this._pageNode.loading).show();
                        $(this._pageNode.body).hide();
                    }
                    else {
                        //$(this._pageNode.loadingNode).hide();
                        //$(this._pageNode.bodyNode).show();
                        this.showBodyNode();
                    }
                }, this._showDelay);
                //====================================================
               
                window.setTimeout(() => {
                    result.resolve();
                }, this._moveTime);
            }
            else {
                this.node().style.display = 'block';
                this.node().style.left = '0px';
                if (this._openResult != null) {
                    $(this._pageNode.loading).show();
                    $(this._pageNode.body).hide();
                }
                else {
                    //$(this._pageNode.loadingNode).hide();
                    //$(this._pageNode.bodyNode).show();
                    this.showBodyNode();
                }

                result.resolve();
            }

            result.done(() => {
                if (this._prevous != null)
                    this._prevous.hide();


            });

            //this.setPageSize();
            return result;
        }

        private showBodyNode() {
            $(this._pageNode.container).show();
            $(this._pageNode.loading).hide();
            $(this._pageNode.body).show();

            //this.setPageSize();
            this.on_shown({});
        }
        private _init(name, viewDeferred, actionDeferred, node) {
            if (!name) throw e.argumentNull('name');
            if (!viewDeferred) throw e.argumentNull('viewDeferred');
            if (!actionDeferred) throw e.argumentNull('actionDeferred')
            if (!node) throw e.argumentNull('node');

            this._name = name;
            this._viewDeferred = viewDeferred;
            this._actionDeferred = actionDeferred;
        }
        on_init() {
            return eventDeferred(this.init, this);
        }
        on_load(args) {
            return eventDeferred(this.load, this, args);
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
        _loadViewModel(): JQueryDeferred<any> {

            if (this._loadViewModelResult)
                return this._loadViewModelResult;

            this._loadViewModelResult = this._viewDeferred.pipe((html: string) => {
                u.log('Load view success, page:{0}.', [this.name()]);
                $(html).appendTo(this.nodes().content);
                $(this.nodes().content).find('[ch-part="header"]').appendTo(this.nodes().header);

                return this._actionDeferred;

            }).pipe((action: chitu.Action) => {
                /// <param name="action" type="chitu.Action"/>
                var result = action.execute(this);
                this.on_init();
                if (u.isDeferred(result))
                    return result;

                return $.Deferred().resolve();

            }).fail(() => {
                this._loadViewModelResult = null;
                u.log('Load view or action fail, page：{0}.', [this.name()]);
            });

            return this._loadViewModelResult;
        }
        open(values: Object): JQueryDeferred<any> {
            /// <summary>
            /// Show the page.
            /// </summary>
            /// <param name="args" type="Object">
            /// The value passed to the show event functions.
            /// </param>
            /// <returns type="jQuery.Deferred"/>
            if (this._openResult)
                return this._openResult;

            var args = values;
            this._openResult = $.Deferred();

            //var self = this;
         

            var pageNodeShown = this.showPageNode(this.swipe);

            this._loadViewModel()
                .pipe(() => {
                    return this.on_load(args);
                })
                .done(() => {
                    this._openResult.resolve();
                    this.showBodyNode();
                })
                .fail(() => {
                    this._openResult.reject();
                });

            return this._openResult.always(() => {
                this._openResult = null;
            });
        }
        close(args: any = undefined) {
            /// <summary>
            /// Hide the page.
            /// </summary>
            /// <param name="args" type="Object" canBeNull="true">
            /// The value passed to the hide event functions.
            /// </param>
            /// <returns type="jQuery.Deferred"/>

            this.hidePageNode(this.swipe).done(() => {
                this.node().remove();
            });

            args = args || {};
            this.on_closed(args);
        }

        //setPageSize() {
        //    //TODO:根据页头和页脚，设置间距
        //    var $loading_node = $(this._pageNode.loadingNode);
        //    var $body_node = $(this._pageNode.bodyNode);
        //    var wh = $(window).height();
        //    $loading_node.height(wh + 'px');

        //    //HARD CODE:如果使用了 IScroll，则不用设置
        //    if (!$body_node.parent().hasClass('wrapper')) {
        //        $body_node[0].style.minHeight = wh + 'px';
        //    }
        //}
    }
};