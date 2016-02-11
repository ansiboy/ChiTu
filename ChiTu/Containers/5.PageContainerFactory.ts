namespace chitu {
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
        static createPageContainer(routeData: RouteData, previous: Page | PageContainer): PageContainer {

            var previous_container: PageContainer;
            if (previous instanceof Page)
                previous_container = previous.conatiner;
            else 
                previous_container = <PageContainer>previous;

            if (Environment.instance.isDegrade)// || (site.env.isApp && site.env.isAndroid)
                return new DocumentPageContainer(<DocumentPageContainer>previous_container);

            if (Environment.instance.isIOS) {
                return new IScrollPageContainer(<IScrollPageContainer>previous_container);
            }

            if (Environment.instance.isAndroid && Environment.instance.osVersion >= 5)
                return new DivPageContainer( <DivPageContainer>previous_container);

            return new DocumentPageContainer(<DocumentPageContainer>previous_container);
        }
    }
}