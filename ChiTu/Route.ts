module chitu {
    export class Route {
        private _name: string;
        private _pattern: string;
        private _defaults: Object;

        public viewPath: string;
        public actionPath: string;
        public pageName: string

        constructor(name: string, pattern: string, defaults: Object) {
            this._name = name
            this._pattern = pattern;
            this._defaults = defaults;
        }
        public name(): string {
            return this._name;
        }
        public defaults(): Object {
            return this._defaults;
        }
        public url(): string {
            return this._pattern;
        }
    }


} 