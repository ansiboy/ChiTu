import { PageMaster } from "./PageMaster";
import { IService, ServiceConstructor, Service, Callbacks, Callback1, Callback } from "maishu-chitu-service";
import { Errors } from "./Errors";
import { parseUrl } from "./Application";

export type PageData = { [key: string]: string | Function }

export interface PageDisplayConstructor {
    new(app: PageMaster): PageDisplayer
}

export interface PageDisplayer {
    show(targetPage: Page, currentPage: Page | null): Promise<any>;
    hide(targetPage: Page, currentPage: Page | null): Promise<any>;
}

export interface PageContainer {
    name: string,
    element: HTMLElement
}

export interface PageParams {
    app: PageMaster,
    // action: Action,
    element: HTMLElement,
    displayer: PageDisplayer,
    // name: string,
    data: PageData,
    url: string
    container: PageContainer
}

/**
 * 页面，用把 HTML Element 包装起来。
 */
export class Page {

    private _element: HTMLElement;
    private _app: PageMaster;
    private _displayer: PageDisplayer;
    private _name: string
    private _url: string
    private _container: PageContainer

    data: PageData = {}

    /** 页面显示时引发 */
    showing: Callback1<this, PageData> = Callbacks<this, PageData>();

    /** 页面显示时完成后引发 */
    shown: Callback1<this, PageData> = Callbacks<this, PageData>();

    hiding: Callback1<this, PageData> = Callbacks<this, PageData>();
    hidden: Callback1<this, PageData> = Callbacks<this, PageData>();

    closing: Callback1<this, PageData> = Callbacks<this, PageData>();
    closed: Callback1<this, PageData> = Callbacks<this, PageData>();

    messageReceived: Callback1<Object, any> = Callbacks<Object, any>();

    constructor(params: PageParams) {
        this._element = params.element;
        this._app = params.app;
        this._displayer = params.displayer;
        let routeData = parseUrl(params.url)
        this.data = Object.assign(routeData.values, params.data || {})
        this._name = routeData.pageName;
        this._url = params.url;
        this._container = params.container;
    }
    private on_showing() {
        return this.showing.fire(this, this.data);
    }
    private on_shown() {
        return this.shown.fire(this, this.data);
    }
    private on_hiding() {
        return this.hiding.fire(this, this.data);
    }
    private on_hidden() {
        return this.hidden.fire(this, this.data);
    }
    private on_closing() {
        return this.closing.fire(this, this.data);
    }
    private on_closed() {
        return this.closed.fire(this, this.data);
    }
    show(): Promise<any> {
        this.on_showing();
        let currentPage = this._app.currentPage;
        if (this == currentPage) {
            currentPage = null;
        }
        return this._displayer.show(this, currentPage).then(o => {
            this.on_shown();
        });
    }
    hide(currentPage: Page | null): Promise<any> {
        this.on_hiding();
        return this._displayer.hide(this, currentPage).then(o => {
            this.on_hidden();
        });
    }
    close(): Promise<any> {
        this.on_closing();
        let parentElement = this._element.parentElement as HTMLElement;
        if (parentElement == null)
            throw Errors.unexpectedNullValue()

        parentElement.removeChild(this._element);

        this.on_closed();
        return Promise.resolve();
    }

    /**
     * 创建服务
     * @param type 服务类型
     */
    createService<T extends IService>(type?: ServiceConstructor<T>): T {
        type = type || Service as any as ServiceConstructor<T>
        let service = new type();
        service.error.add((sender, error) => {
            this._app.error.fire(this._app, error, this)
        })
        return service;
    }

    reload() {
        this.app.reload(this);
    }

    // public reload(pageName: string, args?: PageData) {
    //     let result = this.showPage(pageName, args, true)
    //     return result
    // }

    /**
     * 元素，与页面相对应的元素
     */
    get element(): HTMLElement {
        return this._element;
    }

    /**
     * 名称
     */
    get name(): string {
        return this._name;
    }

    get url(): string {
        return this._url
    }

    get app() {
        return this._app;
    }

    get container() {
        return this._container
    }
}


export interface PageConstructor {
    new(args: PageParams): Page
}

export class PageDisplayerImplement implements PageDisplayer {
    show(page: Page, previous: Page) {
        page.element.style.display = 'block';
        if (previous != null) {
            previous.element.style.display = 'none';
        }
        return Promise.resolve();
    }
    hide(page: Page, previous: Page) {
        page.element.style.display = 'none';
        if (previous != null) {
            previous.element.style.display = 'block';
        }
        return Promise.resolve();
    }
}