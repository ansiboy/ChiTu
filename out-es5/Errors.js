"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

define(["require", "exports"], function (require, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var Errors =
  /*#__PURE__*/
  function () {
    function Errors() {
      _classCallCheck(this, Errors);
    }

    _createClass(Errors, null, [{
      key: "pageNodeNotExists",
      value: function pageNodeNotExists(pageName) {
        var msg = "Page node named ".concat(pageName, " is not exists.");
        return new Error(msg);
      }
    }, {
      key: "actionCanntNull",
      value: function actionCanntNull(pageName) {
        var msg = "Action of '".concat(pageName, "' can not be null.");
        return new Error(msg);
      }
    }, {
      key: "argumentNull",
      value: function argumentNull(paramName) {
        var msg = "The argument \"".concat(paramName, "\" cannt be null.");
        return new Error(msg);
      }
    }, {
      key: "modelFileExpecteFunction",
      value: function modelFileExpecteFunction(script) {
        var msg = "The eval result of script file \"".concat(script, "\" is expected a function.");
        return new Error(msg);
      }
    }, {
      key: "paramTypeError",
      value: function paramTypeError(paramName, expectedType) {
        var msg = "The param \"".concat(paramName, "\" is expected \"").concat(expectedType, "\" type.");
        return new Error(msg);
      }
    }, {
      key: "paramError",
      value: function paramError(msg) {
        return new Error(msg);
      }
    }, {
      key: "pathPairRequireView",
      value: function pathPairRequireView(index) {
        var msg = "The view value is required for path pair, but the item with index \"".concat(index, "\" is miss it.");
        return new Error(msg);
      }
    }, {
      key: "notImplemented",
      value: function notImplemented(name) {
        var msg = "'The method \"".concat(name, "\" is not implemented.'");
        return new Error(msg);
      }
    }, {
      key: "routeExists",
      value: function routeExists(name) {
        var msg = "Route named \"".concat(name, "\" is exists.");
        return new Error(msg);
      }
    }, {
      key: "noneRouteMatched",
      value: function noneRouteMatched(url) {
        var msg = "None route matched with url \"".concat(url, "\".");
        var error = new Error(msg);
        return error;
      }
    }, {
      key: "emptyStack",
      value: function emptyStack() {
        return new Error('The stack is empty.');
      }
    }, {
      key: "canntParseUrl",
      value: function canntParseUrl(url) {
        var msg = "Can not parse the url \"".concat(url, "\" to route data.");
        return new Error(msg);
      }
    }, {
      key: "canntParseRouteString",
      value: function canntParseRouteString(routeString) {
        var msg = "Can not parse the route string \"".concat(routeString, "\" to route data.;");
        return new Error(msg);
      }
    }, {
      key: "routeDataRequireController",
      value: function routeDataRequireController() {
        var msg = 'The route data does not contains a "controller" file.';
        return new Error(msg);
      }
    }, {
      key: "routeDataRequireAction",
      value: function routeDataRequireAction() {
        var msg = 'The route data does not contains a "action" file.';
        return new Error(msg);
      }
    }, {
      key: "viewCanntNull",
      value: function viewCanntNull() {
        var msg = 'The view or viewDeferred of the page cannt null.';
        return new Error(msg);
      }
    }, {
      key: "createPageFail",
      value: function createPageFail(pageName) {
        var msg = "Create page \"".concat(pageName, "\" fail.");
        return new Error(msg);
      }
    }, {
      key: "actionTypeError",
      value: function actionTypeError(pageName) {
        var msg = "The action in page '".concat(pageName, "' is expect as function.");
        return new Error(msg);
      }
    }, {
      key: "canntFindAction",
      value: function canntFindAction(pageName) {
        var msg = "Cannt find action in page '".concat(pageName, "', is the exports has default field?");
        return new Error(msg);
      }
    }, {
      key: "exportsCanntNull",
      value: function exportsCanntNull(pageName) {
        var msg = "Exports of page '".concat(pageName, "' is null.");
        return new Error(msg);
      }
    }, {
      key: "scrollerElementNotExists",
      value: function scrollerElementNotExists() {
        var msg = "Scroller element is not exists.";
        return new Error(msg);
      }
    }, {
      key: "resourceExists",
      value: function resourceExists(resourceName, pageName) {
        var msg = "Rosource '".concat(resourceName, "' is exists in the resources of page '").concat(pageName, "'.");
        return new Error(msg);
      }
    }, {
      key: "siteMapRootCanntNull",
      value: function siteMapRootCanntNull() {
        var msg = "The site map root node can not be null.";
        return new Error(msg);
      }
    }, {
      key: "duplicateSiteMapNode",
      value: function duplicateSiteMapNode(name) {
        var msg = "The site map node ".concat(name, " is exists.");
        return new Error(msg);
      }
    }, {
      key: "unexpectedNullValue",
      value: function unexpectedNullValue() {
        var msg = "Unexpected null value.";
        return new Error(msg);
      }
    }, {
      key: "containerIsNotExists",
      value: function containerIsNotExists(name) {
        var msg = "Container '".concat(name, "' is not exists");
        return new Error(msg);
      }
    }]);

    return Errors;
  }();

  exports.Errors = Errors;
});
//# sourceMappingURL=Errors.js.map
