namespace chitu {
    export class Route {
        private _name: string;
        private _pattern: string;
        private _defaults: Object;

        viewPath: string;
        actionPath: string;

        constructor(name: string, pattern: string, defaults: Object) {
            this._name = name
            this._pattern = pattern;
            this._defaults = defaults;
        }
        public get name(): string {
            return this._name;
        }
        public get defaults(): Object {
            return this._defaults;
        }
        public get url(): string {
            return this._pattern;
        }
    }


}