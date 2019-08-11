"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

define(["require", "exports", "maishu-chitu-service", "./Errors", "./Application"], function (require, exports, maishu_chitu_service_1, Errors_1, Application_1) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var Page =
  /*#__PURE__*/
  function () {
    function Page(params) {
      _classCallCheck(this, Page);

      this.data = {};
      this.showing = maishu_chitu_service_1.Callbacks();
      this.shown = maishu_chitu_service_1.Callbacks();
      this.hiding = maishu_chitu_service_1.Callbacks();
      this.hidden = maishu_chitu_service_1.Callbacks();
      this.closing = maishu_chitu_service_1.Callbacks();
      this.closed = maishu_chitu_service_1.Callbacks();
      this.messageReceived = maishu_chitu_service_1.Callbacks();
      this._element = params.element;
      this._app = params.app;
      this._displayer = params.displayer;
      var routeData = Application_1.parseUrl(params.url);
      this.data = Object.assign(routeData.values, params.data || {});
      this._name = routeData.pageName;
      this._url = params.url;
      this._container = params.container;
    }

    _createClass(Page, [{
      key: "on_showing",
      value: function on_showing() {
        return this.showing.fire(this, this.data);
      }
    }, {
      key: "on_shown",
      value: function on_shown() {
        return this.shown.fire(this, this.data);
      }
    }, {
      key: "on_hiding",
      value: function on_hiding() {
        return this.hiding.fire(this, this.data);
      }
    }, {
      key: "on_hidden",
      value: function on_hidden() {
        return this.hidden.fire(this, this.data);
      }
    }, {
      key: "on_closing",
      value: function on_closing() {
        return this.closing.fire(this, this.data);
      }
    }, {
      key: "on_closed",
      value: function on_closed() {
        return this.closed.fire(this, this.data);
      }
    }, {
      key: "show",
      value: function show() {
        var _this = this;

        this.on_showing();
        var currentPage = this._app.currentPage;

        if (this == currentPage) {
          currentPage = null;
        }

        return this._displayer.show(this, currentPage).then(function (o) {
          _this.on_shown();
        });
      }
    }, {
      key: "hide",
      value: function hide(currentPage) {
        var _this2 = this;

        this.on_hiding();
        return this._displayer.hide(this, currentPage).then(function (o) {
          _this2.on_hidden();
        });
      }
    }, {
      key: "close",
      value: function close() {
        this.on_closing();
        var parentElement = this._element.parentElement;
        if (parentElement == null) throw Errors_1.Errors.unexpectedNullValue();
        parentElement.removeChild(this._element);
        this.on_closed();
        return Promise.resolve();
      }
    }, {
      key: "createService",
      value: function createService(type) {
        var _this3 = this;

        type = type || maishu_chitu_service_1.Service;
        var service = new type();
        service.error.add(function (sender, error) {
          _this3._app.error.fire(_this3._app, error, _this3);
        });
        return service;
      }
    }, {
      key: "reload",
      value: function reload() {
        this.app.reload(this);
      }
    }, {
      key: "element",
      get: function get() {
        return this._element;
      }
    }, {
      key: "name",
      get: function get() {
        return this._name;
      }
    }, {
      key: "url",
      get: function get() {
        return this._url;
      }
    }, {
      key: "app",
      get: function get() {
        return this._app;
      }
    }, {
      key: "container",
      get: function get() {
        return this._container;
      }
    }]);

    return Page;
  }();

  exports.Page = Page;

  var PageDisplayerImplement =
  /*#__PURE__*/
  function () {
    function PageDisplayerImplement() {
      _classCallCheck(this, PageDisplayerImplement);
    }

    _createClass(PageDisplayerImplement, [{
      key: "show",
      value: function show(page, previous) {
        page.element.style.display = 'block';

        if (previous != null) {
          previous.element.style.display = 'none';
        }

        return Promise.resolve();
      }
    }, {
      key: "hide",
      value: function hide(page, previous) {
        page.element.style.display = 'none';

        if (previous != null) {
          previous.element.style.display = 'block';
        }

        return Promise.resolve();
      }
    }]);

    return PageDisplayerImplement;
  }();

  exports.PageDisplayerImplement = PageDisplayerImplement;
});
//# sourceMappingURL=Page.js.map
