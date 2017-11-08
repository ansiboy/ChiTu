interface ServiceError extends Error {
    method?: string
}

async function ajax<T>(url: string, options: RequestInit): Promise<T> {
    let response = await fetch(url, options);

    let responseText = response.text();
    let p: Promise<string>;
    if (typeof responseText == 'string') {
        p = new Promise<string>((reslove, reject) => {
            reslove(responseText);
        })
    }
    else {
        p = responseText as Promise<string>;
    }


    let text = await responseText;
    let textObject;
    let isJSONContextType = (response.headers.get('content-type') || '').indexOf('json') >= 0;
    if (isJSONContextType) {
        textObject = JSON.parse(text);
        textObject = travelJSON(textObject);
    }
    else {
        textObject = text;
    }


    if (response.status >= 300) {
        let err: ServiceError = new Error();
        err.method = options.method;
        err.name = `${response.status}`;
        err.message = isJSONContextType ? (textObject.Message || textObject.message) : textObject;
        err.message = err.message || response.statusText;

        throw err
    }

    return textObject;


    /**
     * 遍历 JSON 对象各个字段，将日期字符串转换为 Date 对象
     * @param result yao转换的 JSON 对象
     */
    function travelJSON(result: any) {
        const datePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
        if (typeof result === 'string' && result.match(this.datePattern)) {
            return new Date(result);
        }
        var stack = new Array();
        stack.push(result);
        while (stack.length > 0) {
            var item = stack.pop();
            for (var key in item) {
                var value = item[key];
                if (value == null)
                    continue;

                if (value instanceof Array) {
                    for (var i = 0; i < value.length; i++) {
                        stack.push(value[i]);
                    }
                    continue;
                }
                if (typeof value == 'object') {
                    stack.push(value);
                    continue;
                }
                if (typeof value == 'string' && value.match(datePattern)) {
                    item[key] = new Date(value);
                }
            }
        }
        return result;
    }
}

namespace chitu {
    export interface ServiceConstructor<T> {
        new(): T
    }

    export abstract class Service {

        error = Callbacks<Service, Error>();

        static settings = {
            ajaxTimeout: 30,
        }

        constructor() {
        }

        ajax<T>(url: string, options: RequestInit): Promise<T> {

            return new Promise<T>((reslove, reject) => {
                let timeId: number;
                if (options.method == 'get') {
                    timeId = setTimeout(() => {
                        let err = new Error(); //new AjaxError(options.method);
                        err.name = 'timeout';
                        err.message = '网络连接超时';
                        reject(err);
                        this.error.fire(this, err);
                        clearTimeout(timeId);

                    }, Service.settings.ajaxTimeout * 1000)
                }

                ajax<T>(url, options)
                    .then(data => {
                        reslove(data);
                        if (timeId)
                            clearTimeout(timeId);
                    })
                    .catch(err => {
                        reject(err);
                        this.error.fire(this, err);

                        if (timeId)
                            clearTimeout(timeId);
                    });

            })
        }


        getByJson<T>(url: string, data?: any) {

            console.assert(url.indexOf('?') < 0);

            if (data) {
                url = url + '?' + JSON.stringify(data);
            }

            return this.ajaxByJSON<T>(url, null, 'get');
        }
        postByJson<T>(url: string, data?: Object) {
            return this.ajaxByJSON<T>(url, data, 'post');
        }
        deleteByJson<T>(url: string, data?: Object) {
            return this.ajaxByJSON<T>(url, data, 'delete');
        }
        putByJson<T>(url: string, data?: Object) {
            return this.ajaxByJSON<T>(url, data, 'put');
        }

        get<T>(url: string, data?: any) {

            data = data || {};

            let urlParams = '';
            for (let key in data) {
                urlParams = urlParams + `&${key}=${data[key]}`;
            }

            console.assert(url.indexOf('?') < 0);
            if (urlParams)
                url = url + '?' + urlParams.substr(1);

            let options = {
                method: 'get',
            }
            return this.ajax<T>(url, options);
        }
        post<T>(url: string, data?) {
            return this.ajaxByForm<T>(url, data, 'post');
        }
        put<T>(url: string, data?) {
            return this.ajaxByForm<T>(url, data, 'put');
        }
        delete<T>(url: string, data?) {
            return this.ajaxByForm<T>(url, data, 'delete');
        }

        private ajaxByForm<T>(url: string, data: Object, method: string) {
            let headers = {};
            headers['content-type'] = 'application/x-www-form-urlencoded';

            let body = new URLSearchParams();
            for (let key in data) {
                body.append(key, data[key])
            }
            return this.ajax<T>(url, { headers, body, method });
        }
        private ajaxByJSON<T>(url: string, data: Object, method: string) {
            let headers = {};
            headers['content-type'] = 'application/json';
            let body: any;
            if (data)
                body = JSON.stringify(data);

            let options = {
                headers,
                body,
                method
            }
            return this.ajax<T>(url, options);
        }
    }
}