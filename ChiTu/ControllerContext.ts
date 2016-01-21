
namespace chitu {
    export class PageContext {
        private _view: JQueryPromise<string>;
        private _routeData: RouteData;
        constructor(view: JQueryPromise<string>, routeData: RouteData) {
            this._view = view;
            this._routeData = routeData;
        }
        public view(): JQueryPromise<string> {
            return this._view;
        }
        public routeData(): RouteData {
            return this._routeData;
        }
    }
}
