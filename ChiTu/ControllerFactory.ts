module chitu {
    var e = chitu.Errors;
    var ns = chitu;

    export class ControllerFactory {
        _controllers = {}
        _actionLocationFormater: any

        constructor() {
            //if (!actionLocationFormater)
            //    throw e.argumentNull('actionLocationFormater');

            this._controllers = {};
            //this._actionLocationFormater = actionLocationFormater;
        }

        public controllers() {
            return this._controllers;
        }

        public createController(name: string) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="ns.Controller"/>
            //if (!routeData.values().controller)
            //    throw e.routeDataRequireController();

            return new ns.Controller(name);
        }

        public actionLocationFormater() {
            return this._actionLocationFormater;
        }

        public getController(routeData: RouteData) {
            /// <summary>Gets the controller by routeData.</summary>
            /// <param name="routeData" type="Object"/>
            /// <returns type="chitu.Controller"/>

            //if (typeof routeData !== 'object')
            //    throw e.paramTypeError('routeData', 'object');

            if (!routeData.values().controller)
                throw e.routeDataRequireController();

            if (!this._controllers[routeData.values().controller])
                this._controllers[routeData.values().controller] = this.createController(routeData.values().controller);

            return this._controllers[routeData.values().controller];
        }
    }
} 