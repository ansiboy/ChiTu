module chitu {

    var e = chitu.Errors;
    var crossroads = window['crossroads'];

    function interpolate(pattern, data) {
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
        _viewLocationFormater: string;
        _views: any[];

        constructor(viewLocationFormater) {
            this._viewLocationFormater = viewLocationFormater;
            this._views = [];
        }

        view(routeData) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="jQuery.Deferred"/>

            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');

            if (!routeData.controller)
                throw e.routeDataRequireController();

            if (!routeData.action)
                throw e.routeDataRequireAction();

            var viewLocationFormater = this._viewLocationFormater || routeData.viewPath;
            if (!viewLocationFormater)
                return $.Deferred().resolve('');

            var url = interpolate(routeData.viewPath || viewLocationFormater, routeData);
            var self = this;
            var viewName = routeData.controller + '_' + routeData.action;
            if (!this._views[viewName]) {

                this._views[viewName] = $.Deferred();

                require(['text!' + url],
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

            return this._views[viewName];

        }
    }
} 