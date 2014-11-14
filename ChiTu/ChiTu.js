window.chitu = window.chitu || {};
(function (ns) {
    //var e = ns;

    var _loadingForm;
    var _refreshForm;

    ns.resources = {
        loadingForm: function (value) {
            /// <returns type="String"/>
            return _loadingForm;
        },
        refreshForm: function (value) {
            /// <returns type="String"/>
            return _refreshForm;
        }
    };
    ns.start = function (callback) {
        /// <returns type="jQuery.Deferred"/>
        var paths = new ns.PagePaths('$LoadingForm', []);
        var result = $.when($.ajax('/System/LoadingForm.html'), $.ajax('/System/RefreshForm.html'))
                      .done(function (loadingForm_result, refreshForm_result) {
                          ns.resources.loadingForm(loadingForm_result[0]);
                          ns.resources.refreshForm(refreshForm_result[0]);
                      });
        return result;
    };

    ns.buildModul = function (name, references, func) {
        /// <param name="references" type="Array"/>
        if ($.isArray(name)) {
            references = name;
            name = null;
        }

        if ($.isFunction(name)) {
            references = name;
            name = null;
        }

        if ($.isFunction(references)) {
            func = references;
            references = [];
        }

        (function (factory) {
            if (typeof define === 'function' && define.amd) {
                define(references, factory);
            } else if (typeof module !== 'undefined' && module.exports) {
                module.exports = factory(require(references));
            } else {
                var result = factory($, ko, crossroads);
                if (name)
                    window[name] = result;
            }

        })([], func);
    };

})(chitu);