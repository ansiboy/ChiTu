
namespace chitu {

    export class Callback<S> {
        private event: CustomEvent;
        private element: HTMLElement;
        private event_name = 'chitu-event';

        constructor() {
            this.event = document.createEvent('CustomEvent');
            this.element = document.createElement('div');
        }
        add(func: (sender: S, ...args: Array<any>) => any) {
            this.element.addEventListener(this.event_name, (event: CustomEvent) => {
                const sender = event.detail.sender;
                const args = event.detail.args;
                func(sender, ...args);
            });
        }
        remove(func: EventListener) {
            this.element.removeEventListener(this.event_name, func);
        }
        fire(args: any) {
            this.event.initCustomEvent(this.event_name, true, false, args);
            this.element.dispatchEvent(this.event);
        }
    }


    export function Callbacks<S>(): Callback<S> {
        return new Callback<S>();
    }

    export function fireCallback<S>(callback: Callback<S>, sender: S, ...args: Array<any>) {
        callback.fire({ sender, args });
    }



} 