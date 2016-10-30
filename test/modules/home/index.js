var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", 'chitu'], function (require, exports, chitu) {
    "use strict";
    var IndexPage = (function (_super) {
        __extends(IndexPage, _super);
        function IndexPage() {
            _super.apply(this, arguments);
        }
        return IndexPage;
    }(chitu.Pageview));
    return IndexPage;
});
