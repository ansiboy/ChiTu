// namespace chitu {

//     export type PageViewArguemnts = { container: Page, routeData: RouteData, element: HTMLElement };
//     export interface PageViewConstructor {
//         new (args: PageViewArguemnts): Pageview;
//     }


//     export class Pageview {

//         private _name: string;
//         private _openResult: JQueryDeferred<any> = null;
//         private _hideResult = null;

//         private _routeData: RouteData;
//         private _pageContainer: Page;
//         private _viewHtml: string;
//         private _element: HTMLElement;

//         load = chitu.Callbacks<Pageview, any>();

//         closing = Callbacks<Pageview, any>();
//         closed = Callbacks<Pageview, any>();

//         hiding = Callbacks<Pageview, any>();
//         hidden = Callbacks<Pageview, any>();

//         constructor(args: PageViewArguemnts) {

//             if (args == null) throw Errors.argumentNull('args');

//             this._element = args.element;
//             this._pageContainer = args.container;
//             this._routeData = args.routeData;

//             $(this.element).data('page', this);

//             this._pageContainer.closing.add(() => this.on_closing(this.routeData.values));
//             this._pageContainer.closed.add(() => this.on_closed(this.routeData.values))
//         }

//         get element(): HTMLElement {
//             return this._element;
//         }

//         get routeData(): RouteData {
//             return this._routeData;
//         }
//         get name(): string {
//             if (!this._name)
//                 this._name = this.routeData.pageName;

//             return this._name;
//         }
//         get visible(): boolean {
//             return $(this.element).is(':visible');
//         }
//         get container(): Page {
//             return this._pageContainer;
//         }
//         hide() {
//             return this.container.hide();
//         }

//         on_load(args: Object): JQueryPromise<any> {
//             return this.fireEvent(this.load,args);
//         }

//         private fireEvent<A>(callback: chitu.Callback<Pageview, A>, args): JQueryPromise<any> {
//             return fireCallback(callback, this, args);
//         }

//         on_closing(args) {
//             return this.fireEvent(this.closing, args);
//         }
//         on_closed(args) {
//             return this.fireEvent(this.closed, args);
//         }

//         on_hiding(args) {
//             return this.fireEvent(this.hiding, args);
//         }
//         on_hidden(args) {
//             return this.fireEvent(this.hidden, args);
//         }
//     }
// };