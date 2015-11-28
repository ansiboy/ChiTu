namespace chitu {
    export class ControllerContext {
        private _controller: any;
        private _view: any;
        private _routeData: RouteData;
        constructor(controller, view, routeData: RouteData) {
            this._routeData = routeData;
            this._controller = controller;
            this._view = view;
            this._routeData = routeData;
        }
        public controller(): chitu.Controller {
            /// <returns type="chitu.Controller"/>
            return this._controller;
        }
        public view() {
            /// <returns type="jQuery.Deferred"/>
            return this._view;
        }
        public routeData(): RouteData {
            /// <returns type="chitu.RouteData"/>
            return this._routeData;
        }
    }
}