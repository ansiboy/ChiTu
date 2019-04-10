

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
    add(func: (sender: S, arg: A) => any): void;
    remove(func: (sender: S, arg: A) => any): void;
    fire(sender: S, arg: A): void;
}

export interface Callback2<S, A, A1> extends Callback {
    add(func: (sender: S, arg: A, arg1: A1) => any): void;
    remove(func: (sender: S, arg: A, arg1: A1) => any): void;
    fire(sender: S, arg: A, arg1: A1): void;
}

export function Callbacks<S, A, A1>(): Callback2<S, A, A1>
export function Callbacks<S, A>(): Callback1<S, A>
export function Callbacks(): Callback {
    return new Callback();
}

//==========================================================
/** 实现数据的存储，以及数据修改的通知 */
export type ValueChangedCallback<T> = (args: T, sender: any) => void;
export class ValueStore<T> {
    private items = new Array<{ func: ValueChangedCallback<T | null>, sender: any }>();
    private _value: T | null;

    constructor(value?: T) {
        this._value = value === undefined ? null : value;
    }
    add(func: ValueChangedCallback<T | null>, sender?: any): ValueChangedCallback<T> {
        this.items.push({ func, sender });
        return func;
    }
    remove(func: ValueChangedCallback<T>) {
        this.items = this.items.filter(o => o.func != func);
    }
    fire(value: T | null) {
        this.items.forEach(o => o.func(value, o.sender));
    }
    get value(): T | null {
        if (this._value === undefined)
            return null

        return this._value;
    }
    set value(value: T | null) {
        this._value = value;
        this.fire(value);
    }
}

    // /**
    //  * 使用 requirejs 加载 JS
    //  * @param path JS 路径
    //  */
    // export function loadjs(path: string): Promise<any> {
    //     return new Promise<Array<any>>((reslove, reject) => {
    //         require([path],
    //             function (result: any) {
    //                 reslove(result);
    //             },
    //             function (err: Error) {
    //                 reject(err);
    //             });
    //     });
    // }