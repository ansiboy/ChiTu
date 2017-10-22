
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

    // export function fireCallback<S, A>(callback: Callback<S, A>, sender: S, args: A) {
    //     callback.fire(sender, args);
    // }



} 