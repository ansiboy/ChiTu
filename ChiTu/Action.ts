namespace chitu {

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

    export class Action {
        private _name: any
        private _handle: any

        constructor(controller, name, handle) {
            /// <param name="controller" type="chitu.Controller"/>
            /// <param name="name" type="String">Name of the action.</param>
            /// <param name="handle" type="Function"/>

            if (!controller) throw chitu.Errors.argumentNull('controller');
            if (!name) throw chitu.Errors.argumentNull('name');
            if (!handle) throw chitu.Errors.argumentNull('handle');
            if (!$.isFunction(handle)) throw chitu.Errors.paramTypeError('handle', 'Function');

            this._name = name;
            this._handle = handle;
        }

        name() {
            return this._name;
        }

        execute(page: chitu.Page) {
            if (!page) throw e.argumentNull('page');

            var result = this._handle.apply({}, [page]);
            return chitu.Utility.isDeferred(result) ? result : $.Deferred().resolve();
        }
    }

    export function createActionDeferred(routeData: chitu.RouteData): JQueryPromise<Action> {

        var actionName = routeData.values().action;
        if (!actionName)
            throw e.routeDataRequireAction();

        var url = interpolate(routeData.actionPath(), routeData.values()); //this.getLocation(actionName);
        var result = $.Deferred();
        requirejs([url],
            (obj) => {
                //加载脚本失败
                if (!obj) {
                    console.warn(chitu.Utility.format('加载活动“{1}.{0}”失败。', actionName, routeData.values().controller));
                    result.reject();
                }

                var func = obj.func || obj;

                if (!$.isFunction(func))
                    throw chitu.Errors.modelFileExpecteFunction(actionName);

                var action = new Action(self, actionName, func);

                result.resolve(action);
            },

            (err) => result.reject(err)
        );

        return result;
    }

    export function createViewDeferred(routeData: RouteData): JQueryPromise<string> {
        if (!routeData.values().controller)
            throw e.routeDataRequireController();

        if (!routeData.values().action)
            throw e.routeDataRequireAction();

        var url = interpolate(routeData.viewPath(), routeData.values());
        var self = this;
        var result = $.Deferred();
        var http = 'http://';
        if (url.substr(0, http.length).toLowerCase() == http) {
            //=======================================================
            // 说明：不使用 require text 是因为加载远的 html 文件，会作
            // 为 script 去解释而导致错误 
            $.ajax({ url: url })
                .done((html) => {
                    if (html != null)
                        result.resolve(html);
                    else
                        result.reject();
                })
                .fail((err) => result.reject(err));
            //=======================================================
        }
        else {
            requirejs(['text!' + url],
                (html) => {
                    if (html != null)
                        result.resolve(html);
                    else
                        result.reject();
                },
                (err) => result.reject(err));
        }

        return result;
    }
}
