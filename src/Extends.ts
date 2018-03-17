
namespace chitu {

    export class Callback {
        private funcs = new Array<(...args: Array<any>) => void>();

        constructor() {
        }

        add(func: (...args: Array<any>) => any) {
            this.funcs.push(func);
        }
        remove(func: (...args: Array<any>) => any) {
            this.funcs = this.funcs.filter(o => o != func);
        }
        fire(...args: Array<any>) {
            this.funcs.forEach(o => o(...args));
        }
    }

    export interface Callback1<S, A> extends Callback {
        add(func: (sender: S, arg: A) => any);
        remove(func: (sender: S, arg: A) => any);
        fire(sender: S, arg: A);
    }

    export interface Callback2<S, A, A1> extends Callback {
        add(func: (sender: S, arg: A, arg1: A1) => any);
        remove(func: (sender: S, arg: A, arg1: A1) => any);
        fire(sender: S, arg: A, arg1: A1);
    }

    export function Callbacks<S, A, A1>(): Callback2<S, A, A1>
    export function Callbacks<S, A>(): Callback1<S, A>
    export function Callbacks(): Callback {
        return new Callback();
    }
    // export function Callbacks1<S, A, A1>(): Callback2<S, A, A1> {
    //     return new Callback();
    // }

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