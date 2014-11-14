(function (ns) {
    var e = ns.Error;
    ns.utility = {
        isType: function (type, obj) {
            /// <param name="type" type="Function"/>
            if (!type) throw e.argumentNull('type');
            if (!$.isFunction(type)) throw e.paramTypeError('type', 'Function');
            if (!obj) throw e.argumentNull('obj');

            for (var key in type.prototype) {
                if (obj[key] === undefined)
                    return false;
            }
            return true;
        },
        isDeferred: function (obj) {
            /// <param name="obj" type="Object"/>
            if (obj == null)
                return false;

            if (obj.pipe != null && obj.always != null && obj.done != null)
                return true;

            return false;
        },
        format: function (source, params) {
            if (arguments.length === 1) {
                return function () {
                    var args = $.makeArray(arguments);
                    args.unshift(source);
                    return $.validator.format.apply(this, args);
                };
            }
            if (arguments.length > 2 && params.constructor !== Array) {
                params = $.makeArray(arguments).slice(1);
            }
            if (params.constructor !== Array) {
                params = [params];
            }
            $.each(params, function (i, n) {
                source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function () {
                    return n;
                });
            });
            return source;
        },
        fileName: function (url, withExt) {
            /// <param name="url" type="String"/>
            /// <param name="withExt" type="Boolean" canBeNull="true">
            /// 表示返回的文件名是否包含扩展名，true表示包含，false表示不包含。默认值为true。
            /// </param>
            if (!url) throw e.argumentNull('url');
            withExt = withExt || true;

            url = url.replace('http://', '/');
            var filename = url.replace(/^.*[\\\/]/, '');
            if (withExt === true) {
                var arr = filename.split('.');
                filename = arr[0];
            }

            return filename;
        },
        log: function (msg, args) {
            if (!window.console) return;

            if (args == null) {
                console.log(msg);
                return;
            }
            var txt = this.format.apply(this, arguments);
            console.log(txt);
        }

    };
})(chitu);
