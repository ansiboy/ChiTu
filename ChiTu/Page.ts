module chitu {
    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;

    function eventDeferred(callback, sender, args = {}) {
        return chitu.fireCallback(callback, [sender, args]);
    };

    export class Page {

        _context: chitu.ControllerContext;
        _name: string;
        _viewDeferred: any;
        _actionDeferred: any;
        _parent;
        _node = HTMLElement;
        _visible = true;
        _loadViewModelResult = null;
        _showResult = null;
        _hideResult = null;

        created = ns.Callbacks();
        creating = ns.Callbacks();
        preLoad = ns.Callbacks();
        load = ns.Callbacks();
        closing = ns.Callbacks();
        closed = ns.Callbacks();
        scroll = ns.Callbacks();
        showing = ns.Callbacks();
        shown = ns.Callbacks();
        hiding = ns.Callbacks();
        hidden = ns.Callbacks();

        constructor(context: chitu.ControllerContext, node) {
            if (!context) throw e.argumentNull('context');
            //if (context['_type'] != 'ControllerContext') throw e.paramTypeError('context', 'ControllerContext');
            if (!node) throw e.argumentNull('node');

            this._context = context;
            var controllerName = context.routeData().controller;
            var actionName = context.routeData().action;
            var name = controllerName + '.' + actionName;
            var viewDeferred = context.view(); //app.viewEngineFactory.getViewEngine(controllerName).view(actionName);
            var actionDeferred = context.controller().action(actionName);

            this.init(name, viewDeferred, actionDeferred, node);
        }

        _type: string = 'Page'

        context() {
            /// <returns type="chitu.ControllerContext"/>
            return this._context;
        }
        name() {
            return this._name;
        }
        node() {
            /// <returns type="HTMLElement"/>
            return this._node;
        }
        parent() {
            /// <returns type="chitu.Page"/>
            return this._parent;
        }
        visible(value) {
            var is_visible = $(this.node()).is(':visible');
            if (value === undefined)
                return is_visible; //this._visible;

            if (value == is_visible)
                return;

            if (!value) {
                this.on_hiding({});
                $(this.node()).hide();
                this.on_hidden({});
            }
            else {
                this.on_showing({});
                $(this.node()).show();
                this.on_shown({});
            }

            this._visible = value;
        }
        private init(name, viewDeferred, actionDeferred, node) {
            if (!name) throw e.argumentNull('name');
            if (!viewDeferred) throw e.argumentNull('viewDeferred');
            if (!actionDeferred) throw e.argumentNull('actionDeferred')
            if (!node) throw e.argumentNull('node');

            this._name = name;
            this._viewDeferred = viewDeferred;
            this._actionDeferred = actionDeferred;
            this._parent;
            this._node = node;
            this._visible = true;
            $(this._node).hide();
        }
        on_creating(context) {
            return eventDeferred(this.creating, this, context);
        }
        on_created() {
            return eventDeferred(this.created, this);
        }
        on_preLoad(args) {
            return eventDeferred(this.preLoad, this, args);
        }
        on_load(args) {
            return eventDeferred(this.load, this, args);
        }
        on_closing(args) {
            return eventDeferred(this.closing, this, args);
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
        _appendNode(childNode) {
            /// <param name="childNode" type="HTMLElement"/>
            if (childNode == null)
                throw e.argumentNull('childNode');

            $(this._node).append(childNode);
        }
        _loadViewModel() {

            if (this._loadViewModelResult)
                return this._loadViewModelResult;

            var page = this;
            this._loadViewModelResult = this._viewDeferred.pipe(function (html) {
                u.log('Load view success, page:{0}.', [page['_name']]);
                $(page.node()).html(html);
                return page._actionDeferred;
            })
                .pipe(function (action) {
                    /// <param name="action" type="chitu.Action"/>
                    var result = action.execute(page);
                    page.on_created();
                    if (u.isDeferred(result))
                        return result;

                    return $.Deferred().resolve();
                })
                .fail(function () {
                    page._loadViewModelResult = null;
                    u.log('Load view or action fail, page：{0}.', [page['_name']]);
                });

            return this._loadViewModelResult;
        }
        open(args) {
            /// <summary>
            /// Show the page.
            /// </summary>
            /// <param name="args" type="Object">
            /// The value passed to the show event functions.
            /// </param>
            /// <returns type="jQuery.Deferred"/>

            var self = this;
            this._showResult = this.on_preLoad(args).pipe(function () {
                return self._loadViewModel();
            })
                .pipe(function () {
                    self.on_showing(args);
                    return self.on_load(args);
                });

            this._showResult.done($.proxy(function () {
                self._hideResult = null;
                $(self.node()).show();
                self.on_shown(this.args);
            },
                { args: args }));

            return this._showResult;
        }
        close(args) {
            /// <summary>
            /// Hide the page.
            /// </summary>
            /// <param name="args" type="Object" canBeNull="true">
            /// The value passed to the hide event functions.
            /// </param>
            /// <returns type="jQuery.Deferred"/>

            var self = this;
            if (!this._hideResult) {
                this._hideResult = self.on_closing(args).pipe(function () {
                    self.visible(false);
                    return self.on_closed(args);
                });
            }

            return this._hideResult.always(function () {
                self._hideResult = null;
            });
        }
    }
} 