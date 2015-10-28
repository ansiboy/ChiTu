module chitu {
    var e = chitu.Errors;
    export class Utility {
        public static isType(targetType: Function, obj: any): boolean {
            for (var key in targetType.prototype) {
                if (obj[key] === undefined)
                    return false;
            }
            return true;
        }
        public static isDeferred(obj: any): boolean {
            if (obj == null)
                return false;

            if (obj.pipe != null && obj.always != null && obj.done != null)
                return true;

            return false;
        }
        public static format(source: string, arg1?: string, arg2?: string, arg3?: string, arg4?: string, arg5?: string,
                             arg6?: string, arg7?: string, arg8?: string, arg9?: string, arg10?: string): string {
            var params: string[] = [arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10];
            for (var i = 0; i < params.length; i++) {
                if (params[i] == null)
                    break;

                source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function () {
                    return params[i];
                });
            }

            return source;
        }
        public static fileName(url, withExt): string {
            /// <summary>获取 URL 链接中的文件名</summary>
            /// <param name="url" type="String">URL 链接</param>
            /// <param name="withExt" type="Boolean" canBeNull="true">
            /// 表示返回的文件名是否包含扩展名，true表示包含，false表示不包含。默认值为true。
            /// </param>
            /// <returns>返回 URL 链接中的文件名</returns>
            if (!url) throw e.argumentNull('url');
            withExt = withExt || true;

            url = url.replace('http://', '/');
            var filename = url.replace(/^.*[\\\/]/, '');
            if (withExt === true) {
                var arr = filename.split('.');
                filename = arr[0];
            }

            return filename;
        }
        public static log(msg, args: any[] = []) {
            if (!window.console) return;

            if (args == null) {
                console.log(msg);
                return;
            }
            var txt = this.format.apply(this, arguments);
            console.log(txt);
        }
    }
} 

;module chitu {
    var u = chitu.Utility;
    export class Errors {
        public static argumentNull(paramName: string) {
            var msg = u.format('The argument "{0}" cannt be null.', paramName);

            return new Error(msg);
        }
        public static modelFileExpecteFunction(script) {
            var msg = u.format('The eval result of script file "{0}" is expected a function.', script);
            return new Error(msg);
        }
        public static paramTypeError(paramName: string, expectedType: string) {
            /// <param name="paramName" type="String"/>
            /// <param name="expectedType" type="String"/>

            var msg = u.format('The param "{0}" is expected "{1}" type.', paramName, expectedType);
            return new Error(msg);
        }
        public static viewNodeNotExists(name) {
            var msg = u.format('The view node "{0}" is not exists.', name);
            return new Error(msg);
        }
        public static pathPairRequireView(index) {
            var msg = u.format('The view value is required for path pair, but the item with index "{0}" is miss it.', index);
            return new Error(msg);
        }
        public static notImplemented(name) {
            var msg = u.format('The method "{0}" is not implemented.', name);
            return new Error(msg);
        }
        public static routeExists(name) {
            var msg = u.format('Route named "{0}" is exists.', name);
            return new Error(msg);
        }
        public static routeResultRequireController(routeName) {
            var msg = u.format('The parse result of route "{0}" does not contains controler.', routeName);
            return new Error(msg);
        }
        public static routeResultRequireAction(routeName) {
            var msg = u.format('The parse result of route "{0}" does not contains action.', routeName);
            return new Error(msg);
        }
        public static ambiguityRouteMatched(url, routeName1, routeName2) {
            var msg = u.format('Ambiguity route matched, {0} is match in {1} and {2}.', url, routeName1, routeName2);
            return new Error(msg);
        }
        public static noneRouteMatched(url): Error {
            var msg = u.format('None route matched with url "{0}".', url);
            var error = new Error(msg);
            return error;
        }
        public static emptyStack(): Error {
            return new Error('The stack is empty.');
        }
        public static canntParseUrl(url: string) {
            var msg = u.format('Can not parse the url "{0}" to route data.', url);
            return new Error(msg);
        }
        public static routeDataRequireController(): Error {
            var msg = 'The route data does not contains a "controller" file.';
            return new Error(msg);
        }
        public static routeDataRequireAction(): Error {
            var msg = 'The route data does not contains a "action" file.';
            return new Error(msg);
        }
        public static parameterRequireField(fileName, parameterName) {
            var msg = u.format('Parameter {1} does not contains field {0}.', fileName, parameterName);
            return new Error(msg);
        }
    }
} 

