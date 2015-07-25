module chitu {
    export class ControllerContext {
        _controller: any;
        _view: any;
        _routeData: any;
        constructor(controller, view, routeData) {
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
        public routeData() {
            /// <returns type="chitu.RouteData"/>
            return this._routeData;
        }
    }
}