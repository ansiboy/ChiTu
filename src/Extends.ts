
namespace chitu {

    export class Callback<S, A> {
        private funcs = new Array<(ender: S, args: A) => void>();

        constructor() {
        }
        add(func: (sender: S, args: A) => any) {
            this.funcs.push(func);
        }
        remove(func: (sender: S, args: A) => any) {
            this.funcs = this.funcs.filter(o => o != func);
        }
        fire(sender: S, args: A) {
            this.funcs.forEach(o => o(sender, args));
        }
    }


    export function Callbacks<S, A>(): Callback<S, A> {
        return new Callback<S, A>();
    }

    // 服务以及实体类模块 结束
    //==========================================================

    /** 实现数据的存储，以及数据修改的通知 */
    export class ValueStore<T> {
        private funcs = new Array<(args: T) => void>();
        private _value: T;

        constructor(value?: T) {
            this._value = value;
        }
        add(func: (value: T) => any): (args: T) => any {
            this.funcs.push(func);
            return func;
        }
        remove(func: (value: T) => any) {
            this.funcs = this.funcs.filter(o => o != func);
        }
        fire(value: T) {
            this.funcs.forEach(o => o(value));
        }
        get value(): T {
            return this._value;
        }
        set value(value: T) {
            this._value = value;
            this.fire(value);
        }
    }
} 