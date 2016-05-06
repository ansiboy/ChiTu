
namespace chitu {

    var e = chitu.Errors;
    export class Action {
        private _name: any
        private _handle: any

        constructor(controller, name, handle) {
            /// <param name="controller" type="chitu.Controller"/>
            /// <param name="name" type="String">Name of the action.</param>
            /// <param name="handle" type="Function"/>

            if (!controller) throw chitu.Errors.argumentNull('controller');
            if (!name) throw chitu.Errors.argumentNull('name');
            if (!handle) throw chitu.Errors.argumentNull('handle');
            if (!$.isFunction(handle)) throw chitu.Errors.paramTypeError('handle', 'Function');

            this._name = name;
            this._handle = handle;
        }

        name() {
            return this._name;
        }

        execute(page: chitu.Page, args: Array<any>) {
            if (!page) throw e.argumentNull('page');
            var result = this._handle.apply({}, [page].concat(args));
            return chitu.Utility.isDeferred(result) ? result : $.Deferred().resolve();
        }
    }

   
}