;module chitu {
    var rnotwhite = (/\S+/g);

    // String to Object options format cache
    var optionsCache = {};

    // Convert String-formatted options into Object-formatted ones and store in cache
    function createOptions(options) {
        var object = optionsCache[options] = {};
        jQuery.each(options.match(rnotwhite) || [], function (_, flag) {
            object[flag] = true;
        });
        return object;
    }


chitu.Application
    export class Callback {
        source: any
        constructor(source: any) {
            this.source = source;
        }
        add(func: Function) {
            this.source.add(func);
        }
        remove(func: Function) {
            this.source.remove(func);
        }
        has(func: Function): boolean {
            return this.source.has(func);
        }
        fireWith(context, args) {
            return this.source.fireWith(context, args);
        }
        fire(arg1?, arg2?, arg3?, arg4?) {
            return this.source.fire(arg1, arg2, arg3);
        }
    }

    export function Callbacks(options: any = null): Callback {
        // Convert options from String-formatted to Object-formatted if needed
        // (we check in cache first)
        options = typeof options === "string" ?
            (optionsCache[options] || createOptions(options)) :
            jQuery.extend({}, options);

        var // Last fire value (for non-forgettable lists)
            memory,
            // Flag to know if list was already fired
            fired,
            // Flag to know if list is currently firing
            firing,
            // First callback to fire (used internally by add and fireWith)
            firingStart,
            // End of the loop when firing
            firingLength,
            // Index of currently firing callback (modified by remove if needed)
            firingIndex,
            // Actual callback list
            list = [],
            // Stack of fire calls for repeatable lists
            stack = !options.once && [],
            // Fire callbacks
            fire = function (data) {
                memory = options.memory && data;
                fired = true;
                firingIndex = firingStart || 0;
                firingStart = 0;
                firingLength = list.length;
                firing = true;
                for (; list && firingIndex < firingLength; firingIndex++) {
                    var result = list[firingIndex].apply(data[0], data[1]);
                    //==============================================
                    // MY CODE
                    if (result != null) {
                        data[0].results.push(result);
                    }
                    //==============================================
                    if (result === false && options.stopOnFalse) {
                        memory = false; // To prevent further calls using add
                        break;
                    }
                }
                firing = false;
                if (list) {
                    if (stack) {
                        if (stack.length) {
                            fire(stack.shift());
                        }
                    } else if (memory) {
                        list = [];
                    } else {
                        self.disable();
                    }
                }
            },
            // Actual Callbacks object
            self = {
                results: [],
                // Add a callback or a collection of callbacks to the list
                add: function () {
                    if (list) {
                        // First, we save the current length
                        var start = list.length;
                        (function add(args) {
                            jQuery.each(args, function (_, arg) {
                                var type = jQuery.type(arg);
                                if (type === "function") {
                                    if (!options.unique || !self.has(arg)) {
                                        list.push(arg);
                                    }
                                } else if (arg && arg.length && type !== "string") {
                                    // Inspect recursively
                                    add(arg);
                                }
                            });
                        })(arguments);
                        // Do we need to add the callbacks to the
                        // current firing batch?
                        if (firing) {
                            firingLength = list.length;
                            // With memory, if we're not firing then
                            // we should call right away
                        } else if (memory) {
                            firingStart = start;
                            fire(memory);
                        }
                    }
                    return this;
                },
                // Remove a callback from the list
                remove: function () {
                    if (list) {
                        jQuery.each(arguments, function (_, arg) {
                            var index;
                            while ((index = jQuery.inArray(arg, list, index)) > -1) {
                                list.splice(index, 1);
                                // Handle firing indexes
                                if (firing) {
                                    if (index <= firingLength) {
                                        firingLength--;
                                    }
                                    if (index <= firingIndex) {
                                        firingIndex--;
                                    }
                                }
                            }
                        });
                    }
                    return this;
                },
                // Check if a given callback is in the list.
                // If no argument is given, return whether or not list has callbacks attached.
                has: function (fn) {
                    return fn ? jQuery.inArray(fn, list) > -1 : !!(list && list.length);
                },
                // Remove all callbacks from the list
                empty: function () {
                    list = [];
                    firingLength = 0;
                    return this;
                },
                // Have the list do nothing anymore
                disable: function () {
                    list = stack = memory = undefined;
                    return this;
                },
                // Is it disabled?
                disabled: function () {
                    return !list;
                },
                // Lock the list in its current state
                lock: function () {
                    stack = undefined;
                    if (!memory) {
                        self.disable();
                    }
                    return this;
                },
                // Is it locked?
                locked: function () {
                    return !stack;
                },
                // Call all callbacks with the given context and arguments
                fireWith: function (context, args) {
                    context.results = [];
                    if (list && (!fired || stack)) {
                        args = args || [];
                        args = [context, args.slice ? args.slice() : args];
                        if (firing) {
                            stack.push(args);
                        } else {
                            fire(args);
                        }
                    }
                    return context.results;
                },
                // Call all the callbacks with the given arguments
                fire: function () {
                    return self.fireWith(this, arguments);
                },
                // To know if the callbacks have already been called at least once
                fired: function () {
                    return !!fired;
                },
                count: function () {
                    return list.length;
                }
            };

        return new chitu.Callback(self);
    }

    export function fireCallback(callback: chitu.Callback, args) {

        var results = callback.fire.apply(callback, args);
        var deferreds = [];
        for (var i = 0; i < results.length; i++) {
            if (chitu.Utility.isDeferred(results[i]))
                deferreds.push(results[i]);
        }

        if (deferreds.length == 0)
            return $.Deferred().resolve();

        return $.when.apply($, deferreds);
    }

    var crossroads = window['crossroads'];
    $.extend(crossroads, {
        _create: crossroads.create,
        create: function () {
            /// <returns type="Crossroads"/>
            var obj = this._create();
            obj.getRouteData = function (request, defaultArgs) {
                request = request || '';
                defaultArgs = defaultArgs || [];

                // should only care about different requests if ignoreState isn't true
                if (!this.ignoreState &&
                    (request === this._prevMatchedRequest ||
                        request === this._prevBypassedRequest)) {
                    return;
                }

                var routes = this._getMatchedRoutes(request),
                    i = 0,
                    n = routes.length,
                    cur;

                if (n == 0)
                    return null;

                if (n > 1) {
                    throw chitu.Errors.ambiguityRouteMatched(request, 'route1', 'route2');
                }
                return routes[0];
            }
            return obj;
        }
    });

} ;
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
            this.loading.innerHTML = '<div class="spin"><i class="icon-spinner icon-spin"></i><div>';
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
        private _showTime = 600;
        private _hideTime = 800
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
        previous(): chitu.Page {
            return this._prevous;
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
                //this.node().style.left = '0px';

                //====================================================
                // 说明：必须要 setTimeout，移动才有效。
                //window.setTimeout(() => {
                window['move'](this.node())
                //.set('left', container_width + 'px').duration(this._moveTime)
                    .to(container_width)
                    .duration(this._hideTime)
                    .end(() => {
                        $(this.node()).hide();
                        result.resolve();
                        this.on_hidden({});
                    });
                //}, 100);
                //====================================================
                //setTimeout(() => {
                //    $(this.node()).hide();
                //    result.resolve();
                //    this.on_hidden({});
                //}, this._moveTime);
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
                this.node().style.left = '0px';
                this.node().style.display = 'block';
                move(this.node()).to(container_width).duration(0).end();
                //====================================================
                // 说明：必须要 setTimeout，移动才有效。
                //window.setTimeout(() => {
                move(this.node())
                    .to(0)
                    .duration(this._showTime)
                    .end(() => {
                        result.resolve();
                    });

                if (this._openResult != null) {                 //正在加载中
                    $(this._pageNode.loading).show();
                    $(this._pageNode.body).hide();
                }
                else {
                    this.showBodyNode();
                }
                //}, this._showDelay);
                //====================================================
               
            }
            else {
                this.node().style.display = 'block';
                //==================================
                // 说明：如果坐标是通过变换得到的，不能直接设置 left 位置
                if (this.node().style.transform) {
                    //window['move'](this.node()).to(0).duration(0);
                    move(this.node()).to(0).duration(0);
                }
                else {
                    this.node().style.left = '0px';
                }
                //==================================

                if (this._openResult != null) {
                    $(this._pageNode.loading).show();
                    $(this._pageNode.body).hide();
                }
                else {
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
                $(this.nodes().content).find('[ch-part="footer"]').appendTo(this.nodes().footer);
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

    }
};;module chitu {
    var ns = chitu;
    var e = ns.Errors;
    var u = ns.Utility;

    var crossroads = window['crossroads'];

    function interpolate(pattern: string, data) {
        var http_prefix = 'http://'.toLowerCase();
        if (pattern.substr(0, http_prefix.length).toLowerCase() == http_prefix) {
            var link = document.createElement('a');
            //  set href to any path
            link.setAttribute('href', pattern);

            pattern = decodeURI(link.pathname); //pattern.substr(http_prefix.length);
 
            var route = crossroads.addRoute(pattern);
            return http_prefix + link.host + route.interpolate(data);
        }

        var route = crossroads.addRoute(pattern);
        return route.interpolate(data);
    }

    export class Controller {
        _name: any;
        //_routeData: RouteData;
        _actions = {};
        actionCreated: any;

        constructor(name: string) {
            //if (!routeData) throw e.argumentNull('routeData');
            ////if (typeof routeData !== 'object') throw e.paramTypeError('routeData', 'object');

            //if (!routeData.values().controller)
            //    throw e.routeDataRequireController();

            this._name = name;
            //this._routeData = routeData;
            this._actions = {};

            this.actionCreated = chitu.Callbacks();
        }
        public name() {
            return this._name;
        }
        //public getLocation(routeData: RouteData) {
        //    /// <param name="actionName" type="String"/>
        //    /// <returns type="String"/>
        //    //if (!actionName) throw e.argumentNull('actionName');
        //    //if (typeof actionName != 'string') throw e.paramTypeError('actionName', 'String');

        //    var data = $.extend(RouteData.values(), { action: actionName });
        //    return interpolate(this._routeData.actionPath(), data);
        //}
        public action(routeData: RouteData) {
            /// <param name="value" type="chitu.Action" />
            /// <returns type="jQuery.Deferred" />
            
            var controller = routeData.values().controller;;
            if (!controller)
                throw e.routeDataRequireController();

            if (this._name != controller) {
                throw new Error('Not same a controller.');
            }

            var name = routeData.values().action;
            if (!name) throw e.routeDataRequireAction();



            var self = this;
            if (!this._actions[name]) {
                this._actions[name] = this._createAction(routeData).fail($.proxy(
                    function () {
                        self._actions[this.actionName] = null;
                    },
                    { actionName: routeData })
                    );
            }

            return this._actions[name];
        }
        private _createAction(routeData: RouteData) {
            /// <param name="actionName" type="String"/>
            /// <returns type="jQuery.Deferred"/>

            var actionName = routeData.values().action;
            if (!actionName)
                throw e.routeDataRequireAction();

            var self = this;
            var url = interpolate(routeData.actionPath(), routeData.values()); //this.getLocation(actionName);
            var result = $.Deferred();

            requirejs([url],
                $.proxy(function (obj) {
                    //加载脚本失败
                    if (!obj) {
                        //console.warn(u.format('加载活动“{1}.{0}”失败，为该活动提供默认的值。', this.actionName, self.name()));
                        //obj = { func: function () { } };
                        result.reject();
                    }

                    var func = obj.func || obj;

                    if (!$.isFunction(func))
                        throw ns.Errors.modelFileExpecteFunction(this.actionName);

                    var action = new Action(self, this.actionName, func);
                    self.actionCreated.fire(self, action);

                    this.result.resolve(action);
                }, { actionName: actionName, result: result }),

                $.proxy(function (err) {
                    //console.warn(u.format('加载活动“{1}.{0}”失败，为该活动提供默认的值。', this.actionName, self.name()));
                    //var action = new Action(self, this.actionName, function () { });
                    //self.actionCreated.fire(self, action);
                    //this.result.resolve(action);
                    this.result.reject(err);
                }, { actionName: actionName, result: result })
                );

            return result;
        }
    }



    export class Action {
        _name: any
        _handle: any

        constructor(controller, name, handle) {
            /// <param name="controller" type="chitu.Controller"/>
            /// <param name="name" type="String">Name of the action.</param>
            /// <param name="handle" type="Function"/>

            if (!controller) throw e.argumentNull('controller');
            if (!name) throw e.argumentNull('name');
            if (!handle) throw e.argumentNull('handle');
            if (!$.isFunction(handle)) throw e.paramTypeError('handle', 'Function');

            this._name = name;
            this._handle = handle;
        }

        name() {
            return this._name;
        }

        execute(page: chitu.Page) {
            /// <param name="page" type="chitu.Page"/>
            /// <returns type="jQuery.Deferred"/>
            if (!page) throw e.argumentNull('page');
            //if (page._type != 'Page') throw e.paramTypeError('page', 'Page');

            var result = this._handle.apply({}, [page]);
            return u.isDeferred(result) ? result : $.Deferred().resolve();
        }
    }

    export function action(deps, filters, func) {
        /// <param name="deps" type="Array" canBeNull="true"/>
        /// <param name="filters" type="Array" canBeNull="true"/>
        /// <param name="func" type="Function" canBeNull="false"/>

        switch (arguments.length) {
            case 0:
                throw e.argumentNull('func');

            case 1:
                if (typeof arguments[0] != 'function')
                    throw e.paramTypeError('arguments[0]', 'Function');

                func = deps;
                filters = deps = [];
                break;

            case 2:
                func = filters;
                if (typeof func != 'function')
                    throw e.paramTypeError('func', 'Function');

                if (!$.isArray(deps))
                    throw e.paramTypeError('deps', 'Array');

                if (deps.length == 0) {
                    deps = filters = [];
                }
                else if (typeof deps[0] == 'function') {
                    filters = deps;
                    deps = [];
                }
                else {
                    filters = [];
                }

                break;
        }

        for (var i = 0; i < deps.length; i++) {
            if (typeof deps[i] != 'string')
                throw e.paramTypeError('deps[' + i + ']', 'string');
        }

        for (var i = 0; i < filters.length; i++) {
            if (typeof filters[i] != 'function')
                throw e.paramTypeError('filters[' + i + ']', 'function');
        }

        if (!$.isFunction(func))
            throw e.paramTypeError('func', 'function');

        define(deps, $.proxy(
            function () {
                var args = Array.prototype.slice.call(arguments, 0);
                var func = this.func;
                var filters = this.filters;

                return {
                    func: function (page) {
                        args.unshift(page);
                        return func.apply(func, args);
                    },
                    filters: filters
                }
            },
            { func: func, filters: filters })
            );

        return func;
    };

};;module chitu {
    export class ControllerContext {
        private _controller: any;
        private _view: any;
        private _routeData: RouteData;
        constructor(controller, view, routeData: RouteData) {
            this._routeData = routeData;
            this._controller = controller;
            this._view = view;
            this._routeData = routeData;
        }
        public controller(): chitu.Controller {
            /// <returns type="chitu.Controller"/>
            return this._controller;
        }
        public view() {
            /// <returns type="jQuery.Deferred"/>
            return this._view;
        }
        public routeData(): RouteData {
            /// <returns type="chitu.RouteData"/>
            return this._routeData;
        }
    }
};module chitu {
    var e = chitu.Errors;
    var ns = chitu;

    export class ControllerFactory {
        _controllers = {}
        _actionLocationFormater: any

        constructor() {
            //if (!actionLocationFormater)
            //    throw e.argumentNull('actionLocationFormater');

            this._controllers = {};
            //this._actionLocationFormater = actionLocationFormater;
        }

        public controllers() {
            return this._controllers;
        }

        public createController(name: string) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="ns.Controller"/>
            //if (!routeData.values().controller)
            //    throw e.routeDataRequireController();

            return new ns.Controller(name);
        }

        public actionLocationFormater() {
            return this._actionLocationFormater;
        }

        public getController(routeData: RouteData) {
            /// <summary>Gets the controller by routeData.</summary>
            /// <param name="routeData" type="Object"/>
            /// <returns type="chitu.Controller"/>

            //if (typeof routeData !== 'object')
            //    throw e.paramTypeError('routeData', 'object');

            if (!routeData.values().controller)
                throw e.routeDataRequireController();

            if (!this._controllers[routeData.values().controller])
                this._controllers[routeData.values().controller] = this.createController(routeData.values().controller);

            return this._controllers[routeData.values().controller];
        }
    }
} ;module chitu {
    export class Route {
        private _name: string;
        private _pattern: string;
        private _defaults: Object;

        viewPath: string;
        actionPath: string;

        constructor(name: string, pattern: string, defaults: Object) {
            this._name = name
            this._pattern = pattern;
            this._defaults = defaults;
        }
        public name(): string {
            return this._name;
        }
        public defaults(): Object {
            return this._defaults;
        }
        public url(): string {
            return this._pattern;
        }
    }


} ;module chitu {

    var ns = chitu;
    var e = chitu.Errors;

    export class RouteCollection {
        _source: any
        _priority: number
        _defaultRoute: Route
        static defaultRouteName: string = 'default';

        _defaults: {}

        constructor() {
            this._init();
        }

        _init() {
            var crossroads = window['crossroads']
            this._source = crossroads.create();
            this._source.ignoreCase = true;
            this._source.normalizeFn = crossroads.NORM_AS_OBJECT;
            this._priority = 0;
        }
        count() {
            return this._source.getNumRoutes();
        }

        mapRoute(args) {//name, url, defaults
            /// <param name="args" type="Objecct"/>
            args = args || {};

            var name = args.name;
            var url = args.url;
            var defaults = args.defaults;
            var rules = args.rules || {};

            if (!name) throw e.argumentNull('name');
            if (!url) throw e.argumentNull('url');

            this._priority = this._priority + 1;

            var route = new chitu.Route(name, url, defaults);
            route.viewPath = args.viewPath;
            route.actionPath = args.actionPath;

            var originalRoute = this._source.addRoute(url, function (args) {
                //var values = $.extend(defaults, args);
                //self.routeMatched.fire([name, values]);
            }, this._priority);

            originalRoute.rules = rules;
            originalRoute.newRoute = route;

            if (this._defaultRoute == null) {
                this._defaultRoute = route;
                if (this._defaultRoute.viewPath == null)
                    throw new Error('default route require view path.');

                if (this._defaultRoute.actionPath == null)
                    throw new Error('default route require action path.');
            }

            route.viewPath = route.viewPath || this._defaultRoute.viewPath;
            route.actionPath = route.actionPath || this._defaultRoute.actionPath;

            return route;
        }

        getRouteData(url): RouteData {
            /// <returns type="Object"/>
            var data = this._source.getRouteData(url);
            if (data == null)
                throw e.canntParseUrl(url);

            var values: any = {};
            var paramNames = data.route._paramsIds || [];
            for (var i = 0; i < paramNames.length; i++) {
                var key = paramNames[i];
                values[key] = data.params[0][key];
            }

            var routeData = new RouteData(url);
            routeData.values(values);
            routeData.actionPath(data.route.newRoute.actionPath);
            routeData.viewPath(data.route.newRoute.viewPath);

            return routeData;
        }
    }
} ;module chitu {
    export class RouteData {
        private _values: any;
        private _viewPath: string;
        private _actionPath: string;
        private _pageName: string;
        private _url: string;

        constructor(url: string) {
            this._url = url;
        }

        public values(value: any = undefined): any {
            if (value !== undefined)
                this._values = value;

            return this._values;
        }

        public viewPath(value: string = undefined): string {
            if (value !== undefined)
                this._viewPath = value;

            return this._viewPath;
        }

        public actionPath(value: string = undefined): string {
            if (value !== undefined)
                this._actionPath = value;

            return this._actionPath;
        }

        public pageName(value: string = undefined): string {
            if (value !== undefined)
                this._pageName = value;

            return this._pageName;
        }

        public url(): string {
            return this._url;
        }
    }
};;module chitu {

    var e = chitu.Errors;
    var crossroads = window['crossroads'];

    function interpolate(pattern: string, data): string {
        var http_prefix = 'http://'.toLowerCase();
        if (pattern.substr(0, http_prefix.length).toLowerCase() == http_prefix) {
            var link = document.createElement('a');
            link.setAttribute('href', pattern);

            pattern = decodeURI(link.pathname);
            var route = crossroads.addRoute(pattern);
            return http_prefix + link.host + route.interpolate(data);
        }

        var route = crossroads.addRoute(pattern);
        return route.interpolate(data);
    }

    export class ViewFactory {
        _views: any[];

        constructor() {
            this._views = [];
        }

        view(routeData: RouteData) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="jQuery.Deferred"/>

            //if (typeof routeData !== 'object')
            //    throw e.paramTypeError('routeData', 'object');

            if (!routeData.values().controller)
                throw e.routeDataRequireController();

            if (!routeData.values().action)
                throw e.routeDataRequireAction();

            //var viewLocationFormater = routeData.viewPath;
            //if (!viewLocationFormater)
            //    return $.Deferred().resolve('');

            var url = interpolate(routeData.viewPath(), routeData.values());
            var self = this;
            var viewName = routeData.values().controller + '_' + routeData.values().action;
            if (!this._views[viewName]) {

                this._views[viewName] = $.Deferred();

                var http = 'http://';
                if (url.substr(0, http.length).toLowerCase() == http) {
                    //=======================================================
                    // 说明：不使用 require text 是因为加载远的 html 文件，会作
                    // 为 script 去解释而导致错误 
                    $.ajax({ url: url })
                        .done($.proxy(function (html) {
                        if (html != null)
                            this.deferred.resolve(html);
                        else
                            this.deferred.reject();
                    }, { deferred: this._views[viewName] }))

                        .fail($.proxy(function (err) {
                        this.deferred.reject(err);
                    }, { deferred: this._views[viewName] }));
                    //=======================================================
                }
                else {
                    requirejs(['text!' + url],
                        $.proxy(function (html) {
                            if (html != null)
                                this.deferred.resolve(html);
                            else
                                this.deferred.reject();
                        },
                            { deferred: this._views[viewName] }),

                        $.proxy(function (err) {
                            this.deferred.reject(err);
                        },
                            { deferred: this._views[viewName] })
                        );
                }
            }

            return this._views[viewName];

        }
    }
} ;module chitu {

    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;
    //var zindex = 500;
    var PAGE_STACK_MAX_SIZE = 10;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';

    export class Application {
        pageCreating: chitu.Callback = ns.Callbacks();
        pageCreated: chitu.Callback = ns.Callbacks();

        private page_stack: chitu.Page[] = [];

        private _routes: chitu.RouteCollection = new RouteCollection();
        private _container: HTMLElement|Function;
        private _runned: boolean = false;

        private zindex: number;

        controllerFactory: chitu.ControllerFactory = new chitu.ControllerFactory();
        viewFactory: chitu.ViewFactory = new chitu.ViewFactory();

        constructor(config: Object) {
            if (config == null)
                throw e.argumentNull('container');

            if (!config['container']) {
                throw new Error('The config has not a container property.');
            }

            if (!$.isFunction(config['container']) && !config['container'].tagName)
                throw new Error('Parameter container is not a function or html element.');

            this._container = config['container'];
        }

        on_pageCreating(context) {
            return ns.fireCallback(this.pageCreating, [this, context]);
        }
        on_pageCreated(page) {
            //this.pageCreated.fire(this, page);
            return ns.fireCallback(this.pageCreated, [this, page]);
        }
        public routes(): chitu.RouteCollection {
            return this._routes;
        }

        public controller(routeData: RouteData) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="chitu.Controller"/>
            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');

            if (!routeData)
                throw e.argumentNull('routeData');

            return this.controllerFactory.getController(routeData);
        }
        public currentPage(): chitu.Page {
            if (this.page_stack.length > 0)
                return this.page_stack[this.page_stack.length - 1];

            return null;
        }
        private previousPage(): chitu.Page {
            if (this.page_stack.length > 1)
                return this.page_stack[this.page_stack.length - 2];

            return null;
        }
        public action(routeData) {
            /// <param name="routeData" type="Object"/>
            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');

            if (!routeData)
                throw e.argumentNull('routeData');

            var controllerName = routeData.controller;
            if (!controllerName) throw e.argumentNull('name');
            if (typeof controllerName != 'string') throw e.routeDataRequireController();

            var actionName = routeData.action;
            if (!actionName) throw e.argumentNull('name');
            if (typeof actionName != 'string') throw e.routeDataRequireAction();

            var controller = this.controller(routeData);
            return controller.action(actionName);
        }

        hashchange(): any {
            var hash = window.location.hash;
            if (!hash) {
                u.log('The url is not contains hash.');
                return;
            }

            var current_page_url: string = '';
            if (this.previousPage() != null)
                current_page_url = this.previousPage().context().routeData().url();

            if (current_page_url.toLowerCase() == hash.substr(1).toLowerCase()) {
                this.closeCurrentPage();
            }
            else {
                var args = window.location['arguments'] || {};
                window.location['arguments'] = null;

                this.showPage(hash.substr(1), args);
            }

        }

        public run() {
            if (this._runned) return;

            var app = this;

            $.proxy(this.hashchange, this)();
            $(window).bind('hashchange', $.proxy(this.hashchange, this));

            this._runned = true;
        }
        public getCachePage(name: string): chitu.Page {
            for (var i = this.page_stack.length - 1; i >= 0; i--) {
                if (this.page_stack[i].name() == name)
                    return this.page_stack[i];
            }
            return null;
        }
        public showPage(url: string, args): JQueryDeferred<any> {
            /// <param name="container" type="HTMLElement" canBeNull="false"/>
            /// <param name="url" type="String" canBeNull="false"/>
            /// <param name="args" type="object" canBeNull="true"/>
            /// <returns type="jQuery.Deferred"/>

            args = args || {};

            if (!url) throw e.argumentNull('url');

            var routeData = this.routes().getRouteData(url);
            if (routeData == null) {
                throw e.noneRouteMatched(url);
            }

            var container: HTMLElement;
            if ($.isFunction(this._container)) {
                container = (<Function>this._container)(routeData.values());
                if (container == null)
                    throw new Error('The result of continer function cannt be null');
            }
            else {
                container = <HTMLElement>this._container;
            }

            var page = this._createPage(url, container, this.currentPage());
            this.page_stack.push(page);
            console.log('page_stack lenght:' + this.page_stack.length);
            if (this.page_stack.length > PAGE_STACK_MAX_SIZE) {
                var p = this.page_stack.shift();
                p.close();
            }

            $.extend(args, routeData.values());
            var result = $.Deferred();
            page.open(args)
                .done(() => {
                    result.resolve();
                })
                .fail((error) => {
                    result.reject(this, error);
                });

            return result;
        }
        protected createPageNode(): HTMLElement {
            var element = document.createElement('div');
            return element;
        }
        private closeCurrentPage() {
            var current = this.currentPage();
            var previous = this.previousPage();

            if (current != null) {
                current.close();

                if (previous != null)
                    previous.show();

                this.page_stack.pop();
                console.log('page_stack lenght:' + this.page_stack.length);
            }
        }
        private _createPage(url: string, container: HTMLElement, previous: chitu.Page) {
            if (!url)
                throw e.argumentNull('url');

            if (!container)
                throw e.argumentNull('element');

            var routeData = this.routes().getRouteData(url);
            if (routeData == null) {
                throw e.noneRouteMatched(url);
            }

            var controllerName = routeData.values().controller;
            var actionName = routeData.values().action;
            var controller = this.controller(routeData);
            var view_deferred = this.viewFactory.view(routeData); //this.application().viewEngineFactory.getViewEngine(controllerName).view(actionName, routeData.viewPath);
            var context = new ns.ControllerContext(controller, view_deferred, routeData);

            this.on_pageCreating(context);
            var page = new ns.Page(context, container, previous);
            this.on_pageCreated(page);
            return page;
        }
        public redirect(url: string, args = {}) {
            window.location['arguments'] = args;
            window.location.hash = url;
        }
        public back(args = undefined) {
            /// <returns type="jQuery.Deferred"/>
            if (window.history.length == 0)
                return $.Deferred().reject();

            window.history.back();
            return $.Deferred().resolve();
        }
    }
} 