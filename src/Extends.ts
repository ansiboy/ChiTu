
namespace chitu {

    export class Callback<S, A> {
        private event: CustomEvent;
        private element: HTMLElement;
        private event_name = 'chitu-event';

        constructor() {
            this.event = document.createEvent('CustomEvent');
            this.element = document.createElement('div');
        }
        add(func: (sender: S, args: A) => any) {
            this.element.addEventListener(this.event_name, (event: CustomEvent) => {
                let { sender, args } = event.detail;
                func(sender, args);
            });
        }
        remove(func: EventListener) {
            this.element.removeEventListener(this.event_name, func);
        }
        fire(sender: S, args: A) {
            this.event.initCustomEvent(this.event_name, true, false, { sender, args });
            this.element.dispatchEvent(this.event);
        }
    }


    export function Callbacks<S, A>(): Callback<S, A> {
        return new Callback<S, A>();
    }

    export function fireCallback<S, A>(callback: Callback<S, A>, sender: S, args: A) {
        callback.fire(sender, args);
    }



} 