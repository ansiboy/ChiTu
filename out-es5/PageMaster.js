"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

define(["require", "exports", "maishu-chitu-service", "./Page", "./Application", "./Errors"], function (require, exports, maishu_chitu_service_1, Page_1, Application_1, Errors_1) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var PageMaster =
  /*#__PURE__*/
  function () {
    function PageMaster(containers, parser) {
      _classCallCheck(this, PageMaster);

      this.pageCreated = maishu_chitu_service_1.Callbacks();
      this.pageShowing = maishu_chitu_service_1.Callbacks();
      this.pageShown = maishu_chitu_service_1.Callbacks();
      this.pageType = Page_1.Page;
      this.pageDisplayType = Page_1.PageDisplayerImplement;
      this.cachePages = {};
      this.page_stack = new Array();
      this.nodes = {};
      this.MAX_PAGE_COUNT = 100;
      this.pageTagName = "div";
      this.pagePlaceholder = PageMaster.defaultPagePlaceholder;
      this.error = maishu_chitu_service_1.Callbacks();
      this._defaultPageNodeParser = null;
      this.parser = parser || this.defaultPageNodeParser;
      if (!containers) throw Errors_1.Errors.argumentNull("containers");
      this.parser.actions = this.parser.actions || {};
      this.containers = containers;
    }

    _createClass(PageMaster, [{
      key: "sendMessage",
      value: function sendMessage(sender, page, message) {
        var pages;
        if (typeof page == "string") pages = this.page_stack.filter(function (o) {
          return o.name == page;
        });else pages = this.page_stack.filter(function (o) {
          return o instanceof page;
        });
        pages.forEach(function (p) {
          p.messageReceived.fire(sender, message);
        });
      }
    }, {
      key: "createDefaultAction",
      value: function createDefaultAction(url, loadjs) {
        var _this = this;

        return function (page) {
          return __awaiter(_this, void 0, void 0,
          /*#__PURE__*/
          regeneratorRuntime.mark(function _callee() {
            var actionExports, _action, result, action, _action2;

            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.next = 2;
                    return loadjs(url);

                  case 2:
                    actionExports = _context.sent;

                    if (actionExports) {
                      _context.next = 5;
                      break;
                    }

                    throw Errors_1.Errors.exportsCanntNull(url);

                  case 5:
                    _action = actionExports.default;

                    if (!(_action == null)) {
                      _context.next = 8;
                      break;
                    }

                    throw Errors_1.Errors.canntFindAction(page.name);

                  case 8:
                    if (PageMaster.isClass(_action)) {
                      action = _action;
                      result = new action(page, this);
                    } else {
                      _action2 = _action;
                      result = _action2(page, this);
                    }

                    return _context.abrupt("return", result);

                  case 10:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));
        };
      }
    }, {
      key: "loadjs",
      value: function loadjs(path) {
        return new Promise(function (reslove, reject) {
          requirejs([path], function (result) {
            reslove(result);
          }, function (err) {
            reject(err);
          });
        });
      }
    }, {
      key: "on_pageCreated",
      value: function on_pageCreated(page) {
        return this.pageCreated.fire(this, page);
      }
    }, {
      key: "cachePageKey",
      value: function cachePageKey(containerName, pageUrl) {
        var key = "".concat(containerName, "_").concat(pageUrl);
        return key;
      }
    }, {
      key: "getPage",
      value: function getPage(pageUrl, containerName, values) {
        if (!pageUrl) throw Errors_1.Errors.argumentNull('pageUrl');
        var key = this.cachePageKey(containerName, pageUrl);
        values = values || {};
        var cachePage = this.cachePages[key];

        if (cachePage != null) {
          var r = Application_1.parseUrl(pageUrl);
          cachePage.data = Object.assign(values || {}, r.values);
          return {
            page: cachePage,
            isNew: false
          };
        }

        var page = this.createPage(pageUrl, containerName, values);
        this.cachePages[key] = page;
        this.on_pageCreated(page);
        return {
          page: page,
          isNew: true
        };
      }
    }, {
      key: "createPage",
      value: function createPage(pageUrl, containerName, values) {
        var _this2 = this;

        if (!pageUrl) throw Errors_1.Errors.argumentNull('pageUrl');
        if (!containerName) throw Errors_1.Errors.argumentNull('containerName');
        values = values || {};
        var r = Application_1.parseUrl(pageUrl);
        var element = this.createPageElement(r.pageName, containerName);
        var displayer = new this.pageDisplayType(this);
        var container = this.containers[containerName];
        if (!container) throw Errors_1.Errors.containerIsNotExists(containerName);
        console.assert(this.pageType != null);
        var page = new this.pageType({
          app: this,
          url: pageUrl,
          data: values,
          displayer: displayer,
          element: element,
          container: {
            name: containerName,
            element: container
          }
        });

        var showing = function showing(sender) {
          for (var key in _this2.containers) {
            if (key == sender.container.name) {
              sender.container.element.style.removeProperty('display');
            } else {
              _this2.containers[key].style.display = 'none';
            }
          }

          _this2.pageShowing.fire(_this2, sender);
        };

        var shown = function shown(sender) {
          _this2.pageShown.fire(_this2, sender);
        };

        page.showing.add(showing);
        page.shown.add(shown);
        page.closed.add(function () {
          page.showing.remove(showing);
          page.shown.remove(shown);

          var key = _this2.cachePageKey(page.container.name, page.url);

          delete _this2.cachePages[key];
          _this2.page_stack = _this2.page_stack.filter(function (o) {
            return o != page;
          });
        });
        return page;
      }
    }, {
      key: "createPageElement",
      value: function createPageElement(pageName, containerName) {
        if (!containerName) throw Errors_1.Errors.argumentNull('containerName');
        var container = this.containers[containerName];
        if (!container) throw Errors_1.Errors.containerIsNotExists(containerName);
        var placeholder = container.querySelector(".".concat(this.pagePlaceholder));
        if (placeholder == null) placeholder = container;
        var element = document.createElement(this.pageTagName);
        placeholder.appendChild(element);
        return element;
      }
    }, {
      key: "showPage",
      value: function showPage(pageUrl, args, forceRender) {
        args = args || {};
        forceRender = forceRender == null ? false : true;
        var values = {};
        var funs = {};

        for (var key in args) {
          var arg = args[key];

          if (typeof arg == 'function') {
            funs[key] = arg;
          } else {
            values[key] = arg;
          }
        }

        var r = Application_1.parseUrl(pageUrl);
        values = Object.assign(values, r.values);
        pageUrl = Application_1.createPageUrl(r.pageName, values);
        if (!pageUrl) throw Errors_1.Errors.argumentNull('pageName');
        if (this.currentPage != null && this.currentPage.url == pageUrl) return this.currentPage;
        var containerName = values.container || Application_1.Application.DefaultContainerName;

        var _this$getPage = this.getPage(pageUrl, containerName, args),
            page = _this$getPage.page,
            isNew = _this$getPage.isNew;

        if (isNew || forceRender) {
          var action = this.findPageAction(pageUrl);
          if (action == null) throw Errors_1.Errors.actionCanntNull(pageUrl);
          action(page, this);
        }

        page.show();
        this.pushPage(page);
        console.assert(page == this.currentPage, "page is not current page");
        return page;
      }
    }, {
      key: "reload",
      value: function reload(page) {
        var action = this.findPageAction(page.url);
        console.assert(action != null);
        action(page, this);
      }
    }, {
      key: "pushPage",
      value: function pushPage(page) {
        this.page_stack.push(page);

        if (this.page_stack.length > this.MAX_PAGE_COUNT) {
          var _page = this.page_stack.shift();

          if (_page) {
            _page.close();
          }
        }
      }
    }, {
      key: "findPageAction",
      value: function findPageAction(pageUrl) {
        var routeData = Application_1.parseUrl(pageUrl);
        var pageName = routeData.pageName;
        var node = this.findPageNode(pageName);
        if (node == null) throw Errors_1.Errors.pageNodeNotExists(pageName);
        var action = node.action;
        if (action == null) throw Errors_1.Errors.actionCanntNull(pageName);
        return node.action;
      }
    }, {
      key: "findPageNode",
      value: function findPageNode(pageName) {
        if (this.nodes[pageName]) return this.nodes[pageName];
        var node = null;
        var action = this.parser.actions ? this.parser.actions[pageName] : null;

        if (action != null) {
          node = {
            action: action,
            name: pageName
          };
        }

        if (node == null && this.parser.parse != null) {
          node = this.parser.parse(pageName, this);
          console.assert(node.action != null);
        }

        if (node != null) this.nodes[pageName] = node;
        return node;
      }
    }, {
      key: "closeCurrentPage",
      value: function closeCurrentPage(passData) {
        var page = this.page_stack.pop();
        if (page == null) return;
        page.close();

        if (this.currentPage) {
          if (passData) {
            console.assert(this.currentPage.data != null);
            this.currentPage.data = Object.assign(this.currentPage.data, passData);
          }

          this.currentPage.show();
        }
      }
    }, {
      key: "defaultPageNodeParser",
      get: function get() {
        var _this3 = this;

        if (this._defaultPageNodeParser == null) {
          var nodes = {};
          this._defaultPageNodeParser = {
            actions: {},
            parse: function parse(pageName) {
              var node = nodes[pageName];

              if (node == null) {
                var path = "modules_".concat(pageName).split('_').join('/');
                node = {
                  action: _this3.createDefaultAction(path, _this3.loadjs),
                  name: pageName
                };
                nodes[pageName] = node;
              }

              return node;
            }
          };
        }

        return this._defaultPageNodeParser;
      }
    }, {
      key: "currentPage",
      get: function get() {
        if (this.page_stack.length > 0) return this.page_stack[this.page_stack.length - 1];
        return null;
      }
    }, {
      key: "pageStack",
      get: function get() {
        return this.page_stack;
      }
    }]);

    return PageMaster;
  }();

  exports.PageMaster = PageMaster;
  PageMaster.defaultPagePlaceholder = "page-placeholder";

  PageMaster.isClass = function () {
    var toString = Function.prototype.toString;

    function fnBody(fn) {
      return toString.call(fn).replace(/^[^{]*{\s*/, '').replace(/\s*}[^}]*$/, '');
    }

    function isClass(fn) {
      return typeof fn === 'function' && (/^class(\s|\{\}$)/.test(toString.call(fn)) || /^.*classCallCheck\(/.test(fnBody(fn)));
    }

    return isClass;
  }();
});
//# sourceMappingURL=PageMaster.js.map
