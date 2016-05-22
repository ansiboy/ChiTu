namespace chitu {

    enum OS {
        ios,
        android,
        other
    }

    var scroll_types = {
        div: 'div',
        iscroll: 'iscroll',
        doc: 'doc'
    }

    class Environment {
        private _environmentType;
        private _isIIS: boolean;
        private _os: OS;
        private _version: number;
        private static _instance: Environment;

        constructor() {
            var userAgent = navigator.userAgent;
            if (userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0) {
                this._os = OS.ios;
                var match = userAgent.match(/iPhone OS\s([0-9\-]*)/);
                if (match) {
                    var major_version = parseInt(match[1], 10);
                    this._version = major_version;
                }
            }
            else if (userAgent.indexOf('Android') > 0) {
                this._os = OS.android;

                var match = userAgent.match(/Android\s([0-9\.]*)/);
                if (match) {
                    var major_version = parseInt(match[1], 10);
                    this._version = major_version;
                }
            }
            else {
                this._os = OS.other;
            }
        }
        get osVersion(): number {
            return this._version;
        }

        get os(): OS {
            return this._os;
        }

        get isIOS() {
            return this.os == OS.ios;
        }
        get isAndroid() {
            return this.os == OS.android;
        }

        /// <summary>
        /// 是否需要降级
        /// </summary>
        get isDegrade(): boolean {
            if ((this.isWeiXin || this.osVersion <= 4) && this.isAndroid)
                return true;

            if (navigator.userAgent.indexOf('MQQBrowser') >= 0) {
                return true;
            }
            return false;
        }
        get isWeiXin(): boolean {
            var ua = navigator.userAgent.toLowerCase();
            return <any>(ua.match(/MicroMessenger/i)) == 'micromessenger';
        }
        get isIPhone() {
            return window.navigator.userAgent.indexOf('iPhone') > 0
        }
        static get instance(): Environment {
            if (!Environment._instance)
                Environment._instance = new Environment();

            return Environment._instance;
        }
    }
    export class ControlFactory {
        static createControls(element: HTMLElement, page: Page): Array<Control> {
            ControlFactory.transformElement(element);

            var controls = new Array<Control>();
            var elements = element.childNodes;

            for (var i = 0; i < elements.length; i++) {
                var element_type = elements[i].nodeType;
                if (element_type != 1) //1 为 Element 类型
                    continue;

                var control = ControlFactory.createControl(<HTMLElement>elements[i], page);
                if (control == null)
                    continue;

                controls.push(control);
            }

            return controls;
        }

        static createControl(element: HTMLElement, page: Page): Control {
            return Control.createControl(element, page);
        }

        private static transformElement(element: HTMLElement) {
            var node = element;

            switch (node.tagName) {
                case 'SCROLL-VIEW':
                    var scroll_type: string = $(node).attr('scroll-type');
                    if (scroll_type == null) {
                        if (Environment.instance.isDegrade) {
                            scroll_type = scroll_types.doc;
                        }
                        else if (Environment.instance.isIOS) {
                            scroll_type = scroll_types.iscroll;
                        }
                        else if (Environment.instance.isAndroid && Environment.instance.osVersion >= 5) {
                            scroll_type = scroll_types.div;
                        }
                        else {
                            scroll_type = scroll_types.doc;
                        }
                    }



                    $(node).attr('scroll-type', scroll_type);
                    break;
            }

            for (var i = 0; i < element.childNodes.length; i++) {
                ControlFactory.transformElement(<HTMLElement>element.childNodes[i]);
            }
        }
    }

    export class ControlCollection {
        private parent: Control;
        private items: Array<Control>;

        constructor(parent: Control) {
            this.parent = parent;
            this.items = [];
        }
        add(control: Control) {
            if (control == null)
                throw Errors.argumentNull('control');

            this[this.length] = this.items[this.items.length] = control;
            control.parent = this.parent;
        }
        get length(): number {
            return this.items.length;
        }
        item(indexOrName: number | string) {
            if (typeof (indexOrName) == 'number')
                return this.items[indexOrName];

            var name = <string>indexOrName;
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i].name == name)
                    return this.items[i];
            }

            return null;
        }
    }

    export class Control {
        private _element: HTMLElement;
        private _children = new ControlCollection(this);;
        private _page: Page;
        private static ControlTags = {};

        protected _name: string;

        load = chitu.Callbacks();
        parent: Control;

        constructor(element: HTMLElement, page: Page) {
            if (element == null) throw Errors.argumentNull('element');
            if (page == null) throw Errors.argumentNull('page');

            this._element = element;
            this._page = page;
            this._name = $(element).attr('name');
            $(element).data('control', this);
            this.createChildren(element, page);
        }

        private createChildren(element: HTMLElement, page: Page) {

            for (var i = 0; i < element.childNodes.length; i++) {
                if (element.childNodes[i].nodeType != 1)
                    continue;

                var child_control = this.createChild(<HTMLElement>element.childNodes[i], page);
                //ControlFactory.createControl(<HTMLElement>element.childNodes[i], page);
                if (child_control == null)
                    continue;

                this.children.add(child_control);
            }
        }

        protected createChild(element: HTMLElement, page: Page) {
            var child_control = ControlFactory.createControl(element, page);
            return child_control;
        }

        get visible(): boolean {
            var display = this.element.style.display;
            return display != 'none';
        }
        set visible(value: boolean) {
            if (value == true)
                this.element.style.display = 'block';
            else
                this.element.style.display = 'none';
        }
        get element(): HTMLElement {
            return this._element;
        }
        get children(): ControlCollection {
            return this._children;
        }
        get name(): string {
            return this._name;
        }
        get page(): Page {
            return this._page;
        }
        protected fireEvent(callback: chitu.Callback, args): JQueryPromise<any> {
            return chitu.fireCallback(callback, [this, args]);
        }

        on_load(args: Object): JQueryPromise<any> {
            var promises = new Array<JQueryPromise<any>>();
            promises.push(this.fireEvent(this.load, args));
            for (var i = 0; i < this.children.length; i++) {
                var promise = this.children.item(i).on_load(args);
                if (chitu.Utility.isDeferred(promise))
                    promises.push(promise);
            }
            var result = $.when.apply($, promises);
            return result;
        }
        static register(tagName: string, createControlMethod: (new (element: HTMLElement, page: Page) => Control) | ((element: HTMLElement, page: Page) => Control)) {
            Control.ControlTags[tagName] = createControlMethod;
        }
        static createControl(element: HTMLElement, page: Page) {
            if (element == null) throw Errors.argumentNull('element');
            if (page == null) throw Errors.argumentNull('page');

            var tagName: string = element.tagName;
            var createControlMethod = Control.ControlTags[tagName];
            if (createControlMethod == null)
                return null;

            var instance: Control;
            if (createControlMethod.prototype != null)
                instance = new createControlMethod(element, page);
            else
                instance = createControlMethod(element, page);

            return instance;
        }
    }

    export class PageHeader extends Control {
        constructor(element: HTMLElement, page: Page) {
            super(element, page);
        }
    }

    export class PageFooter extends Control {
        constructor(element: HTMLElement, page: Page) {
            super(element, page);
        }
    }

    export class ScrollArguments {
        scrollTop: number
        scrollHeight: number
        clientHeight: number
    }

    export class ScrollView extends Control {
        private _bottomLoading: ScrollViewStatusBar;
        static scrolling = false;

        scroll: Callback = Callbacks();
        scrollEnd: Callback = Callbacks();
        scrollLoad: (sender: ScrollView, args) => JQueryPromise<any>; //Callback = Callbacks();

        constructor(element: HTMLElement, page: Page) {
            super(element, page);

            this.scrollEnd.add(ScrollView.page_scrollEnd);
            var $status_bar = $(element).find('STATUS-BAR');
            if ($status_bar.length > 0) {
                this._bottomLoading = new ScrollViewStatusBar($status_bar[0], page);
            }
        }

        on_load(args) {
            var result: JQueryPromise<any>;
            if (this.scrollLoad != null) {
                result = this.scrollLoad(this, args);
            }

            if (result != null) {
                result = $.when(result, super.on_load(args));
            }
            else {
                result = super.on_load(args);
            }

            return result;
            // return result.done(() => {
            //     if (this instanceof IScrollView) {
            //         setTimeout(() => (<IScrollView><any>this).refresh(), 30);
            //     }
            // });
        }

        protected on_scrollEnd(args: ScrollArguments) {
            ScrollView.scrolling = false;
            return chitu.fireCallback(this.scrollEnd, [this, args]);
        }

        protected on_scroll(args: ScrollArguments) {
            ScrollView.scrolling = true;
            return chitu.fireCallback(this.scroll, [this, args]);
        }

        static createInstance(element: HTMLElement, page: Page): ScrollView {
            var scroll_type = $(element).attr('scroll-type');
            if (scroll_type == scroll_types.doc)
                return new DocumentScrollView(element, page);

            if (scroll_type == scroll_types.iscroll) {
                return new IScrollView(element, page); //new IScrollView(element, page);
            }

            if (scroll_type == scroll_types.div)
                return new DivScrollView(element, page);

            return new DocumentScrollView(element, page);
        }
        get bottomLoading(): ScrollViewStatusBar {
            return this._bottomLoading;
        }

        private static page_scrollEnd(sender: ScrollView, args) {

            var scrollTop = args.scrollTop;
            var scrollHeight = args.scrollHeight;
            var clientHeight = args.clientHeight;

            //====================================================================

            var marginBottom = clientHeight / 3;
            if (clientHeight + scrollTop < scrollHeight - marginBottom)
                return;

            if (sender.scrollLoad != null) {
                var result = sender.scrollLoad(sender, args);
                result.done(() => {
                    if (sender.bottomLoading != null) {
                        sender.bottomLoading.visible = args.enableScrollLoad != false;
                    }
                })
            }

        }
    }

    class DocumentScrollView extends ScrollView {
        private cur_scroll_args = new ScrollArguments();
        private checking_num: number;
        private pre_scroll_top: number;
        private CHECK_INTERVAL = 300;

        constructor(element: HTMLElement, page: Page) {

            super(element, page);
            //this.element.style.display = 'none';

            $(document).scroll((event) => {
                var args = new ScrollArguments();

                args.scrollTop = $(document).scrollTop();
                args.scrollHeight = document.body.scrollHeight;
                args.clientHeight = $(window).height();

                this.cur_scroll_args.clientHeight = args.clientHeight;
                this.cur_scroll_args.scrollHeight = args.scrollHeight;
                this.cur_scroll_args.scrollTop = args.scrollTop;
                this.scrollEndCheck();
            });
        }

        private static createElement(html: string, page: Page): HTMLElement {
            var element = document.createElement('div');
            element.innerHTML = html;
            page.element.appendChild(element);
            return element;
        }

        private scrollEndCheck() {
            if (this.checking_num != null) return;
            //======================
            // 锁定，不让滚动期内创建二次，因setInterval有一定的时间。
            this.checking_num = 0;
            //======================
            this.checking_num = window.setInterval(() => {
                if (this.pre_scroll_top == this.cur_scroll_args.scrollTop) {
                    window.clearInterval(this.checking_num);
                    this.checking_num = null;
                    this.pre_scroll_top = null;

                    this.on_scrollEnd(this.cur_scroll_args);

                    return;
                }
                this.pre_scroll_top = this.cur_scroll_args.scrollTop;

            }, this.CHECK_INTERVAL);
        }
    }

    class DivScrollView extends ScrollView {

        private cur_scroll_args = new ScrollArguments();
        private checking_num: number;
        private pre_scroll_top: number;
        private CHECK_INTERVAL = 30;

        constructor(element: HTMLElement, page: Page) {
            super(element, page);

            this.element.onscroll = () => {
                this.cur_scroll_args.scrollTop = this.element.scrollTop;
                this.cur_scroll_args.clientHeight = this.element.clientHeight;
                this.cur_scroll_args.scrollHeight = this.element.scrollHeight;
                this.on_scroll(this.cur_scroll_args);
                this.scrollEndCheck();
            };
        }

        private scrollEndCheck() {
            if (this.checking_num != null) return;
            //======================
            // 锁定，不让滚动期内创建二次，因setInterval有一定的时间。
            this.checking_num = 0;
            //======================
            this.checking_num = window.setInterval(() => {
                // 当 scrollTop 不发生变化，则可以认为滚动已经停止。
                if (this.pre_scroll_top == this.cur_scroll_args.scrollTop) {
                    window.clearInterval(this.checking_num);
                    this.checking_num = null;
                    this.pre_scroll_top = null;

                    this.on_scrollEnd(this.cur_scroll_args);

                    return;
                }
                this.pre_scroll_top = this.cur_scroll_args.scrollTop;

            }, this.CHECK_INTERVAL);
        }
    }

    export class ScrollViewStatusBar extends Control {
        constructor(element: HTMLElement, page: Page) {
            super(element, page);
            element.innerHTML =
                '<div name="scrollLoad_loading" style="padding:10px 0px 10px 0px;"> \
        <h5 class="text-center"> \
                <i class="icon-spinner icon-spin"></i><span style="padding-left:10px;">数据正在加载中...</span> \
            </h5> \
    </div>';

        }
    }

    export class IScrollView extends ScrollView {
        private iscroller: IScroll;
        constructor(element: HTMLElement, page: Page) {

            //if (scroll_type == scroll_types.iscroll) {
            var scroller_node = document.createElement('scroller');
            scroller_node.innerHTML = element.innerHTML;
            element.innerHTML = '';
            element.appendChild(scroller_node);
            //}

            super(element, page)

            requirejs(['iscroll'], () => this.init(this.element));
        }

        private init(element: HTMLElement) {
            var options = {
                tap: true,
                useTransition: false,
                HWCompositing: false,
                preventDefault: true,   // 必须设置为 True，否是在微信环境下，页面位置在上拉，或下拉时，会移动。
                probeType: 1,
                //bounce: true,
                //bounceTime: 600
            }

            var iscroller = this.iscroller = new IScroll(element, options);
            iscroller['page_container'] = this;
            iscroller.on('scrollEnd', function () {
                var scroller = <IScroll>this;
                var args = {
                    scrollTop: 0 - scroller.y,
                    scrollHeight: scroller.scrollerHeight,
                    clientHeight: scroller.wrapperHeight
                };
                control.on_scrollEnd(args);
            });

            var control = this;
            iscroller.on('scroll', function () {
                var scroller = <IScroll>this;
                var args = {
                    scrollTop: 0 - scroller.y,
                    scrollHeight: scroller.scrollerHeight,
                    clientHeight: scroller.wrapperHeight
                };

                control.on_scroll(args);
            });

            (function (scroller: IScroll, wrapperNode: HTMLElement) {

                $(wrapperNode).on('tap', (event) => {
                    if (scroller.enabled == false)
                        return;

                    var MAX_DEEPH = 4;
                    var deeph = 1;
                    var node = <HTMLElement>event.target;
                    while (node != null) {
                        if (node.tagName == 'A')
                            return window.open($(node).attr('href'), '_self');

                        node = <HTMLElement>node.parentNode;
                        deeph = deeph + 1;
                        if (deeph > MAX_DEEPH)
                            return;
                    }
                })

            })(iscroller, element);

            $(window).on('resize', () => {
                window.setTimeout(() => iscroller.refresh(), 500);
            });
        }

        refresh() {
            if (this.iscroller != null) // 避免 iscroller 尚未初始化就调用
                this.iscroller.refresh();
        }
    }

    export class FormLoading extends Control {
        private loading_element: HTMLElement;
        private _loaded_count: number;
        private static _on_load = Control.prototype.on_load;
        constructor(element: HTMLElement, page: Page) {

            super(element, page);

            this._loaded_count = 0;
            this.loading_element = document.createElement('page-loading');
            this.loading_element.className = 'page-loading';
            this.loading_element.innerHTML = this.defaultHtml();
            element.appendChild(this.loading_element);
        }

        private defaultHtml(): string {
            var html = '<div class="spin"><i class="icon-spinner icon-spin"></i><div>';
            return html;
        }

        private set loaded_count(value: number) {
            this._loaded_count = this._loaded_count + 1;
            if (this._loaded_count >= this.children.length) {
                this.loading_element.style.display = 'none';
                for (var j = 0; j < this.children.length; j++) {
                    (<Control>this.children[j]).visible = true;
                }
            }
        }

        protected createChild(element: HTMLElement, page: Page): Control {
            var self = this;
            var control = super.createChild(element, page);
            if (control == null)
                return;

            control.visible = false;
            control.on_load = function (args: Object) {
                var result = FormLoading._on_load.apply(this, [args]);
                if (chitu.Utility.isDeferred(result)) {
                    (<JQueryDeferred<any>>result).done(() => self.loaded_count = self.loaded_count + 1);
                }
                else {
                    self.loaded_count = self.loaded_count + 1;
                }
                return result;
            }

            return control;
        }
    }

    Control.register('FORM-LOADING', FormLoading);
    Control.register('HEADER', PageHeader);
    Control.register('TOP-BAR', PageHeader);
    Control.register('SCROLL-VIEW', ScrollView.createInstance);
    Control.register('FOOTER', PageFooter);
    Control.register('BOTTOM-BAR', PageFooter);
}