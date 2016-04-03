
namespace chitu {

    export class Action {
        private _name: any
        private _handle: any

        constructor(controller, name, handle) {
            /// <param name="controller" type="chitu.Controller"/>
            /// <param name="name" type="String">Name of the action.</param>
            /// <param name="handle" type="Function"/>

            if (!controller) throw Errors.argumentNull('controller');
            if (!name) throw Errors.argumentNull('name');
            if (!handle) throw Errors.argumentNull('handle');
            if (!$.isFunction(handle)) throw Errors.paramTypeError('handle', 'Function');

            this._name = name;
            this._handle = handle;
        }

        get name() {
            return this._name;
        }

        execute(page: chitu.Page, args: Array<any>) {
            if (!page) throw Errors.argumentNull('page');
            var result = this._handle.apply({}, [page].concat(args));
            return chitu.Utility.isDeferred(result) ? result : $.Deferred().resolve();
        }
    }


}