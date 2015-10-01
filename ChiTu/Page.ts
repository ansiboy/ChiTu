
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

    class PageNode {
        node: HTMLElement
        headerNode: HTMLElement
        bodyNode: HTMLElement
        footerNode: HTMLElement
        loadingNode: HTMLElement

        constructor(node: HTMLElement) {
            node.className = PAGE_CLASS_NAME;
            this.node = node;

            this.headerNode = document.createElement('div');
            this.headerNode.className = PAGE_HEADER_CLASS_NAME;
            //this.headerNode.style.display = 'none';
            node.appendChild(this.headerNode);


            this.bodyNode = document.createElement('div');
            this.bodyNode.className = PAGE_BODY_CLASS_NAME;
            $(this.bodyNode).hide();
            node.appendChild(this.bodyNode);

            this.loadingNode = document.createElement('div');
            this.loadingNode.className = PAGE_LOADING_CLASS_NAME;
            this.loadingNode.innerHTML = '<div><i class="icon-spinner icon-spin"></i><div>';
            $(this.loadingNode).hide();
            node.appendChild(this.loadingNode);

            this.footerNode = document.createElement('div');
            this.footerNode.className = PAGE_FOOTER_CLASS_NAME;
            //this.footerNode.style.display = 'none';
            node.appendChild(this.footerNode);
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
        private _pageNode: PageNode;
        private _container: HTMLElement;
        private _showDelay = 100;
        private _moveTime = 1000;

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

        constructor(context: chitu.ControllerContext, container: HTMLElement) {
            if (!context) throw e.argumentNull('context');
            if (!container) throw e.argumentNull('container');

            //if (!zindex) {
            //    zindex = new Number(container.style.zIndex || '0').valueOf();
            //    zindex = zindex + 1;
            //}
            this._container = container;
            var element = document.createElement('div');
            //element.style.zIndex = (zindex + 1).toString();
            container.appendChild(element);

            this._context = context;
            var controllerName = context.routeData().values().controller;
            var actionName = context.routeData().values().action;

            var name = Page.getPageName(context.routeData());

            var viewDeferred = context.view();
            var actionDeferred = context.controller().action(context.routeData());

            this._pageNode = new PageNode(element);

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
            return this._pageNode.node;
        }
        hide() {
            this.hidePageNode(false);
            this.on_hidden({});
        }
        show() {
            this.on_showing({});
            this.showPageNode(false);
            this.on_shown({});
        }
        visible() {
            return $(this.node()).is(':visible');
        }
        private hidePageNode(swipe: boolean) {
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
                    this.on_hidden({});
                }, times);
            }
            else {
                $(this.node()).hide();
                this.on_hidden({});
            }
        }
        private showPageNode(swipe): JQueryPromise<any> {//, is_loading: boolean
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
                        $(this._pageNode.loadingNode).show();
                        $(this._pageNode.bodyNode).hide();
                    }
                    else {
                        $(this._pageNode.loadingNode).hide();
                        $(this._pageNode.bodyNode).show();
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
                    $(this._pageNode.loadingNode).show();
                    $(this._pageNode.bodyNode).hide();
                }
                else {
                    $(this._pageNode.loadingNode).hide();
                    $(this._pageNode.bodyNode).show();
                }
                result.resolve();
            }
            return result;
        }
        private showBodyNode() {
            $(this._pageNode.node).show();
            $(this._pageNode.loadingNode).hide();
            $(this._pageNode.bodyNode).show();
        }
        //private showLoadingNode() {
        //    $(this._pageNode.node).show();
        //    $(this._pageNode.bodyNode).hide();
        //    $(this._pageNode.loadingNode).show();
        //}
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
        on_scroll(event) {
            return eventDeferred(this.scroll, this, event);
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
                $(this.node()).find('.' + PAGE_BODY_CLASS_NAME).html(html);
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
            this.on_showing(args);

            var pageNodeShown = this.showPageNode(this.swipe);

            this._loadViewModel()
                .pipe(() => {
                    return this.on_load(args);
                })
                .done(() => {
                    this._openResult.resolve();
                    this.showBodyNode()
                    pageNodeShown.done(() => {
                        this.on_shown(args);
                    });
                })
                .fail(function () {
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

            args = args || {};

            this.hidden.add(() => {
                this.node().remove();
            });
            this.hidePageNode(this.swipe);

            this.on_closed(args);
        }
    }
};