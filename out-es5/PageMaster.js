"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
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
      result.done ? resolve(result.value) : new P(function (resolve) {
        resolve(result.value);
      }).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

define(["require", "exports", "maishu-chitu-service", "./Page", "./Errors"], function (require, exports, maishu_chitu_service_1, Page_1, Errors_1) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var PageMaster =
  /*#__PURE__*/
  function () {
    function PageMaster(container, parser) {
      _classCallCheck(this, PageMaster);

      this.pageCreated = maishu_chitu_service_1.Callbacks();
      this.pageShowing = maishu_chitu_service_1.Callbacks();
      this.pageShown = maishu_chitu_service_1.Callbacks();
      this.pageType = Page_1.Page;
      this.pageDisplayType = Page_1.PageDisplayerImplement;
      this.cachePages = {};
      this.page_stack = new Array();
      this.nodes = {};
      this.error = maishu_chitu_service_1.Callbacks();
      this.parser = parser || this.defaultPageNodeParser();
      if (!container) throw Errors_1.Errors.argumentNull("container");
      this.parser.actions = this.parser.actions || {};
      this.container = container;
    }

    _createClass(PageMaster, [{
      key: "defaultPageNodeParser",
      value: function defaultPageNodeParser() {
        var _this = this;

        var nodes = {};
        var p = {
          actions: {},
          parse: function parse(pageName) {
            var node = nodes[pageName];

            if (node == null) {
              var path = "modules_".concat(pageName).split('_').join('/');
              node = {
                action: _this.createDefaultAction(path, _this.loadjs),
                name: pageName
              };
              nodes[pageName] = node;
            }

            return node;
          }
        };
        return p;
      }
    }, {
      key: "createDefaultAction",
      value: function createDefaultAction(url, loadjs) {
        var _this2 = this;

        return function (page) {
          return __awaiter(_this2, void 0, void 0,
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
      key: "getPage",
      value: function getPage(node, values) {
        console.assert(node != null);
        values = values || {};
        var pageName = node.name;
        var cachePage = this.cachePages[pageName];

        if (cachePage != null) {
          cachePage.data = values || {};
          return {
            page: cachePage,
            isNew: false
          };
        }

        var page = this.createPage(pageName, values);
        this.cachePages[pageName] = page;
        this.on_pageCreated(page);
        return {
          page: page,
          isNew: true
        };
      }
    }, {
      key: "createPage",
      value: function createPage(pageName, values) {
        var _this3 = this;

        if (!pageName) throw Errors_1.Errors.argumentNull('pageName');
        values = values || {};
        var element = this.createPageElement(pageName);
        var displayer = new this.pageDisplayType(this);
        console.assert(this.pageType != null);
        var page = new this.pageType({
          app: this,
          name: pageName,
          data: values,
          displayer: displayer,
          element: element
        });

        var showing = function showing(sender) {
          _this3.pageShowing.fire(_this3, sender);
        };

        var shown = function shown(sender) {
          _this3.pageShown.fire(_this3, sender);
        };

        page.showing.add(showing);
        page.shown.add(shown);
        page.closed.add(function () {
          page.showing.remove(showing);
          page.shown.remove(shown);
        });
        return page;
      }
    }, {
      key: "createPageElement",
      value: function createPageElement(pageName) {
        var element = document.createElement(Page_1.Page.tagName);
        this.container.appendChild(element);
        return element;
      }
    }, {
      key: "showPage",
      value: function showPage(pageName, args, forceRender) {
        args = args || {};
        forceRender = forceRender == null ? false : true;
        if (!pageName) throw Errors_1.Errors.argumentNull('pageName');
        var node = this.findSiteMapNode(pageName);
        if (node == null) throw Errors_1.Errors.pageNodeNotExists(pageName);
        if (this.currentPage != null && this.currentPage.name == pageName) return this.currentPage;

        var _this$getPage = this.getPage(node, args),
            page = _this$getPage.page,
            isNew = _this$getPage.isNew;

        if (isNew || forceRender) {
          var siteMapNode = this.findSiteMapNode(pageName);
          if (siteMapNode == null) throw Errors_1.Errors.pageNodeNotExists(pageName);
          var action = siteMapNode.action;
          if (action == null) throw Errors_1.Errors.actionCanntNull(pageName);
          action(page, this);
        }

        page.show();
        this.pushPage(page);
        console.assert(page == this.currentPage, "page is not current page");
        return page;
      }
    }, {
      key: "closePage",
      value: function closePage(page) {
        if (page == null) throw Errors_1.Errors.argumentNull('page');
        page.close();
        delete this.cachePages[page.name];
        this.page_stack = this.page_stack.filter(function (o) {
          return o != page;
        });
      }
    }, {
      key: "pushPage",
      value: function pushPage(page) {
        this.page_stack.push(page);
      }
    }, {
      key: "findSiteMapNode",
      value: function findSiteMapNode(pageName) {
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
          node = this.parser.parse(pageName);
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
        this.closePage(page);

        if (this.currentPage) {
          if (passData) {
            console.assert(this.currentPage.data != null);
            this.currentPage.data = Object.assign(this.currentPage.data, passData);
          }

          this.currentPage.show();
        }
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

  exports.PageMaster = PageMaster;
});
//# sourceMappingURL=PageMaster.js.map
