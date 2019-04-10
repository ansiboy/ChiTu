export { Service, Callback, ValueStore, Callback0, Callback1, Callback2, IService } from 'maishu-chitu-service';
export interface ServiceConstructor<T> {
    new (): T;
}
