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
        static loadjs(...modules: string[]): Promise<any> {
            return new Promise((reslove, reject) => {
                requirejs(modules, function () {
                    var args = [];
                    for (var i = 0; i < arguments.length; i++)
                        args[i] = arguments[i];

                    reslove.apply({}, args);
                });
            });
        }
    }

    export function extend(obj1, obj2) {
        if (obj1 == null) throw Errors.argumentNull('obj1');
        if (obj2 == null) throw Errors.argumentNull('obj2');
        for (let key in obj2) {
            obj1[key] = obj2[key];
        }
        return obj1;
    }

    export function combinePath(path1: string, path2: string): string {
        if (!path1) throw Errors.argumentNull('path1');
        if (!path2) throw Errors.argumentNull('path2');

        path1 = path1.trim();
        if (!path1.endsWith('/'))
            path1 = path1 + '/';

        return path1 + path2;
    }


}


