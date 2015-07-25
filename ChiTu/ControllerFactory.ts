module chitu {
    var e = chitu.Errors;
    var ns = chitu;

    export class ControllerFactory {
        _controllers = {}
        _actionLocationFormater: any

        constructor(actionLocationFormater: string) {
            if (!actionLocationFormater)
                throw e.argumentNull('actionLocationFormater');

            this._controllers = {};
            this._actionLocationFormater = actionLocationFormater;
        }

        public controllers() {
            return this._controllers;
        }

        public createController(routeData) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="ns.Controller"/>
            if (!routeData.controller)
                throw e.routeDataRequireController();

            return new ns.Controller(routeData, routeData.actionPath || this.actionLocationFormater());
        }

        public actionLocationFormater() {
            return this._actionLocationFormater;
        }

        public getController(routeData) {
            /// <summary>Gets the controller by routeData.</summary>
            /// <param name="routeData" type="Object"/>
            /// <returns type="chitu.Controller"/>

            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');

            if (!routeData.controller)
                throw e.routeDataRequireController();

            if (!this._controllers[routeData.controller])
                this._controllers[routeData.controller] = this.createController(routeData);

            return this._controllers[routeData.controller];
        }
    }
} 