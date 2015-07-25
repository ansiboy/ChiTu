var chitu;
(function (chitu) {
    var e = chitu.Errors;
    var ns = chitu;
    var ControllerFactory = (function () {
        function ControllerFactory(actionLocationFormater) {
            this._controllers = {};
            if (!actionLocationFormater)
                throw e.argumentNull('actionLocationFormater');
            this._controllers = {};
            this._actionLocationFormater = actionLocationFormater;
        }
        ControllerFactory.prototype.controllers = function () {
            return this._controllers;
        };
        ControllerFactory.prototype.createController = function (routeData) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="ns.Controller"/>
            if (!routeData.controller)
                throw e.routeDataRequireController();
            return new ns.Controller(routeData, routeData.actionPath || this.actionLocationFormater());
        };
        ControllerFactory.prototype.actionLocationFormater = function () {
            return this._actionLocationFormater;
        };
        ControllerFactory.prototype.getController = function (routeData) {
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
        };
        return ControllerFactory;
    })();
    chitu.ControllerFactory = ControllerFactory;
})(chitu || (chitu = {}));
//# sourceMappingURL=ControllerFactory.js.map