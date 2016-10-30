var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", 'chitu'], function (require, exports, chitu) {
    "use strict";
    var html = "<h1>User Index Page</h1>";
    return (function (_super) {
        __extends(IndexPage, _super);
        function IndexPage(args) {
            args.element.innerHTML = html;
            _super.call(this, args);
        }
        return IndexPage;
    }(chitu.Pageview));
});
