
namespace chitu {
    export class ControllerContext {
        private _controller: chitu.Controller;
        private _view: JQueryPromise<string>;
        private _routeData: RouteData;
        constructor(controller: chitu.Controller, view: JQueryPromise<string>, routeData: RouteData) {
            this._routeData = routeData;
            this._controller = controller;
            this._view = view;
            this._routeData = routeData;
        }
        public controller(): chitu.Controller {
            /// <returns type="chitu.Controller"/>
            return this._controller;
        }
        public view(): JQueryPromise<string> {
            /// <returns type="jQuery.Deferred"/>
            return this._view;
        }
        public routeData(): RouteData {
            /// <returns type="chitu.RouteData"/>
            return this._routeData;
        }
    }
}
