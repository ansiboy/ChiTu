import { Service, Callback1 } from 'maishu-chitu-service';
export { Service, Callback, ValueStore, Callback0, Callback1, Callback2 } from 'maishu-chitu-service';
export interface ServiceConstructor<T> {
    new (): T;
}
export interface IService {
    error: Callback1<Service, Error>;
}
