namespace chitu.gesture {
    export function createPullDownBar(page: chitu.Page, config): PullDownBar {
        config = config || {};
        config = $.extend({
            text: function (status) {
                (<HTMLElement>this.element).innerHTML = PullDownStateText[status];
            }
        }, config);

        var node = <HTMLElement>config.element;
        var status: string;
        if (node == null) {
            node = document.createElement('div');
            node.className = 'page-pulldown';
            node.innerHTML = PullUpStateText.init;

            var cn = page.nodes().content;
            if (cn.childNodes.length == 0) {
                cn.appendChild(node);
            }
            else {
                cn.insertBefore(node, cn.childNodes[0]);
            }

            config.element = node;
        }

        var bar = new PullDownBar(config);
        return bar;
    }
    //export function createMove(page: chitu.Page): Move {
    //    var m: Move;
    //    m = move(page.nodes().content);
    //    return m;
    //}
    export class config {
        static PULLDOWN_EXECUTE_CRITICAL_HEIGHT = 60;   //刷新临界高度值，大于这个高度则进行刷新
        static PULLUP_EXECUTE_CRITICAL_HEIGHT = 60;
        static PULL_DOWN_MAX_HEIGHT = 150;
        static PULL_UP_MAX_HEIGHT = 150;
        static MINI_MOVE_DISTANCE = 3;
    }
    export class RefreshState {
        static init = 'init'
        static ready = 'ready'
        static doing = 'doing'
        static done = 'done'
    }
    export class PullDownStateText {
        static init = '<div style="padding-top:10px;">下拉可以刷新</div>'
        static ready = '<div style="padding-top:10px;">松开后刷新</div>'
        static doing = '<div style=""><i class="icon-spinner icon-spin"></i><span>&nbsp;正在更新中</span></div>'
        static done = '<div style="padding-top:10px;">更新完毕</div>'
    }
    export class PullUpStateText {
        static init = '上拉可以刷新'
        static ready = '松开后刷新'
        static doing = '<div><i class="icon-spinner icon-spin"></i><span>&nbsp;正在更新中</span></div>'
        static done = '更新完毕'
    }
    export class PullDownBar {
        private _status: string;
        private _config: any;

        constructor(config) {
            this._config = config;
            this.status(RefreshState.init);
        }
        status(value: string = undefined): string {
            if (value === undefined)
                return this._status;

            this._status = value;
            this._config.text(value);

        }
        execute(): JQueryPromise<any> {
            //TODO:现在这里啥也没有处理，之后是要读取数据的
            var result = $.Deferred();
            window.setTimeout(() => result.resolve(), 2000);
            //this.status(RefreshState.init);
            result.done(() => this.status(RefreshState.init));
            return result;
        }

        static createPullDownBar(page: chitu.Page, config): PullDownBar {
            config = config || {};
            config = $.extend({
                text: function (status) {
                    (<HTMLElement>this.element).innerHTML = PullDownStateText[status];
                }
            }, config);

            var node = <HTMLElement>config.element;
            var status: string;
            if (node == null) {
                node = document.createElement('div');
                node.className = 'page-pulldown';
                node.innerHTML = PullUpStateText.init;

                var cn = page.nodes().content;
                if (cn.childNodes.length == 0) {
                    cn.appendChild(node);
                }
                else {
                    cn.insertBefore(node, cn.childNodes[0]);
                }

                config.element = node;
            }

            var bar = new PullDownBar(config);
            return bar;
        }
    }

    export class PullUpBar {
        private _status: string;
        private _config: any;

        constructor(config: any) {
            this._config = config;
            this.status(RefreshState.init);
        }

        status(value: string = undefined): string {
            if (value === undefined)
                return this._status;

            this._status = value;
            this._config.text(value);
        }

        execute() {
            var result: JQueryPromise<any> = this._config.execute();
            if (result != null && $.isFunction(result.done)) {
                result.done(() => this.status(RefreshState.init));
            }

            return result;
        }

        static createPullUpBar(page: chitu.Page, config): PullUpBar {
            config = config || {};
            config = $.extend({
                execute: function () { },
                text: function (status) {
                    (<HTMLElement>this.element).innerHTML = PullUpStateText[status];
                }
            }, config);

            var node = <HTMLElement>page.nodes()['pullup'];
            var status: string;
            if (node == null) {
                node = document.createElement('div');
                node.className = 'page-pullup';
                //node.style.height = PULLUP_BAR_HEIGHT + 'px';
                node.style.textAlign = 'center';

                var cn = page.nodes().content;
                cn.appendChild(node);

            }

            config.element = node;
            return new PullUpBar(config);
        }
    }




} 