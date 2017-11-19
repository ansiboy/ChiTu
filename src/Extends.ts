
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
    export type ValueChangedCallback<T> = (args: T, sender: any) => void;
    export class ValueStore<T> {
        private items = new Array<{ func: ValueChangedCallback<T>, sender: any }>();
        private _value: T;

        constructor(value?: T) {
            this._value = value;
        }
        add(func: ValueChangedCallback<T>, sender?: any): ValueChangedCallback<T> {
            this.items.push({ func, sender });
            return func;
        }
        remove(func: ValueChangedCallback<T>) {
            this.items = this.items.filter(o => o.func != func);
        }
        fire(value: T) {
            this.items.forEach(o => o.func(value, o.sender));
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