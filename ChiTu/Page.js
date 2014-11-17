(function (ns) {

    var u = chitu.utility;
    var e = chitu.Error;

    function eventDeferred(callback, sender, args) {
        return chitu.fireCallback(callback, [sender, args]);
    };

    ns.Page = function (context, node) {
        /// <param name="context" type="chitu.ControllerContext"/>
        /// <param name="app" type="chitu.Application" canBeNull="false"/>
        /// <param name="controllerName" type="String" canBeNull="false"/>
        /// <param name="actionName" type="String" canBeNull="false"/>
        /// <param name="node" type="HTMLElement" canBeNull="false"/>

        if (!context) throw e.argumentNull('context');
        if (context._type != 'ControllerContext') throw e.paramTypeError('context', 'ControllerContext');
        if (!node) throw e.argumentNull('node');

        //=================== 事件 =======================
        //this.creating = ns.Callbacks();
        this.created = ns.Callbacks();
        this.preLoad = ns.Callbacks();
        this.load = ns.Callbacks();
        this.closing = ns.Callbacks();
        this.closed = ns.Callbacks();
        this.scroll = ns.Callbacks();
        this.showing = ns.Callbacks();
        this.shown = ns.Callbacks();
        this.hiding = ns.Callbacks();
        this.hidden = ns.Callbacks();
        //================================================

        //this.on_creating(this, context);

        this._context = context;
        var controllerName = context.routeData().values().controller;
        var actionName = context.routeData().values().action;
        var name = controllerName + '.' + actionName;
        var viewDeferred = context.view(); //app.viewEngineFactory.getViewEngine(controllerName).view(actionName);
        var actionDeferred = context.controller().action(actionName);

        this.init(name, viewDeferred, actionDeferred, node);
    };

    ns.Page.prototype = {
        _type: 'Page',
        context: function () {
            /// <returns type="chitu.ControllerContext"/>
            return this._context;
        },
        name: function () {
            return this._name;
        },
        node: function () {
            /// <returns type="HTMLElement"/>
            return this._node;
        },
        parent: function () {
            /// <returns type="chitu.Page"/>
            return this._parent;
        },
        visible: function (value) {
            if (value === undefined)
                return this._visible;

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
        },
        init: function (name, viewDeferred, actionDeferred, node) {
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
        },
        on_creating: function (context) {
            return eventDeferred(this.creating, this, context);
        },
        on_created: function () {
            return eventDeferred(this.created, this);
        },
        on_preLoad: function (args) {
            return eventDeferred(this.preLoad, this, args);
        },
        on_load: function (args) {
            return eventDeferred(this.load, this, args);
        },
        on_closing: function (args) {
            return eventDeferred(this.closing, this, args);
        },
        on_closed: function (args) {
            return eventDeferred(this.closed, this, args);
        },
        on_scroll: function (event) {
            return eventDeferred(this.scroll, this, event);
        },
        on_showing: function (args) {
            return eventDeferred(this.showing, this, args);
        },
        on_shown: function (args) {
            return eventDeferred(this.shown, this, args);
        },
        on_hiding: function (args) {
            return eventDeferred(this.hiding, this, args);
        },
        on_hidden: function (args) {
            return eventDeferred(this.hidden, this, args);
        },
        _nodeOriginalVisible: [],
        _appendNode: function (childNode) {
            /// <param name="childNode" type="HTMLElement"/>
            if (childNode == null)
                throw e.argumentNull('childNode');

            $(this._node).append(childNode);
        },
        _bindModel: function (model) {
            if (!ko) {
                u.log('The knockout js is not loaded.');
                return;
            }

            if (!model) throw e.argumentNull('model');

            ko.cleanNode(this.node());
            ko.applyBindings(model, this.node());
        },
        _loadViewModel: function () {

            if (this._loadViewModelResult)
                return this._loadViewModelResult;

            var page = this;
            this._loadViewModelResult = this._viewDeferred.pipe(function (html) {
                u.log('Load view success, page:{0}.', page._name);
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
                u.log('Load view or action fail, page：{0}.', page._name);
            });

            return this._loadViewModelResult;
        },
        open: function (args) {
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
        },
        close: function (args) {
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
        },
        model: function (value) {
            /// <param name="value" type="Object"/>
            /// <returns type="Object"/>
            if (value === undefined)
                return this._model;

            this._model = value;
            this._bindModel(this._model);
        }
    };

})(chitu);