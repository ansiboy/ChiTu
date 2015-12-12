namespace chitu {
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


        public actionLocationFormater() {
            return this._actionLocationFormater;
        }


    }
} 