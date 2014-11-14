(function (ns) {
    var e = ns.Error;

    ns.ActionResult = function () { };
    ns.ActionResult.prototype = {
        executeResult: function () {
            throw ns.Error.notImplemented('executeResult');
        }
    };

    ns.ViewResult = function (name) {
        if (!name)
            throw e.argumentNull('name');

        this._name = name;
    };
    ns.ViewResult.prototype = {
        executeResult: function () {

        }
    };
})(chitu);