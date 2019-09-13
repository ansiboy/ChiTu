"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

define(["require", "exports", "maishu-chitu-service", "./PageMaster", "./Errors"], function (require, exports, maishu_chitu_service_1, PageMaster_1, Errors_1) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var DefaultPageName = "index";

  function _parseUrl(url) {
    if (!url) throw Errors_1.Errors.argumentNull('url');
    var sharpIndex = url.indexOf('#');
    var routeString;
    if (sharpIndex >= 0) routeString = url.substr(sharpIndex + 1);else routeString = url;
    if (!routeString) throw Errors_1.Errors.canntParseRouteString(url);

    if (routeString.startsWith('!')) {
      throw Errors_1.Errors.canntParseRouteString(routeString);
    }

    var routePath;
    var search = null;
    var param_spliter_index = routeString.indexOf('?');

    if (param_spliter_index >= 0) {
      search = routeString.substr(param_spliter_index + 1);
      routePath = routeString.substring(0, param_spliter_index);
    } else {
      routePath = routeString;
    }

    if (!routePath) routePath = DefaultPageName;
    var values = {};

    if (search) {
      values = pareeUrlQuery(search);
    }

    var pageName = routePath;
    return {
      pageName: pageName,
      values: values
    };
  }

  exports.parseUrl = _parseUrl;

  function pareeUrlQuery(query) {
    var match,
        pl = /\+/g,
        search = /([^&=]+)=?([^&]*)/g,
        decode = function decode(s) {
      return decodeURIComponent(s.replace(pl, " "));
    };

    var urlParams = {};

    while (match = search.exec(query)) {
      urlParams[decode(match[1])] = decode(match[2]);
    }

    return urlParams;
  }

  function createPageUrl(pageName, params) {
    var path_parts = pageName.split('.');
    var path = path_parts.join('/');
    if (!params) return "".concat(path);
    var paramsText = '';

    for (var key in params) {
      var value = params[key];
      if (typeof value == "function" || value == null) continue;
      value = encodeURIComponent(value);
      paramsText = paramsText == '' ? "?".concat(key, "=").concat(value) : paramsText + "&".concat(key, "=").concat(value);
    }

    return "".concat(path).concat(paramsText);
  }

  exports.createPageUrl = createPageUrl;

  var Application =
  /*#__PURE__*/
  function (_PageMaster_1$PageMas) {
    _inherits(Application, _PageMaster_1$PageMas);

    function Application(args) {
      var _this;

      _classCallCheck(this, Application);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(Application).call(this, Application.containers((args || {}).container), (args || {}).parser));
      _this._runned = false;
      return _this;
    }

    _createClass(Application, [{
      key: "parseUrl",
      value: function parseUrl(url) {
        if (!url) throw Errors_1.Errors.argumentNull('url');

        var routeData = _parseUrl(url);

        return routeData;
      }
    }, {
      key: "createUrl",
      value: function createUrl(pageName, values) {
        return createPageUrl(pageName, values);
      }
    }, {
      key: "run",
      value: function run() {
        var _this2 = this;

        if (this._runned) return;

        var showPage = function showPage() {
          var url = location.href;
          var sharpIndex = url.indexOf('#');

          if (sharpIndex < 0) {
            url = '#' + DefaultPageName;
          } else {
            url = url.substr(sharpIndex + 1);
          }

          if (url.startsWith('!')) {
            return;
          }

          _this2.showPage(url);
        };

        showPage();
        window.addEventListener('hashchange', function () {
          if (_this2.location.skip) {
            delete _this2.location.skip;
            return;
          }

          showPage();
        });
        this._runned = true;
      }
    }, {
      key: "setLocationHash",
      value: function setLocationHash(pageUrl) {
        this.location.hash = "#".concat(pageUrl);
        this.location.skip = true;
      }
    }, {
      key: "redirect",
      value: function redirect(pageUrl, args) {
        if (!pageUrl) throw Errors_1.Errors.argumentNull('pageUrl');
        var page = this.showPage(pageUrl, args);
        var url = this.createUrl(page.name, page.data);
        this.setLocationHash(url);
        return page;
      }
    }, {
      key: "forward",
      value: function forward(pageUrl, args, setUrl) {
        if (!pageUrl) throw Errors_1.Errors.argumentNull('pageNameOrUrl');
        if (setUrl == null) setUrl = true;
        var page = this.showPage(pageUrl, args, true);

        if (setUrl) {
          var url = this.createUrl(page.name, page.data);
          this.setLocationHash(url);
        }

        return page;
      }
    }, {
      key: "back",
      value: function back() {
        this.closeCurrentPage();
        setTimeout(function () {
          history.back();
        }, 100);
      }
    }, {
      key: "createService",
      value: function createService(type) {
        var _this3 = this;

        type = type || maishu_chitu_service_1.Service;
        var service = new type();
        service.error.add(function (sender, error) {
          _this3.error.fire(_this3, error, null);
        });
        return service;
      }
    }, {
      key: "location",
      get: function get() {
        return location;
      }
    }], [{
      key: "containers",
      value: function containers(container) {
        var r = {};

        if (container == null) {
          r[Application.DefaultContainerName] = document.body;
          return r;
        }

        if (container.tagName) {
          r[Application.DefaultContainerName] = container;
          return r;
        }

        r = container;
        if (!Application.DefaultContainerName) throw Errors_1.Errors.containerIsNotExists(Application.DefaultContainerName);
        return r;
      }
    }]);

    return Application;
  }(PageMaster_1.PageMaster);

  exports.Application = Application;
  Application.DefaultContainerName = 'default';
});
//# sourceMappingURL=Application.js.map
