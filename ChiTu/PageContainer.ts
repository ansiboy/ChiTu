/// <reference path="Scripts/typings/move.d.ts" />

namespace chitu {

    class ScrollArguments {
        scrollTop: number
        scrollHeight: number
        clientHeight: number
    }

    export interface PageContainer {
        show(swipe: SwipeDirection): JQueryPromise<any>;
        hide(swipe: SwipeDirection): JQueryPromise<any>;
        dispose();

        //header: HTMLElement;
        content: HTMLElement;
        //footer: HTMLElement;
        loading: HTMLElement;
        visible: boolean;

        scrollEnd: JQueryCallback;
    }

    export abstract class BasePageContainer implements PageContainer {
        private animationTime: number = 300;
        private num: Number;

        protected nodes: PageNodes;
        protected previous: PageContainer;

        scrollEnd = $.Callbacks()

        constructor(node: HTMLElement, prevous: PageContainer) {
            if (!node) throw Errors.argumentNull('node');
            $(node).hide();

            this.previous = prevous;
            this.nodes = new chitu.PageNodes(node);
            this.disableHeaderFooterTouchMove();
        }
        show(swipe: SwipeDirection): JQueryPromise<any> {
            debugger;
            if (this.visible == true)
                return $.Deferred().resolve();

            var container_width = $(this.nodes.container).width();
            var container_height = $(this.nodes.container).height();

            var result = $.Deferred();
            var on_end = () => {
                result.resolve();
            };

            // requirejs(['move'], (m) => {
            //     window['move'] = m;
            //     switch (swipe) {
            //         case SwipeDirection.None:
            //             $(this.nodes.container).show();
            //             result = $.Deferred().resolve();
            //             break;
            //         case SwipeDirection.Down:
            //             move(this.nodes.container).y(0 - container_height).duration(0).end();
            //             $(this.nodes.container).show();
            //             move(this.nodes.container).y(0).duration(0).end(on_end);
            //             break;
            //         case SwipeDirection.Up:
            //             move(this.nodes.container).y(container_height).duration(0).end();
            //             $(this.nodes.container).show();
            //             move(this.nodes.container).y(0).duration(this.animationTime).end(on_end);
            //             break;
            //         case SwipeDirection.Right:
            //             move(this.nodes.container).x(0 - container_width).duration(0).end()
            //             $(this.nodes.container).show();
            //             move(this.nodes.container).x(0).duration(this.animationTime).end(on_end);
            //             break;
            //         case SwipeDirection.Left:
            //             move(this.nodes.container).x(container_width).duration(0).end();
            //             $(this.nodes.container).show();
            //             move(this.nodes.container).x(0).duration(this.animationTime).end(on_end);
            //             break;
            //     }
            // });

            switch (swipe) {
                case SwipeDirection.None:
                    $(this.nodes.container).show();
                    result = $.Deferred().resolve();
                    break;
                case SwipeDirection.Down:
                    this.translateY(0 - container_height, 0);
                    $(this.nodes.container).show();
                    //======================================
                    // 不要问我为什么这里要设置 timeout，反正不设置不起作用。
                    window.setTimeout(() => {
                        this.translateY(0, this.animationTime).done(on_end);
                    }, 30);
                    //======================================
                    break;
                case SwipeDirection.Up:
                    this.translateY(container_height, 0);
                    $(this.nodes.container).show();
                    this.translateY(0, this.animationTime).done(on_end);
                    break;
                case SwipeDirection.Right:
                    this.translateX(0 - container_width, 0);
                    $(this.nodes.container).show();
                    window.setTimeout(() => {
                        this.translateX(0, this.animationTime).done(on_end)
                    }, 50);
                    break;
                case SwipeDirection.Left:
                    this.translateX(container_width, 0);
                    $(this.nodes.container).show();
                    window.setTimeout(() => {
                        this.translateX(0, this.animationTime).done(on_end);
                    }, 50);
                    break;
            }
            return result;
        }
        
