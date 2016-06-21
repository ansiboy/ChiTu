interface crossroads {
    create();
    addRoute(name: String): any,
    NORM_AS_OBJECT: Function
}
declare module 'crossroads' {
    export = crossroads;
}
declare var crossroads: crossroads;