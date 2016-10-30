namespace chitu {

    // export class ControlCollection {
    //     private parent: Control;
    //     private items: Array<Control>;

    //     constructor(parent: Control) {
    //         this.parent = parent;
    //         this.items = [];
    //     }
    //     add(control: Control) {
    //         if (control == null)
    //             throw Errors.argumentNull('control');

    //         this[this.length] = this.items[this.items.length] = control;
    //         control.parent = this.parent;
    //     }
    //     get length(): number {
    //         return this.items.length;
    //     }
    //     item(indexOrName: number | string) {
    //         if (typeof (indexOrName) == 'number')
    //             return this.items[indexOrName];

    //         var name = <string>indexOrName;
    //         for (var i = 0; i < this.items.length; i++) {
    //             if (this.items[i].name == name)
    //                 return this.items[i];
    //         }

    //         return null;
    //     }
    // }

    // export class Control {
    //     private _element: HTMLElement;
    //     private _children = new ControlCollection(this);;
    //     private static ControlTags = {};
    //     private _parent: Control;

    //     protected _name: string;

    //     load = chitu.Callbacks<Control, any>();

    //     constructor(element: HTMLElement) {

    //         if (element == null) throw Errors.argumentNull('element');

    //         this._element = element;
    //         //this._parent = parent;
    //         this._name = $(element).attr('name');
    //         this.createChildren(element, this);

    //         $(element).data('control', this);
    //     }

    //     private createChildren(element: HTMLElement, parent: Control) {

    //         for (var i = 0; i < element.childNodes.length; i++) {
    //             if (element.childNodes[i].nodeType != 1)
    //                 continue;

    //             var child_control = this.createChild(<HTMLElement>element.childNodes[i], parent);
    //             if (child_control == null)
    //                 continue;

    //             this.children.add(child_control);
    //         }
    //     }

    //     protected createChild(element: HTMLElement, parent: Control) {
    //         var child_control = Control.createControl(element);
    //         if (child_control)
    //             child_control._parent = parent;

    //         return child_control;
    //     }

    //     get visible(): boolean {
    //         var display = this.element.style.display;
    //         return display != 'none';
    //     }
    //     set visible(value: boolean) {
    //         if (value == true)
    //             this.element.style.display = 'block';
    //         else
    //             this.element.style.display = 'none';
    //     }
    //     get element(): HTMLElement {
    //         return this._element;
    //     }
    //     get children(): ControlCollection {
    //         return this._children;
    //     }
    //     get name(): string {
    //         return this._name;
    //     }
    //     get parent(): Control {
    //         return this._parent;
    //     }

    //     on_load(args: Object): JQueryPromise<any> {
    //         var promises = new Array<JQueryPromise<any>>();
    //         promises.push(fireCallback(this.load, this, args));
    //         for (var i = 0; i < this.children.length; i++) {
    //             var promise = this.children.item(i).on_load(args);
    //             if (chitu.Utility.isDeferred(promise))
    //                 promises.push(promise);
    //         }
    //         var result = $.when.apply($, promises);
    //         return result;
    //     }
    //     static register(tagName: string, createControlMethod: (new (element: HTMLElement, page: Page) => Control) | ((element: HTMLElement, page: Page) => Control)) {
    //         Control.ControlTags[tagName] = createControlMethod;
    //     }
    //     static createControl(element: HTMLElement) {
    //         if (element == null) throw Errors.argumentNull('element');
    //         //if (page == null) throw Errors.argumentNull('page');

    //         var tagName: string = element.tagName;
    //         var createControlMethod = Control.ControlTags[tagName];
    //         if (createControlMethod == null)
    //             return null;

    //         var instance: Control;
    //         if (createControlMethod.prototype != null)
    //             instance = new createControlMethod(element);
    //         else
    //             instance = createControlMethod(element);

    //         return instance;
    //     }
    // }

    // export class PageHeader extends Control {
    //     constructor(element: HTMLElement, page: Page) {
    //         super(element);
    //     }
    // }

    // export class PageFooter extends Control {
    //     constructor(element: HTMLElement, page: Page) {
    //         super(element);
    //     }
    // }

    // export interface ScrollArguments {
    //     scrollTop?: number
    //     scrollHeight?: number
    //     clientHeight?: number
    // }

    // export class ScrollView extends Control {

    //     scroll: Callback<ScrollView, ScrollArguments> = Callbacks<ScrollView, ScrollArguments>();
    //     scrollEnd: Callback<ScrollView, ScrollArguments> = Callbacks<ScrollView, ScrollArguments>();

    //     constructor(element: HTMLElement) {
    //         super(element);
    //     }

    //     // on_load(args) {
    //     //     var result: JQueryPromise<any>;
    //     //     if (result != null) {
    //     //         result = $.when(result, super.on_load(args));
    //     //     }
    //     //     else {
    //     //         result = super.on_load(args);
    //     //     }

    //     //     return result;
    //     // }

    //     protected on_scrollEnd(args: ScrollArguments) {
    //         return fireCallback(this.scrollEnd, this, args);
    //     }

    //     protected on_scroll(args: ScrollArguments) {
    //         return fireCallback(this.scroll, this, args);
    //     }

    //     static createInstance(element: HTMLElement, page: Page): ScrollView {
    //         let scrollType = $(element).attr('scroll-type');
    //         if (scrollType != null) {
    //             if (scrollType == scroll_types.doc) {
    //                 return new DocumentScrollView(element);
    //             }
    //             else if (scrollType == scroll_types.iscroll) {
    //                 return new IScrollView(element, page);
    //             }
    //             else {
    //                 return new DocumentScrollView(element);
    //             }
    //         }

    //         if (Environment.isAndroid && Environment.isWeiXin)
    //             return new DocumentScrollView(element);

    //         if (Environment.isIOS || (Environment.isAndroid && Environment.osVersion >= 5))
    //             return new DivScrollView(element);

    //         return new DocumentScrollView(element);
    //     }

    //     /**
    //      * 是否禁用滚动，true 禁用，false 否。
    //      */
    //     disabled: boolean;
    // }

    // class DocumentScrollView extends ScrollView {
    //     private cur_scroll_args: ScrollArguments = {};
    //     private checking_num: number;
    //     private pre_scroll_top: number;
    //     private CHECK_INTERVAL = 300;

    //     constructor(element: HTMLElement) {

    //         super(element);
    //         $(element).attr('scroll-type', scroll_types.doc);

    //         $(document).scroll((event) => {

    //             this.cur_scroll_args.clientHeight = $(window).height();
    //             this.cur_scroll_args.scrollHeight = document.body.scrollHeight;
    //             this.cur_scroll_args.scrollTop = $(document).scrollTop();
    //             this.scrollEndCheck();
    //         });
    //     }

    //     private static createElement(html: string, page: Page): HTMLElement {
    //         var element = document.createElement('div');
    //         element.innerHTML = html;
    //         page.element.appendChild(element);
    //         return element;
    //     }

    //     private scrollEndCheck() {
    //         if (this.checking_num != null) return;
    //         //======================
    //         // 锁定，不让滚动期内创建二次，因setInterval有一定的时间。
    //         this.checking_num = 0;
    //         //======================
    //         this.checking_num = window.setInterval(() => {
    //             if (this.pre_scroll_top == this.cur_scroll_args.scrollTop) {
    //                 window.clearInterval(this.checking_num);
    //                 this.checking_num = null;
    //                 this.pre_scroll_top = null;

    //                 this.on_scrollEnd(this.cur_scroll_args);

    //                 return;
    //             }
    //             this.pre_scroll_top = this.cur_scroll_args.scrollTop;

    //         }, this.CHECK_INTERVAL);
    //     }
    // }

    // class DivScrollView extends ScrollView {

    //     private static CHECK_INTERVAL = 30;
    //     private static SCROLLER_TAG_NAME = 'SCROLLER';

    //     private cur_scroll_args: ScrollArguments;// = {};
    //     private checking_num: number;
    //     private pre_scroll_top: number;
    //     private hammer: Hammer.Manager;
    //     private scroller_node: HTMLElement;

    //     constructor(element: HTMLElement) {
    //         $(element).attr('scroll-type', scroll_types.div);
    //         let scroller_node: HTMLElement;
    //         if (element.firstElementChild != null && element.firstElementChild.tagName == DivScrollView.SCROLLER_TAG_NAME) {
    //             scroller_node = <HTMLElement>element.firstElementChild;
    //         }
    //         else {
    //             scroller_node = document.createElement(DivScrollView.SCROLLER_TAG_NAME);
    //             scroller_node.innerHTML = element.innerHTML;
    //             element.innerHTML = '';
    //             element.appendChild(scroller_node);
    //         }

    //         super(element);

    //         this.cur_scroll_args = {};
    //         this.scroller_node = scroller_node;

    //         this.scroller_node.onscroll = $.proxy(this.on_elementScroll, this);
    //         new GesturePull(this, $.proxy(this.on_scroll, this));
    //     }

    //     private on_elementScroll() {
    //         let scroller_node = this.scroller_node;

    //         this.cur_scroll_args.scrollTop = 0 - scroller_node.scrollTop;
    //         this.cur_scroll_args.clientHeight = scroller_node.clientHeight;
    //         this.cur_scroll_args.scrollHeight = scroller_node.scrollHeight;

    //         var scroll_args = {
    //             clientHeight: this.cur_scroll_args.clientHeight,
    //             scrollHeight: this.cur_scroll_args.scrollHeight,
    //             scrollTop: 0 - this.cur_scroll_args.scrollTop
    //         };
    //         this.on_scroll(scroll_args);
    //         this.scrollEndCheck();
    //     }

    //     private scrollEndCheck() {
    //         if (this.checking_num != null) return;
    //         //======================
    //         // 锁定，不让滚动期内创建二次，因setInterval有一定的时间。
    //         this.checking_num = 0;
    //         //======================
    //         this.checking_num = window.setInterval(() => {
    //             // 当 scrollTop 不发生变化，则可以认为滚动已经停止。
    //             if (this.pre_scroll_top == this.cur_scroll_args.scrollTop) {
    //                 window.clearInterval(this.checking_num);
    //                 this.checking_num = null;
    //                 this.pre_scroll_top = null;

    //                 this.on_scrollEnd(this.cur_scroll_args);

    //                 return;
    //             }
    //             this.pre_scroll_top = this.cur_scroll_args.scrollTop;

    //         }, DivScrollView.CHECK_INTERVAL);
    //     }

    //     get disabled() {
    //         var s = document.defaultView.getComputedStyle(this.scroller_node);
    //         return s.overflowY != 'scroll';
    //     }
    //     set disabled(value: boolean) {
    //         if (value == true)
    //             this.scroller_node.style.overflowY = 'hidden';
    //         else
    //             this.scroller_node.style.overflowY = 'scroll';
    //     }
    // }

    // class GesturePull {
    //     private hammer: Hammer.Manager;
    //     private scrollView: chitu.ScrollView;
    //     private pullType: 'down' | 'up' | 'none';
    //     private is_vertical = false;
    //     private pre_y: number;
    //     private moved = false;
    //     private elementScrollTop: number;

    //     private scrollerElement: HTMLElement;
    //     private containerElement: HTMLElement;
    //     private on_scroll: (args: ScrollArguments) => void;

    //     constructor(scrollView: DivScrollView, on_scroll: (args: ScrollArguments) => void) {
    //         if (scrollView == null) throw Errors.argumentNull('scrollView');
    //         if (on_scroll == null) throw Errors.argumentNull('on_scroll');

    //         this.scrollView = scrollView;
    //         this.on_scroll = on_scroll;

    //         this.containerElement = this.scrollView.element;
    //         this.scrollerElement = $(this.scrollView.element).find('scroller')[0];
    //         if (this.scrollerElement == null)
    //             throw Errors.scrollerElementNotExists();

    //         this.hammer = new Hammer.Manager(this.containerElement);
    //         this.hammer.add(new Hammer.Pan({ direction: Hammer.DIRECTION_VERTICAL }));
    //         this.hammer.on('pandown', $.proxy(this.on_pandown, this));
    //         this.hammer.on('panup', $.proxy(this.on_panup, this));
    //         this.hammer.on('panstart', $.proxy(this.on_panstart, this));
    //         this.hammer.on('panend', $.proxy(this.on_panend, this));
    //     }

    //     private on_panstart(e: Hammer.PanEvent) {

    //         this.pre_y = e.deltaY;
    //         this.elementScrollTop = this.scrollerElement.scrollTop;
    //         //==================================================
    //         // 说明：计算角度，正切角要达到某个临界值，才认为是垂直。
    //         let d = Math.atan(Math.abs(e.deltaY / e.deltaX)) / 3.14159265 * 180;
    //         this.is_vertical = d >= 70;
    //         //==================================================
    //         let enablePullDown = this.scrollerElement.scrollTop == 0 && this.is_vertical;
    //         let enablePullUp = (this.scrollerElement.scrollHeight - this.scrollerElement.scrollTop <= this.scrollerElement.clientHeight) && this.is_vertical;

    //         if (enablePullDown && e.deltaY > 0) {
    //             this.pullType = 'down';
    //         }
    //         else if (enablePullUp && e.deltaY < 0) {
    //             this.pullType = 'up';
    //         }
    //         else {
    //             this.pullType = 'none';
    //         }

    //     }

    //     private on_pandown(e: Hammer.PanEvent) {
    //         if (e.deltaY >= 0 && this.pullType == 'up') {
    //             move(this.containerElement).y(0).duration(0).end();
    //         }
    //         else if (e.deltaY >= 0 && this.pullType == 'down') {
    //             this.move(e);
    //         }
    //         else if (e.deltaY < 0 && this.pullType == 'up') {
    //             this.move(e);
    //         }
    //     }

    //     private on_panup(e: Hammer.PanEvent) {
    //         if (e.deltaY <= 0 && this.pullType == 'down') {
    //             move(this.containerElement).y(0).duration(0).end();
    //         }
    //         else if (e.deltaY <= 0 && this.pullType == 'up') {
    //             this.move(e);
    //         }
    //         else if (e.deltaY > 0 && this.pullType == 'down') {
    //             this.move(e);
    //         }
    //     }

    //     private on_panend(e: Hammer.PanEvent) {
    //         if (this.moved) {
    //             $(this.scrollerElement).scrollTop(this.elementScrollTop);
    //             move(this.containerElement).y(0).end();
    //             this.moved = false;
    //         }
    //         this.enableNativeScroll();
    //     }

    //     private move(e: Hammer.PanEvent) {
    //         this.disableNativeScroll();

    //         //======================================
    //         // 说明：ScrollView 移动的距离，取手指移动距离的一半
    //         let destY = e.deltaY / 2;
    //         //======================================
    //         move(this.containerElement).y(destY).duration(0).end();
    //         this.moved = true;

    //         var args: chitu.ScrollArguments = {
    //             scrollHeight: this.scrollerElement.scrollHeight,
    //             clientHeight: this.scrollerElement.clientHeight,
    //             scrollTop: destY - this.scrollerElement.scrollTop
    //         }
    //         this.on_scroll(args);
    //     }

    //     /** 禁用原生的滚动 */
    //     private disableNativeScroll() {
    //         this.scrollerElement.style.overflowY = 'hidden';
    //     }

    //     /** 启用原生的滚动 */
    //     private enableNativeScroll() {
    //         this.scrollerElement.style.overflowY = 'scroll';
    //     }
    // }

    // export class ScrollViewStatusBar extends Control {
    //     constructor(element: HTMLElement, page: Page) {
    //         super(element);
    //         element.innerHTML =
    //             '<div name="scrollLoad_loading" style="padding:10px 0px 10px 0px;"> \
    //     <h5 class="text-center"> \
    //             <i class="icon-spinner icon-spin"></i><span style="padding-left:10px;">数据正在加载中...</span> \
    //         </h5> \
    // </div>';

    //     }
    // }

    // export class IScrollView extends ScrollView {
    //     private static SCROLLER_TAG_NAME = 'SCROLLER';
    //     private iscroller: IScroll;
    //     constructor(element: HTMLElement, page: Page) {
    //         $(element).attr('scroll-type', scroll_types.iscroll);
    //         if (element.firstElementChild == null || element.firstElementChild.tagName != IScrollView.SCROLLER_TAG_NAME) {
    //             let scroller_node = document.createElement(IScrollView.SCROLLER_TAG_NAME);
    //             scroller_node.innerHTML = element.innerHTML;
    //             element.innerHTML = '';
    //             element.appendChild(scroller_node);
    //         }

    //         super(element)

    //         requirejs(['iscroll'], () => this.init(this.element));
    //     }

    //     private init(element: HTMLElement) {
    //         var options = {
    //             tap: true,
    //             useTransition: false,
    //             HWCompositing: false,
    //             preventDefault: true,   // 必须设置为 True，否是在微信环境下，页面位置在上拉，或下拉时，会移动。
    //             probeType: 2,
    //             //bounce: true,
    //             //bounceTime: 600
    //         }

    //         var iscroller = this.iscroller = new IScroll(element, options);
    //         iscroller['page_container'] = this;
    //         iscroller.on('scrollEnd', function () {
    //             var scroller = <IScroll>this;
    //             var args = {
    //                 scrollTop: scroller.y,
    //                 scrollHeight: scroller.scrollerHeight,
    //                 clientHeight: scroller.wrapperHeight
    //             };
    //             control.on_scrollEnd(args);
    //         });
    //         iscroller.hasVerticalScroll = true;

    //         var control = this;
    //         iscroller.on('scroll', function () {
    //             var scroller = <IScroll>this;
    //             var args = {
    //                 scrollTop: scroller.y,
    //                 scrollHeight: scroller.scrollerHeight,
    //                 clientHeight: scroller.wrapperHeight
    //             };

    //             control.on_scroll(args);
    //         });

    //         (function (scroller: IScroll, wrapperNode: HTMLElement) {

    //             $(wrapperNode).on('tap', (event) => {
    //                 if (scroller.enabled == false)
    //                     return;

    //                 var MAX_DEEPH = 4;
    //                 var deeph = 1;
    //                 var node = <HTMLElement>event.target;
    //                 while (node != null) {
    //                     if (node.tagName == 'A')
    //                         return window.open($(node).attr('href'), '_self');

    //                     node = <HTMLElement>node.parentNode;
    //                     deeph = deeph + 1;
    //                     if (deeph > MAX_DEEPH)
    //                         return;
    //                 }
    //             })

    //         })(iscroller, element);

    //         $(window).on('resize', () => {
    //             window.setTimeout(() => iscroller.refresh(), 500);
    //         });
    //     }

    //     refresh() {
    //         if (this.iscroller != null) // 避免 iscroller 尚未初始化就调用
    //             this.iscroller.refresh();
    //     }

    //     get disabled(): boolean {
    //         return !this.iscroller.enabled;
    //     }
    //     set disabled(value: boolean) {
    //         if (value)
    //             this.iscroller.disable();
    //         else
    //             this.iscroller.enable();
    //     }
    // }

    // Control.register('HEADER', PageHeader);
    // Control.register('TOP-BAR', PageHeader);
    // Control.register('SCROLL-VIEW', ScrollView.createInstance);
    // Control.register('FOOTER', PageFooter);
    // Control.register('BOTTOM-BAR', PageFooter);
}