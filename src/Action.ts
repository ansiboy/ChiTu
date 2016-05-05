
namespace chitu {

    var e = chitu.Errors;
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

        execute(page: chitu.Page, args: Array<any>) {
            if (!page) throw e.argumentNull('page');
            var result = this._handle.apply({}, [page].concat(args));
            return chitu.Utility.isDeferred(result) ? result : $.Deferred().resolve();
        }
    }

    export function createActionDeferred(pageInfo: PageInfo): JQueryPromise<ObjectConstructor> {

        // var actionName = routeData.values().action;
        // if (!actionName)
        //     throw e.routeDataRequireAction();
        var url = pageInfo.actionPath; //interpolate(routeData.actionPath(), routeData.values()); //this.getLocation(actionName);
        var result = $.Deferred();
        requirejs([url],
            (Type) => {
                //加载脚本失败
                if (!Type) {
                    console.warn(chitu.Utility.format('加载活动“{0}”失败。', pageInfo.pageName));
                    result.reject();
                    return;
                }

                // var func = obj.func || obj;

                if (!$.isFunction(Type))
                    throw chitu.Errors.modelFileExpecteFunction(pageInfo.pageName);

                // var action = new Action(self, actionName, func);

                result.resolve(Type);
            },

            (err) => result.reject(err)
        );

        return result;
    }

    export function createViewDeferred(pageInfo: PageInfo): JQueryPromise<string> {
        // if (!routeData.values().controller)
        //     throw e.routeDataRequireController();

        // if (!routeData.values().action)
        //     throw e.routeDataRequireAction();

        var url = pageInfo.viewPath; //interpolate(routeData.viewPath(), routeData.values());
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