        /// <summary>动画的效果的持续时间，这里使用定时器，是因为 transitionEnd 事件并非都起作用。</summary>
        private translateDuration(duration: number) {
            if (duration < 0)
                throw Errors.paramError('Parameter duration must greater or equal 0, actual is ' + duration + '.');

            var result = $.Deferred();
            if (duration == 0) {
                this.nodes.container.style.transitionDuration =
                    this.nodes.container.style.webkitTransitionDuration = '';

                return result.resolve();
            }

            this.nodes.container.style.transitionDuration =
                this.nodes.container.style.webkitTransitionDuration = duration + 'ms';

            window.setTimeout(() => result.resolve(), duration);
            return result;
        }
        private translateX(x: number, duration?: number): JQueryPromise<any> {

            var result = this.translateDuration(duration);
            this.nodes.container.style.transform = this.nodes.container.style.webkitTransform
                = 'translateX(' + x + 'px)';

            return result;
        }
        private translateY(y: number, duration?: number): JQueryPromise<any> {

            var result = this.translateDuration(duration);
            this.nodes.container.style.transform = this.nodes.container.style.webkitTransform
                = 'translateY(' + y + 'px)';

            return result;
        }
        private disableHeaderFooterTouchMove() {
            $([this.footer, this.header]).on('touchmove', function(e) {
                e.preventDefault();
            })
        }
        hide(swipe: SwipeDirection): JQueryPromise<any> {
            if (this.visible == false)
                return $.Deferred().resolve();

            var container_width = $(this.nodes.container).width();
            var container_height = $(this.nodes.container).height();
            var result: JQueryPromise<any>;
            switch (swipe) {
                case SwipeDirection.None:
                    result = $.Deferred().resolve();
                    break;
                case SwipeDirection.Down:
                    result = this.translateY(container_height, this.animationTime);
                    break;
                case SwipeDirection.Up:
                    result = this.translateY(0 - container_height, this.animationTime);
                    break;
                case SwipeDirection.Right:
                    result = this.translateX(container_width, this.animationTime);
                    break;
                case SwipeDirection.Left:
                    result = this.translateX(0 - container_width, this.animationTime);
                    break;
            }
            result.done(() => $(this.nodes.container).hide());
            return result;
        }

        private is_dispose = false;
        dispose() {
            if (this.is_dispose)
                return;

            this.is_dispose = true;
            this.nodes.container.parentNode.removeChild(this.nodes.container);
        }
        get header() {
            return this.nodes.header;
        }
        get content() {
            return this.nodes.content;
        }
        get footer() {
            return this.nodes.footer;
        }
        get loading() {
            return this.nodes.loading;
        }
        get visible() {
            return $(this.nodes.container).is(':visible');
        }
        set visible(value: boolean) {
            if (value)
                $(this.nodes.container).show();
            else
                $(this.nodes.container).hide();
        }
    }

    export class DocumentPageContainer extends BasePageContainer {

        private cur_scroll_args = new ScrollArguments();
        private checking_num: number;
        private pre_scroll_top: number;
        private CHECK_INTERVAL = 300;

        constructor(node: HTMLElement, previous: DocumentPageContainer) {
            super(node, previous);
            $(node).addClass('doc');
            $(document).scroll((event) => {
                // if (!page.visible())
                //     return;

                var args = {
                    scrollTop: $(document).scrollTop(),
                    scrollHeight: document.body.scrollHeight,
                    clientHeight: $(window).height()
                };

                this.cur_scroll_args.clientHeight = args.clientHeight;
                this.cur_scroll_args.scrollHeight = args.scrollHeight;
                this.cur_scroll_args.scrollTop = args.scrollTop;
                this.scrollEndCheck();
            });
        }

        private on_scrollEnd(args: ScrollArguments) {
            this.scrollEnd.fire(this, args);
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

        show(swipe: SwipeDirection) {
            if (this.previous != null)
                this.previous.hide(SwipeDirection.None);

            return super.show(swipe);
        }

        hide(swipe: SwipeDirection) {
            var result = super.hide(swipe);
            if (this.previous != null)
                this.previous.show(SwipeDirection.None);

            return result;
        }
    }

    export class DivPageContainer extends BasePageContainer {

        private cur_scroll_args: ScrollArguments = new ScrollArguments();
        private pre_scroll_top: number;
        private checking_num: number;
        private CHECK_INTERVAL = 300;

        constructor(node: HTMLElement, previous: DivPageContainer) {
            super(node, previous);
            $(node).addClass('div');
            var wrapper_node = this.nodes.body;
            wrapper_node.onscroll = () => {
                var args = {
                    scrollTop: wrapper_node.scrollTop,
                    scrollHeight: wrapper_node.scrollHeight,
                    clientHeight: wrapper_node.clientHeight
                };

                //this.on_scroll(args);
                this.scrollEndCheck();
            };
        }

