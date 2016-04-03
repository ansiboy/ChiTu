namespace chitu {
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
        public static format(source: string, ...params: string[]): string {
            for (var i = 0; i < params.length; i++) {
                source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function() {
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
        static loadjs(modules: string[]): JQueryPromise<any> {
            var deferred = $.Deferred();
            requirejs(modules, function() {
                //deferred.resolve(arguments);
                var args = [];
                for (var i = 0; i < arguments.length; i++)
                    args[i] = arguments[i];

                deferred.resolve.apply(deferred, args);
            });
            return deferred;
        }
    }

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

    export function createActionDeferred(routeData: chitu.RouteData): JQueryPromise<Action> {

        var actionName = routeData.values().action;
        if (!actionName)
            throw Errors.routeDataRequireAction();

        var url = interpolate(routeData.actionPath(), routeData.values()); //this.getLocation(actionName);
        var result = $.Deferred();
        requirejs([url],
            (obj) => {
                //加载脚本失败
                if (!obj) {
                    console.warn(chitu.Utility.format('加载活动“{1}.{0}”失败。', actionName, routeData.values().controller));
                    result.reject();
                    return;
                }

                var func = obj.func || obj;

                if (!$.isFunction(func))
                    throw Errors.modelFileExpecteFunction(actionName);

                var action = new Action(self, actionName, func);

                result.resolve(action);
            },

            (err) => result.reject(err)
        );

        return result;
    }

    export function createViewDeferred(routeData: RouteData): JQueryPromise<string> {
        if (!routeData.values().controller)
            throw Errors.routeDataRequireController();

        if (!routeData.values().action)
            throw Errors.routeDataRequireAction();

        var url = interpolate(routeData.viewPath(), routeData.values());
        var self = this;
        var result = $.Deferred();
        var http = 'http://';
        if (url.substr(0, http.length).toLowerCase() == http) {
            //=======================================================
            // 说明：不使用 require text 是因为加载远程的 html 文件，会作
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