        private on_scrollEnd(args: ScrollArguments) {
            this.scrollEnd.fire(this, args);
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

    export class IScrollPageContainer extends BasePageContainer {

        private iscroller: IScroll;

        scroll: JQueryCallback = $.Callbacks();

        constructor(node: HTMLElement, previous: IScrollPageContainer) {
            super(node, previous);
            $(node).addClass('ios');
            $(this.nodes.body).addClass('wrapper');
            $(this.nodes.content).addClass('scroller');
            requirejs(['iscroll'], () => this.init(this.nodes));
        }

        private on_scroll(args) {
            this.scroll.fire(this, args);
        }

        private on_scrollEnd(args) {
            this.scrollEnd.fire(this, args);
        }

        private init(nodes: PageNodes) {
            var options = {
                tap: true,
                useTransition: false,
                HWCompositing: false,
                preventDefault: true,   // 必须设置为 True，否是在微信环境下，页面位置在上拉，或下拉时，会移动。
                probeType: 1,
                //bounce: true,
                //bounceTime: 600
            }

            var iscroller = this.iscroller = new IScroll(this.nodes.body, options);//= page['iscroller']
            iscroller['page_container'] = this;
            //window.setTimeout(() => iscroller.refresh(), 1000);

            iscroller.on('scrollEnd', function() {
                var scroller = <IScroll>this;
                var args = {
                    scrollTop: 0 - scroller.y,
                    scrollHeight: scroller.scrollerHeight,
                    clientHeight: scroller.wrapperHeight
                };
                (<IScrollPageContainer>scroller['page_container']).on_scrollEnd(args);
            });

            iscroller.on('scroll', function() {
                var scroller = <IScroll>this;
                var args = {
                    scrollTop: 0 - scroller.y,
                    scrollHeight: scroller.scrollerHeight,
                    clientHeight: scroller.wrapperHeight
                };

                (<IScrollPageContainer>scroller['page_container']).on_scroll(args);
            });

            (function(scroller: IScroll, wrapperNode: HTMLElement) {

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

            })(iscroller, this.nodes.body);

            $(window).on('resize', () => {
                window.setTimeout(() => iscroller.refresh(), 500);
            });
        }

        private _is_dispose = false;
        dispose() {
            if (this._is_dispose)
                return;

            this._is_dispose = true;
            this.iscroller.destroy();
            return super.dispose();
        }

        refresh() {
            if (this.iscroller)
                this.iscroller.refresh();
        }
    }

    enum OS {
        ios,
        android,
        other
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
        /// 判断是否为 APP
        /// </summary>
        get isApp(): boolean {
            return navigator.userAgent.indexOf("Html5Plus") >= 0;
            //return window['plus'] != null;
        }
        /// <summary>
        /// 判断是否为 WEB
        /// </summary>
        get isWeb(): boolean {
            return !this.isApp;
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


    export class PageContainerFactory {
        static createPageContainer<T extends PageContainer>(routeData: RouteData, pageNode: HTMLElement, previous: Page | T): PageContainer {
            // if (scrollType == ScrollType.Div)
            //     return new DivPageContainer(element);
            // else if (scrollType == ScrollType.Document)
            //     return new DocumentPageContainer(element);
            // else if (scrollType == ScrollType.IScroll)
            //     return new IScrollPageContainer(element);
            // else
            //     throw Errors.notImplemented('ScrollType "' + scrollType + '" is not supported.');
            var previous_container: PageContainer;
            if (previous instanceof Page)
                previous_container = previous.nodes();
            else if (previous != null)
                previous_container = <T>previous;

            if (Environment.instance.isDegrade)// || (site.env.isApp && site.env.isAndroid)
                return new DocumentPageContainer(pageNode, <DocumentPageContainer>previous_container);

            if (Environment.instance.isIOS) {
                return new IScrollPageContainer(pageNode, <IScrollPageContainer>previous_container);
            }

            if (Environment.instance.isAndroid && Environment.instance.osVersion >= 5)
                return new DivPageContainer(pageNode, <DivPageContainer>previous_container);

            return new DocumentPageContainer(pageNode, <DocumentPageContainer>previous_container);
        }
    }
}