(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(require(['jquery']));
    } else {
        window.chitu = factory();
    }

})(function () {
;/** @license
 * crossroads <http://millermedeiros.github.com/crossroads.js/>
 * Author: Miller Medeiros | MIT License
 * v0.12.0 (2013/01/21 13:47)
 */

//(function () {
var factory = function (signals) {

    var crossroads,
        _hasOptionalGroupBug,
        UNDEF;

    // Helpers -----------
    //====================

    // IE 7-8 capture optional groups as empty strings while other browsers
    // capture as `undefined`
    _hasOptionalGroupBug = (/t(.+)?/).exec('t')[1] === '';

    function arrayIndexOf(arr, val) {
        if (arr.indexOf) {
            return arr.indexOf(val);
        } else {
            //Array.indexOf doesn't work on IE 6-7
            var n = arr.length;
            while (n--) {
                if (arr[n] === val) {
                    return n;
                }
            }
            return -1;
        }
    }

    function arrayRemove(arr, item) {
        var i = arrayIndexOf(arr, item);
        if (i !== -1) {
            arr.splice(i, 1);
        }
    }

    function isKind(val, kind) {
        return '[object ' + kind + ']' === Object.prototype.toString.call(val);
    }

    function isRegExp(val) {
        return isKind(val, 'RegExp');
    }

    function isArray(val) {
        return isKind(val, 'Array');
    }

    function isFunction(val) {
        return typeof val === 'function';
    }

    //borrowed from AMD-utils
    function typecastValue(val) {
        var r;
        if (val === null || val === 'null') {
            r = null;
        } else if (val === 'true') {
            r = true;
        } else if (val === 'false') {
            r = false;
        } else if (val === UNDEF || val === 'undefined') {
            r = UNDEF;
        } else if (val === '' || isNaN(val)) {
            //isNaN('') returns false
            r = val;
        } else {
            //parseFloat(null || '') returns NaN
            r = parseFloat(val);
        }
        return r;
    }

    function typecastArrayValues(values) {
        var n = values.length,
            result = [];
        while (n--) {
            result[n] = typecastValue(values[n]);
        }
        return result;
    }

    //borrowed from AMD-Utils
    function decodeQueryString(str, shouldTypecast) {
        var queryArr = (str || '').replace('?', '').split('&'),
            n = queryArr.length,
            obj = {},
            item, val;
        while (n--) {
            item = queryArr[n].split('=');
            val = shouldTypecast ? typecastValue(item[1]) : item[1];
            obj[item[0]] = (typeof val === 'string') ? decodeURIComponent(val) : val;
        }
        return obj;
    }


    // Crossroads --------
    //====================

    /**
     * @constructor
     */
    function Crossroads() {
        //===========================================
        //this.bypassed = new signals.Signal();
        //this.routed = new signals.Signal();
        //=============== My Code ===================
        this.bypassed = $.Callbacks();
        this.routed = $.Callbacks();
        //===========================================
        this._routes = [];
        this._prevRoutes = [];
        this._piped = [];
        this.resetState();
    }

    Crossroads.prototype = {

        greedy: false,

        greedyEnabled: true,

        ignoreCase: true,

        ignoreState: false,

        shouldTypecast: false,

        normalizeFn: null,

        resetState: function () {
            this._prevRoutes.length = 0;
            this._prevMatchedRequest = null;
            this._prevBypassedRequest = null;
        },

        create: function () {
            return new Crossroads();
        },

        addRoute: function (pattern, callback, priority) {
            var route = new Route(pattern, callback, priority, this);
            this._sortedInsert(route);
            return route;
        },

        removeRoute: function (route) {
            arrayRemove(this._routes, route);
            route._destroy();
        },

        removeAllRoutes: function () {
            var n = this.getNumRoutes();
            while (n--) {
                this._routes[n]._destroy();
            }
            this._routes.length = 0;
        },

        parse: function (request, defaultArgs) {
            request = request || '';
            defaultArgs = defaultArgs || [];

            // should only care about different requests if ignoreState isn't true
            if (!this.ignoreState &&
                (request === this._prevMatchedRequest ||
                 request === this._prevBypassedRequest)) {
                return;
            }

            var routes = this._getMatchedRoutes(request),
                i = 0,
                n = routes.length,
                cur;

            if (n) {
                this._prevMatchedRequest = request;

                this._notifyPrevRoutes(routes, request);
                this._prevRoutes = routes;
                //should be incremental loop, execute routes in order
                while (i < n) {
                    cur = routes[i];
                    //======================================================================================
                    //cur.route.matched.dispatch.apply(cur.route.matched, defaultArgs.concat(cur.params));
                    //====================== My Code =======================================================
                    cur.route.matched.fire.apply(cur.route.matched, defaultArgs.concat(cur.params));
                    //======================================================================================

                    cur.isFirst = !i;

                    //======================================================================================
                    //this.routed.dispatch.apply(this.routed, defaultArgs.concat([request, cur]));
                    //====================== My Code =======================================================
                    this.routed.fire.apply(this.routed, defaultArgs.concat([request, cur]));
                    //======================================================================================
                    i += 1;
                }
            } else {
                this._prevBypassedRequest = request;
                //==========================================================================
                //this.bypassed.dispatch.apply(this.bypassed, defaultArgs.concat([request]));
                //==========================================================================
                this.bypassed.fire.apply(this.bypassed, defaultArgs.concat([request]));
                //==========================================================================
            }

            this._pipeParse(request, defaultArgs);
        },

        _notifyPrevRoutes: function (matchedRoutes, request) {
            var i = 0, prev;
            while (prev = this._prevRoutes[i++]) {
                //check if switched exist since route may be disposed
                if (prev.route.switched && this._didSwitch(prev.route, matchedRoutes)) {
                    //==========================================
                    //prev.route.switched.dispatch(request);
                    //============= My Code ====================
                    prev.route.switched.fire(request);
                    //==========================================
                }
            }
        },

        _didSwitch: function (route, matchedRoutes) {
            var matched,
                i = 0;
            while (matched = matchedRoutes[i++]) {
                // only dispatch switched if it is going to a different route
                if (matched.route === route) {
                    return false;
                }
            }
            return true;
        },

        _pipeParse: function (request, defaultArgs) {
            var i = 0, route;
            while (route = this._piped[i++]) {
                route.parse(request, defaultArgs);
            }
        },

        getNumRoutes: function () {
            return this._routes.length;
        },

        _sortedInsert: function (route) {
            //simplified insertion sort
            var routes = this._routes,
                n = routes.length;
            do { --n; } while (routes[n] && route._priority <= routes[n]._priority);
            routes.splice(n + 1, 0, route);
        },

        _getMatchedRoutes: function (request) {
            var res = [],
                routes = this._routes,
                n = routes.length,
                route;
            //should be decrement loop since higher priorities are added at the end of array
            while (route = routes[--n]) {
                if ((!res.length || this.greedy || route.greedy) && route.match(request)) {
                    res.push({
                        route: route,
                        params: route._getParamsArray(request)
                    });
                }
                if (!this.greedyEnabled && res.length) {
                    break;
                }
            }
            return res;
        },

        pipe: function (otherRouter) {
            this._piped.push(otherRouter);
        },

        unpipe: function (otherRouter) {
            arrayRemove(this._piped, otherRouter);
        },

        toString: function () {
            return '[crossroads numRoutes:' + this.getNumRoutes() + ']';
        }
    };

    //"static" instance
    crossroads = new Crossroads();
    crossroads.VERSION = '0.12.0';

    crossroads.NORM_AS_ARRAY = function (req, vals) {
        return [vals.vals_];
    };

    crossroads.NORM_AS_OBJECT = function (req, vals) {
        return [vals];
    };


    // Route --------------
    //=====================

    /**
     * @constructor
     */
    function Route(pattern, callback, priority, router) {
        var isRegexPattern = isRegExp(pattern),
            patternLexer = router.patternLexer;
        this._router = router;
        this._pattern = pattern;
        this._paramsIds = isRegexPattern ? null : patternLexer.getParamIds(pattern);
        this._optionalParamsIds = isRegexPattern ? null : patternLexer.getOptionalParamsIds(pattern);
        this._matchRegexp = isRegexPattern ? pattern : patternLexer.compilePattern(pattern, router.ignoreCase);

        //===============================================
        //this.matched = new signals.Signal();
        //this.switched = new signals.Signal();
        //============== My Code ========================
        this.matched = $.Callbacks();
        this.switched = $.Callbacks();
        //===============================================


        if (callback) {
            this.matched.add(callback);
        }
        this._priority = priority || 0;
    }

    Route.prototype = {

        greedy: false,

        rules: void (0),

        match: function (request) {
            request = request || '';
            return this._matchRegexp.test(request) && this._validateParams(request); //validate params even if regexp because of `request_` rule.
        },

        _validateParams: function (request) {
            var rules = this.rules,
                values = this._getParamsObject(request),
                key;
            for (key in rules) {
                // normalize_ isn't a validation rule... (#39)
                if (key !== 'normalize_' && rules.hasOwnProperty(key) && !this._isValidParam(request, key, values)) {
                    return false;
                }
            }
            return true;
        },

        _isValidParam: function (request, prop, values) {
            var validationRule = this.rules[prop],
                val = values[prop],
                isValid = false,
                isQuery = (prop.indexOf('?') === 0);

            if (val == null && this._optionalParamsIds && arrayIndexOf(this._optionalParamsIds, prop) !== -1) {
                isValid = true;
            }
            else if (isRegExp(validationRule)) {
                if (isQuery) {
                    val = values[prop + '_']; //use raw string
                }
                isValid = validationRule.test(val);
            }
            else if (isArray(validationRule)) {
                if (isQuery) {
                    val = values[prop + '_']; //use raw string
                }
                isValid = this._isValidArrayRule(validationRule, val);
            }
            else if (isFunction(validationRule)) {
                isValid = validationRule(val, request, values);
            }

            return isValid; //fail silently if validationRule is from an unsupported type
        },

        _isValidArrayRule: function (arr, val) {
            if (!this._router.ignoreCase) {
                return arrayIndexOf(arr, val) !== -1;
            }

            if (typeof val === 'string') {
                val = val.toLowerCase();
            }

            var n = arr.length,
                item,
                compareVal;

            while (n--) {
                item = arr[n];
                compareVal = (typeof item === 'string') ? item.toLowerCase() : item;
                if (compareVal === val) {
                    return true;
                }
            }
            return false;
        },

        _getParamsObject: function (request) {
            var shouldTypecast = this._router.shouldTypecast,
                values = this._router.patternLexer.getParamValues(request, this._matchRegexp, shouldTypecast),
                o = {},
                n = values.length,
                param, val;
            while (n--) {
                val = values[n];
                if (this._paramsIds) {
                    param = this._paramsIds[n];
                    if (param.indexOf('?') === 0 && val) {
                        //make a copy of the original string so array and
                        //RegExp validation can be applied properly
                        o[param + '_'] = val;
                        //update vals_ array as well since it will be used
                        //during dispatch
                        val = decodeQueryString(val, shouldTypecast);
                        values[n] = val;
                    }
                    // IE will capture optional groups as empty strings while other
                    // browsers will capture `undefined` so normalize behavior.
                    // see: #gh-58, #gh-59, #gh-60
                    if (_hasOptionalGroupBug && val === '' && arrayIndexOf(this._optionalParamsIds, param) !== -1) {
                        val = void (0);
                        values[n] = val;
                    }
                    o[param] = val;
                }
                //alias to paths and for RegExp pattern
                o[n] = val;
            }
            o.request_ = shouldTypecast ? typecastValue(request) : request;
            o.vals_ = values;
            return o;
        },

        _getParamsArray: function (request) {
            var norm = this.rules ? this.rules.normalize_ : null,
                params;
            norm = norm || this._router.normalizeFn; // default normalize
            if (norm && isFunction(norm)) {
                params = norm(request, this._getParamsObject(request));
            } else {
                params = this._getParamsObject(request).vals_;
            }
            return params;
        },

        interpolate: function (replacements) {
            var str = this._router.patternLexer.interpolate(this._pattern, replacements);
            if (!this._validateParams(str)) {
                throw new Error('Generated string doesn\'t validate against `Route.rules`.');
            }
            return str;
        },

        dispose: function () {
            this._router.removeRoute(this);
        },

        _destroy: function () {
            //========================================
            //this.matched.dispose();
            //this.switched.dispose();
            //=============== My Code ================
            this.matched.empty();
            this.switched.empty();
            //========================================
            this.matched = this.switched = this._pattern = this._matchRegexp = null;
        },

        toString: function () {
            return '[Route pattern:"' + this._pattern + '", numListeners:' + this.matched.getNumListeners() + ']';
        }

    };



    // Pattern Lexer ------
    //=====================

    Crossroads.prototype.patternLexer = (function () {

        var
            //match chars that should be escaped on string regexp
            ESCAPE_CHARS_REGEXP = /[\\.+*?\^$\[\](){}\/'#]/g,

            //trailing slashes (begin/end of string)
            LOOSE_SLASHES_REGEXP = /^\/|\/$/g,
            LEGACY_SLASHES_REGEXP = /\/$/g,

            //params - everything between `{ }` or `: :`
            PARAMS_REGEXP = /(?:\{|:)([^}:]+)(?:\}|:)/g,

            //used to save params during compile (avoid escaping things that
            //shouldn't be escaped).
            TOKENS = {
                'OS': {
                    //optional slashes
                    //slash between `::` or `}:` or `\w:` or `:{?` or `}{?` or `\w{?`
                    rgx: /([:}]|\w(?=\/))\/?(:|(?:\{\?))/g,
                    save: '$1{{id}}$2',
                    res: '\\/?'
                },
                'RS': {
                    //required slashes
                    //used to insert slash between `:{` and `}{`
                    rgx: /([:}])\/?(\{)/g,
                    save: '$1{{id}}$2',
                    res: '\\/'
                },
                'RQ': {
                    //required query string - everything in between `{? }`
                    rgx: /\{\?([^}]+)\}/g,
                    //everything from `?` till `#` or end of string
                    res: '\\?([^#]+)'
                },
                'OQ': {
                    //optional query string - everything in between `:? :`
                    rgx: /:\?([^:]+):/g,
                    //everything from `?` till `#` or end of string
                    res: '(?:\\?([^#]*))?'
                },
                'OR': {
                    //optional rest - everything in between `: *:`
                    rgx: /:([^:]+)\*:/g,
                    res: '(.*)?' // optional group to avoid passing empty string as captured
                },
                'RR': {
                    //rest param - everything in between `{ *}`
                    rgx: /\{([^}]+)\*\}/g,
                    res: '(.+)'
                },
                // required/optional params should come after rest segments
                'RP': {
                    //required params - everything between `{ }`
                    rgx: /\{([^}]+)\}/g,
                    res: '([^\\/?]+)'
                },
                'OP': {
                    //optional params - everything between `: :`
                    rgx: /:([^:]+):/g,
                    res: '([^\\/?]+)?\/?'
                }
            },

            LOOSE_SLASH = 1,
            STRICT_SLASH = 2,
            LEGACY_SLASH = 3,

            _slashMode = LOOSE_SLASH;


        function precompileTokens() {
            var key, cur;
            for (key in TOKENS) {
                if (TOKENS.hasOwnProperty(key)) {
                    cur = TOKENS[key];
                    cur.id = '__CR_' + key + '__';
                    cur.save = ('save' in cur) ? cur.save.replace('{{id}}', cur.id) : cur.id;
                    cur.rRestore = new RegExp(cur.id, 'g');
                }
            }
        }
        precompileTokens();


        function captureVals(regex, pattern) {
            var vals = [], match;
            // very important to reset lastIndex since RegExp can have "g" flag
            // and multiple runs might affect the result, specially if matching
            // same string multiple times on IE 7-8
            regex.lastIndex = 0;
            while (match = regex.exec(pattern)) {
                vals.push(match[1]);
            }
            return vals;
        }

        function getParamIds(pattern) {
            return captureVals(PARAMS_REGEXP, pattern);
        }

        function getOptionalParamsIds(pattern) {
            return captureVals(TOKENS.OP.rgx, pattern);
        }

        function compilePattern(pattern, ignoreCase) {
            pattern = pattern || '';

            if (pattern) {
                if (_slashMode === LOOSE_SLASH) {
                    pattern = pattern.replace(LOOSE_SLASHES_REGEXP, '');
                }
                else if (_slashMode === LEGACY_SLASH) {
                    pattern = pattern.replace(LEGACY_SLASHES_REGEXP, '');
                }

                //save tokens
                pattern = replaceTokens(pattern, 'rgx', 'save');
                //regexp escape
                pattern = pattern.replace(ESCAPE_CHARS_REGEXP, '\\$&');
                //restore tokens
                pattern = replaceTokens(pattern, 'rRestore', 'res');

                if (_slashMode === LOOSE_SLASH) {
                    pattern = '\\/?' + pattern;
                }
            }

            if (_slashMode !== STRICT_SLASH) {
                //single slash is treated as empty and end slash is optional
                pattern += '\\/?';
            }
            return new RegExp('^' + pattern + '$', ignoreCase ? 'i' : '');
        }

        function replaceTokens(pattern, regexpName, replaceName) {
            var cur, key;
            for (key in TOKENS) {
                if (TOKENS.hasOwnProperty(key)) {
                    cur = TOKENS[key];
                    pattern = pattern.replace(cur[regexpName], cur[replaceName]);
                }
            }
            return pattern;
        }

        function getParamValues(request, regexp, shouldTypecast) {
            var vals = regexp.exec(request);
            if (vals) {
                vals.shift();
                if (shouldTypecast) {
                    vals = typecastArrayValues(vals);
                }
            }
            return vals;
        }

        function interpolate(pattern, replacements) {
            if (typeof pattern !== 'string') {
                throw new Error('Route pattern should be a string.');
            }

            var replaceFn = function (match, prop) {
                var val;
                prop = (prop.substr(0, 1) === '?') ? prop.substr(1) : prop;
                if (replacements[prop] != null) {
                    if (typeof replacements[prop] === 'object') {
                        var queryParts = [];
                        for (var key in replacements[prop]) {
                            queryParts.push(encodeURI(key + '=' + replacements[prop][key]));
                        }
                        val = '?' + queryParts.join('&');
                    } else {
                        // make sure value is a string see #gh-54
                        val = String(replacements[prop]);
                    }

                    if (match.indexOf('*') === -1 && val.indexOf('/') !== -1) {
                        throw new Error('Invalid value "' + val + '" for segment "' + match + '".');
                    }
                }
                else if (match.indexOf('{') !== -1) {
                    throw new Error('The segment ' + match + ' is required.');
                }
                else {
                    val = '';
                }
                return val;
            };

            if (!TOKENS.OS.trail) {
                TOKENS.OS.trail = new RegExp('(?:' + TOKENS.OS.id + ')+$');
            }

            return pattern
                        .replace(TOKENS.OS.rgx, TOKENS.OS.save)
                        .replace(PARAMS_REGEXP, replaceFn)
                        .replace(TOKENS.OS.trail, '') // remove trailing
                        .replace(TOKENS.OS.rRestore, '/'); // add slash between segments
        }

        //API
        return {
            strict: function () {
                _slashMode = STRICT_SLASH;
            },
            loose: function () {
                _slashMode = LOOSE_SLASH;
            },
            legacy: function () {
                _slashMode = LEGACY_SLASH;
            },
            getParamIds: getParamIds,
            getOptionalParamsIds: getOptionalParamsIds,
            getParamValues: getParamValues,
            compilePattern: compilePattern,
            interpolate: interpolate
        };

    }());

    window['crossroads'] = crossroads;
    return crossroads;
};

//if (typeof define === 'function' && define.amd) {
//    define(['jquery'], factory);
//} else if (typeof module !== 'undefined' && module.exports) { //Node
//    module.exports = factory(require('jquery'));
//} else {
/*jshint sub:true */
window['crossroads'] = factory(window['jQuery']);
//}

//}());

;var chitu;
(function (chitu) {
    var e = chitu.Errors;
    var Utility = (function () {
        function Utility() {
        }
        Utility.isType = function (targetType, obj) {
            for (var key in targetType.prototype) {
                if (obj[key] === undefined)
                    return false;
            }
            return true;
        };
        Utility.isDeferred = function (obj) {
            if (obj == null)
                return false;
            if (obj.pipe != null && obj.always != null && obj.done != null)
                return true;
            return false;
        };
        Utility.format = function (source, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
            var params = [arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10];
            for (var i = 0; i < params.length; i++) {
                if (params[i] == null)
                    break;
                source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function () {
                    return params[i];
                });
            }
            return source;
        };
        Utility.fileName = function (url, withExt) {
            if (!url)
                throw e.argumentNull('url');
            withExt = withExt || true;
            url = url.replace('http://', '/');
            var filename = url.replace(/^.*[\\\/]/, '');
            if (withExt === true) {
                var arr = filename.split('.');
                filename = arr[0];
            }
            return filename;
        };
        Utility.log = function (msg, args) {
            if (args === void 0) { args = []; }
            if (!window.console)
                return;
            if (args == null) {
                console.log(msg);
                return;
            }
            var txt = this.format.apply(this, arguments);
            console.log(txt);
        };
        return Utility;
    })();
    chitu.Utility = Utility;
})(chitu || (chitu = {}));
;var chitu;
(function (chitu) {
    var u = chitu.Utility;
    var Errors = (function () {
        function Errors() {
        }
        Errors.argumentNull = function (paramName) {
            var msg = u.format('The argument "{0}" cannt be null.', paramName);
            return new Error(msg);
        };
        Errors.modelFileExpecteFunction = function (script) {
            var msg = u.format('The eval result of script file "{0}" is expected a function.', script);
            return new Error(msg);
        };
        Errors.paramTypeError = function (paramName, expectedType) {
            /// <param name="paramName" type="String"/>
            /// <param name="expectedType" type="String"/>
            var msg = u.format('The param "{0}" is expected "{1}" type.', paramName, expectedType);
            return new Error(msg);
        };
        Errors.viewNodeNotExists = function (name) {
            var msg = u.format('The view node "{0}" is not exists.', name);
            return new Error(msg);
        };
        Errors.pathPairRequireView = function (index) {
            var msg = u.format('The view value is required for path pair, but the item with index "{0}" is miss it.', index);
            return new Error(msg);
        };
        Errors.notImplemented = function (name) {
            var msg = u.format('The method "{0}" is not implemented.', name);
            return new Error(msg);
        };
        Errors.routeExists = function (name) {
            var msg = u.format('Route named "{0}" is exists.', name);
            return new Error(msg);
        };
        Errors.routeResultRequireController = function (routeName) {
            var msg = u.format('The parse result of route "{0}" does not contains controler.', routeName);
            return new Error(msg);
        };
        Errors.routeResultRequireAction = function (routeName) {
            var msg = u.format('The parse result of route "{0}" does not contains action.', routeName);
            return new Error(msg);
        };
        Errors.ambiguityRouteMatched = function (url, routeName1, routeName2) {
            var msg = u.format('Ambiguity route matched, {0} is match in {1} and {2}.', url, routeName1, routeName2);
            return new Error(msg);
        };
        Errors.noneRouteMatched = function (url) {
            var msg = u.format('None route matched with url "{0}".', url);
            var error = new Error(msg);
            return error;
        };
        Errors.emptyStack = function () {
            return new Error('The stack is empty.');
        };
        Errors.canntParseUrl = function (url) {
            var msg = u.format('Can not parse the url "{0}" to route data.', url);
            return new Error(msg);
        };
        Errors.routeDataRequireController = function () {
            var msg = 'The route data does not contains a "controller" file.';
            return new Error(msg);
        };
        Errors.routeDataRequireAction = function () {
            var msg = 'The route data does not contains a "action" file.';
            return new Error(msg);
        };
        Errors.parameterRequireField = function (fileName, parameterName) {
            var msg = u.format('Parameter {1} does not contains field {0}.', fileName, parameterName);
            return new Error(msg);
        };
        return Errors;
    })();
    chitu.Errors = Errors;
})(chitu || (chitu = {}));
;var chitu;
(function (chitu) {
    var rnotwhite = (/\S+/g);
    var optionsCache = {};
    function createOptions(options) {
        var object = optionsCache[options] = {};
        jQuery.each(options.match(rnotwhite) || [], function (_, flag) {
            object[flag] = true;
        });
        return object;
    }
    var Callback = (function () {
        function Callback(source) {
            this.source = source;
        }
        Callback.prototype.add = function (func) {
            this.source.add(func);
        };
        Callback.prototype.remove = function (func) {
            this.source.remove(func);
        };
        Callback.prototype.has = function (func) {
            return this.source.has(func);
        };
        Callback.prototype.fireWith = function (context, args) {
            return this.source.fireWith(context, args);
        };
        Callback.prototype.fire = function (arg1, arg2, arg3, arg4) {
            return this.source.fire(arg1, arg2, arg3);
        };
        return Callback;
    })();
    chitu.Callback = Callback;
    function Callbacks(options) {
        if (options === void 0) { options = null; }
        options = typeof options === "string" ?
            (optionsCache[options] || createOptions(options)) :
            jQuery.extend({}, options);
        var memory, fired, firing, firingStart, firingLength, firingIndex, list = [], stack = !options.once && [], fire = function (data) {
            memory = options.memory && data;
            fired = true;
            firingIndex = firingStart || 0;
            firingStart = 0;
            firingLength = list.length;
            firing = true;
            for (; list && firingIndex < firingLength; firingIndex++) {
                var result = list[firingIndex].apply(data[0], data[1]);
                if (result != null) {
                    data[0].results.push(result);
                }
                if (result === false && options.stopOnFalse) {
                    memory = false;
                    break;
                }
            }
            firing = false;
            if (list) {
                if (stack) {
                    if (stack.length) {
                        fire(stack.shift());
                    }
                }
                else if (memory) {
                    list = [];
                }
                else {
                    self.disable();
                }
            }
        }, self = {
            results: [],
            add: function () {
                if (list) {
                    var start = list.length;
                    (function add(args) {
                        jQuery.each(args, function (_, arg) {
                            var type = jQuery.type(arg);
                            if (type === "function") {
                                if (!options.unique || !self.has(arg)) {
                                    list.push(arg);
                                }
                            }
                            else if (arg && arg.length && type !== "string") {
                                add(arg);
                            }
                        });
                    })(arguments);
                    if (firing) {
                        firingLength = list.length;
                    }
                    else if (memory) {
                        firingStart = start;
                        fire(memory);
                    }
                }
                return this;
            },
            remove: function () {
                if (list) {
                    jQuery.each(arguments, function (_, arg) {
                        var index;
                        while ((index = jQuery.inArray(arg, list, index)) > -1) {
                            list.splice(index, 1);
                            if (firing) {
                                if (index <= firingLength) {
                                    firingLength--;
                                }
                                if (index <= firingIndex) {
                                    firingIndex--;
                                }
                            }
                        }
                    });
                }
                return this;
            },
            has: function (fn) {
                return fn ? jQuery.inArray(fn, list) > -1 : !!(list && list.length);
            },
            empty: function () {
                list = [];
                firingLength = 0;
                return this;
            },
            disable: function () {
                list = stack = memory = undefined;
                return this;
            },
            disabled: function () {
                return !list;
            },
            lock: function () {
                stack = undefined;
                if (!memory) {
                    self.disable();
                }
                return this;
            },
            locked: function () {
                return !stack;
            },
            fireWith: function (context, args) {
                context.results = [];
                if (list && (!fired || stack)) {
                    args = args || [];
                    args = [context, args.slice ? args.slice() : args];
                    if (firing) {
                        stack.push(args);
                    }
                    else {
                        fire(args);
                    }
                }
                return context.results;
            },
            fire: function () {
                return self.fireWith(this, arguments);
            },
            fired: function () {
                return !!fired;
            },
            count: function () {
                return list.length;
            }
        };
        return new chitu.Callback(self);
    }
    chitu.Callbacks = Callbacks;
    function fireCallback(callback, args) {
        var results = callback.fire.apply(callback, args);
        var deferreds = [];
        for (var i = 0; i < results.length; i++) {
            if (chitu.Utility.isDeferred(results[i]))
                deferreds.push(results[i]);
        }
        if (deferreds.length == 0)
            return $.Deferred().resolve();
        return $.when.apply($, deferreds);
    }
    chitu.fireCallback = fireCallback;
    var crossroads = window['crossroads'];
    $.extend(crossroads, {
        _create: crossroads.create,
        create: function () {
            var obj = this._create();
            obj.getRouteData = function (request, defaultArgs) {
                request = request || '';
                defaultArgs = defaultArgs || [];
                if (!this.ignoreState &&
                    (request === this._prevMatchedRequest ||
                        request === this._prevBypassedRequest)) {
                    return;
                }
                var routes = this._getMatchedRoutes(request), i = 0, n = routes.length, cur;
                if (n == 0)
                    return null;
                if (n > 1) {
                    throw chitu.Errors.ambiguityRouteMatched(request, 'route1', 'route2');
                }
                return routes[0];
            };
            return obj;
        }
    });
})(chitu || (chitu = {}));
;var chitu;
(function (chitu) {
    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;
    function eventDeferred(callback, sender, args) {
        if (args === void 0) { args = {}; }
        return chitu.fireCallback(callback, [sender, args]);
    }
    ;
    var PAGE_CLASS_NAME = 'page-node';
    var PAGE_HEADER_CLASS_NAME = 'page-header';
    var PAGE_BODY_CLASS_NAME = 'page-body';
    var PAGE_FOOTER_CLASS_NAME = 'page-footer';
    var PAGE_LOADING_CLASS_NAME = 'page-loading';
    var PAGE_CONTENT_CLASS_NAME = 'page-content';
    var ShowTypes;
    (function (ShowTypes) {
        ShowTypes[ShowTypes["swipeLeft"] = 0] = "swipeLeft";
        ShowTypes[ShowTypes["swipeRight"] = 1] = "swipeRight";
        ShowTypes[ShowTypes["none"] = 2] = "none";
    })(ShowTypes || (ShowTypes = {}));
    var PageNodeParts;
    (function (PageNodeParts) {
        PageNodeParts[PageNodeParts["header"] = 1] = "header";
        PageNodeParts[PageNodeParts["body"] = 2] = "body";
        PageNodeParts[PageNodeParts["loading"] = 4] = "loading";
        PageNodeParts[PageNodeParts["footer"] = 8] = "footer";
    })(PageNodeParts || (PageNodeParts = {}));
    var PageStatus;
    (function (PageStatus) {
        PageStatus[PageStatus["open"] = 0] = "open";
        PageStatus[PageStatus["closed"] = 1] = "closed";
    })(PageStatus || (PageStatus = {}));
    var PageNodes = (function () {
        function PageNodes(node) {
            node.className = PAGE_CLASS_NAME;
            this.container = node;
            this.header = document.createElement('div');
            this.header.className = PAGE_HEADER_CLASS_NAME;
            node.appendChild(this.header);
            this.body = document.createElement('div');
            this.body.className = PAGE_BODY_CLASS_NAME;
            $(this.body).hide();
            node.appendChild(this.body);
            this.content = document.createElement('div');
            this.content.className = PAGE_CONTENT_CLASS_NAME;
            this.body.appendChild(this.content);
            this.loading = document.createElement('div');
            this.loading.className = PAGE_LOADING_CLASS_NAME;
            this.loading.innerHTML = '<div class="spin"><i class="icon-spinner icon-spin"></i><div>';
            $(this.loading).hide();
            node.appendChild(this.loading);
            this.footer = document.createElement('div');
            this.footer.className = PAGE_FOOTER_CLASS_NAME;
            node.appendChild(this.footer);
        }
        return PageNodes;
    })();
    var Page = (function () {
        function Page(context, container, previous) {
            this._loadViewModelResult = null;
            this._openResult = null;
            this._hideResult = null;
            this._showTime = Page.animationTime;
            this._hideTime = Page.animationTime;
            this.swipe = true;
            this.init = ns.Callbacks();
            this.preLoad = ns.Callbacks();
            this.load = ns.Callbacks();
            this.closing = ns.Callbacks();
            this.closed = ns.Callbacks();
            this.scroll = ns.Callbacks();
            this.showing = ns.Callbacks();
            this.shown = ns.Callbacks();
            this.hiding = ns.Callbacks();
            this.hidden = ns.Callbacks();
            if (!context)
                throw e.argumentNull('context');
            if (!container)
                throw e.argumentNull('container');
            this._container = container;
            this._prevous = previous;
            var element = document.createElement('div');
            container.appendChild(element);
            this._context = context;
            var controllerName = context.routeData().values().controller;
            var actionName = context.routeData().values().action;
            var name = Page.getPageName(context.routeData());
            var viewDeferred = context.view();
            var actionDeferred = context.controller().action(context.routeData());
            this._pageNode = new PageNodes(element);
            this._init(name, viewDeferred, actionDeferred, element);
        }
        Page.getPageName = function (routeData) {
            var name;
            if (routeData.pageName()) {
                var route = window['crossroads'].addRoute(routeData.pageName());
                name = route.interpolate(routeData.values());
            }
            else {
                name = routeData.values().controller + '.' + routeData.values().action;
            }
            return name;
        };
        Page.prototype.context = function () {
            return this._context;
        };
        Page.prototype.name = function () {
            return this._name;
        };
        Page.prototype.node = function () {
            return this._pageNode.container;
        };
        Page.prototype.nodes = function () {
            return this._pageNode;
        };
        Page.prototype.previous = function () {
            return this._prevous;
        };
        Page.prototype.hide = function () {
            if (!$(this.node()).is(':visible'))
                return;
            this.hidePageNode(false);
        };
        Page.prototype.show = function () {
            if ($(this.node()).is(':visible'))
                return;
            this.showPageNode(false);
        };
        Page.prototype.visible = function () {
            return $(this.node()).is(':visible');
        };
        Page.prototype.hidePageNode = function (swipe) {
            var _this = this;
            var result = $.Deferred();
            if (swipe) {
                var container_width = $(this._container).width();
                window['move'](this.node())
                    .to(container_width)
                    .duration(this._hideTime)
                    .end(function () {
                    $(_this.node()).hide();
                    result.resolve();
                    _this.on_hidden({});
                });
            }
            else {
                $(this.node()).hide();
                result.resolve();
                this.on_hidden({});
            }
            return result;
        };
        Page.prototype.showPageNode = function (swipe) {
            var _this = this;
            this.on_showing({});
            var result = $.Deferred();
            if (swipe) {
                var container_width = $(this._container).width();
                this.node().style.left = '0px';
                this.node().style.display = 'block';
                move(this.node()).to(container_width).duration(0).end();
                move(this.node())
                    .to(0)
                    .duration(this._showTime)
                    .end(function () {
                    result.resolve();
                });
                if (this._openResult != null) {
                    $(this._pageNode.loading).show();
                    $(this._pageNode.body).hide();
                }
                else {
                    this.showBodyNode();
                }
            }
            else {
                this.node().style.display = 'block';
                if (this.node().style.transform) {
                    move(this.node()).to(0).duration(0);
                }
                else {
                    this.node().style.left = '0px';
                }
                if (this._openResult != null) {
                    $(this._pageNode.loading).show();
                    $(this._pageNode.body).hide();
                }
                else {
                    this.showBodyNode();
                }
                result.resolve();
            }
            result.done(function () {
                if (_this._prevous != null)
                    _this._prevous.hide();
            });
            return result;
        };
        Page.prototype.showBodyNode = function () {
            $(this._pageNode.container).show();
            $(this._pageNode.loading).hide();
            $(this._pageNode.body).show();
            this.on_shown({});
        };
        Page.prototype._init = function (name, viewDeferred, actionDeferred, node) {
            if (!name)
                throw e.argumentNull('name');
            if (!viewDeferred)
                throw e.argumentNull('viewDeferred');
            if (!actionDeferred)
                throw e.argumentNull('actionDeferred');
            if (!node)
                throw e.argumentNull('node');
            this._name = name;
            this._viewDeferred = viewDeferred;
            this._actionDeferred = actionDeferred;
        };
        Page.prototype.on_init = function () {
            return eventDeferred(this.init, this);
        };
        Page.prototype.on_load = function (args) {
            return eventDeferred(this.load, this, args);
        };
        Page.prototype.on_closed = function (args) {
            return eventDeferred(this.closed, this, args);
        };
        Page.prototype.on_scroll = function (args) {
            return eventDeferred(this.scroll, this, args);
        };
        Page.prototype.on_showing = function (args) {
            return eventDeferred(this.showing, this, args);
        };
        Page.prototype.on_shown = function (args) {
            return eventDeferred(this.shown, this, args);
        };
        Page.prototype.on_hiding = function (args) {
            return eventDeferred(this.hiding, this, args);
        };
        Page.prototype.on_hidden = function (args) {
            return eventDeferred(this.hidden, this, args);
        };
        Page.prototype._loadViewAndModel = function () {
            var _this = this;
            if (this._loadViewModelResult)
                return this._loadViewModelResult;
            this._loadViewModelResult = $.when(this._viewDeferred, this._actionDeferred)
                .then(function (html, action) {
                u.log('Load view success, page:{0}.', [_this.name()]);
                $(html).appendTo(_this.nodes().content);
                var result = action.execute(_this);
                _this.on_init();
                if (u.isDeferred(result))
                    return result;
                return $.Deferred().resolve();
            }).fail(function () {
                _this._loadViewModelResult = null;
                u.log('Load view or action fail, page：{0}.', [_this.name()]);
            });
            return this._loadViewModelResult;
        };
        Page.prototype.open = function (values) {
            var _this = this;
            if (this._openResult)
                return this._openResult;
            var args = values;
            this._openResult = $.Deferred();
            var pageNodeShown = this.showPageNode(this.swipe);
            this._loadViewAndModel()
                .pipe(function () {
                return _this.on_load(args);
            })
                .done(function () {
                _this._openResult.resolve();
                _this.showBodyNode();
            })
                .fail(function () {
                _this._openResult.reject();
            });
            return this._openResult.always(function () {
                _this._openResult = null;
            });
        };
        Page.prototype.close = function (args) {
            /// <summary>
            /// Hide the page.
            /// </summary>
            /// <param name="args" type="Object" canBeNull="true">
            /// The value passed to the hide event functions.
            /// </param>
            /// <returns type="jQuery.Deferred"/>
            var _this = this;
            if (args === void 0) { args = undefined; }
            this.hidePageNode(this.swipe).done(function () {
                $(_this.node()).remove();
            });
            args = args || {};
            this.on_closed(args);
        };
        Page.animationTime = 300;
        return Page;
    })();
    chitu.Page = Page;
})(chitu || (chitu = {}));
;
;var chitu;
(function (chitu) {
    var ns = chitu;
    var e = ns.Errors;
    var u = ns.Utility;
    var crossroads = window['crossroads'];
    function interpolate(pattern, data) {
        var http_prefix = 'http://'.toLowerCase();
        if (pattern.substr(0, http_prefix.length).toLowerCase() == http_prefix) {
            var link = document.createElement('a');
            link.setAttribute('href', pattern);
            pattern = decodeURI(link.pathname);
            var route = crossroads.addRoute(pattern);
            return http_prefix + link.host + route.interpolate(data);
        }
        var route = crossroads.addRoute(pattern);
        return route.interpolate(data);
    }
    var Controller = (function () {
        function Controller(name) {
            //if (!routeData) throw e.argumentNull('routeData');
            ////if (typeof routeData !== 'object') throw e.paramTypeError('routeData', 'object');
            this._actions = {};
            this._name = name;
            this._actions = {};
            this.actionCreated = chitu.Callbacks();
        }
        Controller.prototype.name = function () {
            return this._name;
        };
        Controller.prototype.action = function (routeData) {
            /// <param name="value" type="chitu.Action" />
            /// <returns type="jQuery.Deferred" />
            var controller = routeData.values().controller;
            ;
            if (!controller)
                throw e.routeDataRequireController();
            if (this._name != controller) {
                throw new Error('Not same a controller.');
            }
            var name = routeData.values().action;
            if (!name)
                throw e.routeDataRequireAction();
            var self = this;
            if (!this._actions[name]) {
                this._actions[name] = this._createAction(routeData).fail($.proxy(function () {
                    self._actions[this.actionName] = null;
                }, { actionName: routeData }));
            }
            return this._actions[name];
        };
        Controller.prototype._createAction = function (routeData) {
            /// <param name="actionName" type="String"/>
            /// <returns type="jQuery.Deferred"/>
            var actionName = routeData.values().action;
            if (!actionName)
                throw e.routeDataRequireAction();
            var self = this;
            var url = interpolate(routeData.actionPath(), routeData.values());
            var result = $.Deferred();
            requirejs([url], $.proxy(function (obj) {
                if (!obj) {
                    result.reject();
                }
                var func = obj.func || obj;
                if (!$.isFunction(func))
                    throw ns.Errors.modelFileExpecteFunction(this.actionName);
                var action = new Action(self, this.actionName, func);
                self.actionCreated.fire(self, action);
                this.result.resolve(action);
            }, { actionName: actionName, result: result }), $.proxy(function (err) {
                this.result.reject(err);
            }, { actionName: actionName, result: result }));
            return result;
        };
        return Controller;
    })();
    chitu.Controller = Controller;
    var Action = (function () {
        function Action(controller, name, handle) {
            /// <param name="controller" type="chitu.Controller"/>
            /// <param name="name" type="String">Name of the action.</param>
            /// <param name="handle" type="Function"/>
            if (!controller)
                throw e.argumentNull('controller');
            if (!name)
                throw e.argumentNull('name');
            if (!handle)
                throw e.argumentNull('handle');
            if (!$.isFunction(handle))
                throw e.paramTypeError('handle', 'Function');
            this._name = name;
            this._handle = handle;
        }
        Action.prototype.name = function () {
            return this._name;
        };
        Action.prototype.execute = function (page) {
            if (!page)
                throw e.argumentNull('page');
            var result = this._handle.apply({}, [page]);
            return u.isDeferred(result) ? result : $.Deferred().resolve();
        };
        return Action;
    })();
    chitu.Action = Action;
    function action(deps, filters, func) {
        /// <param name="deps" type="Array" canBeNull="true"/>
        /// <param name="filters" type="Array" canBeNull="true"/>
        /// <param name="func" type="Function" canBeNull="false"/>
        switch (arguments.length) {
            case 0:
                throw e.argumentNull('func');
            case 1:
                if (typeof arguments[0] != 'function')
                    throw e.paramTypeError('arguments[0]', 'Function');
                func = deps;
                filters = deps = [];
                break;
            case 2:
                func = filters;
                if (typeof func != 'function')
                    throw e.paramTypeError('func', 'Function');
                if (!$.isArray(deps))
                    throw e.paramTypeError('deps', 'Array');
                if (deps.length == 0) {
                    deps = filters = [];
                }
                else if (typeof deps[0] == 'function') {
                    filters = deps;
                    deps = [];
                }
                else {
                    filters = [];
                }
                break;
        }
        for (var i = 0; i < deps.length; i++) {
            if (typeof deps[i] != 'string')
                throw e.paramTypeError('deps[' + i + ']', 'string');
        }
        for (var i = 0; i < filters.length; i++) {
            if (typeof filters[i] != 'function')
                throw e.paramTypeError('filters[' + i + ']', 'function');
        }
        if (!$.isFunction(func))
            throw e.paramTypeError('func', 'function');
        define(deps, $.proxy(function () {
            var args = Array.prototype.slice.call(arguments, 0);
            var func = this.func;
            var filters = this.filters;
            return {
                func: function (page) {
                    args.unshift(page);
                    return func.apply(func, args);
                },
                filters: filters
            };
        }, { func: func, filters: filters }));
        return func;
    }
    chitu.action = action;
    ;
})(chitu || (chitu = {}));
;
;var chitu;
(function (chitu) {
    var ControllerContext = (function () {
        function ControllerContext(controller, view, routeData) {
            this._routeData = routeData;
            this._controller = controller;
            this._view = view;
            this._routeData = routeData;
        }
        ControllerContext.prototype.controller = function () {
            return this._controller;
        };
        ControllerContext.prototype.view = function () {
            return this._view;
        };
        ControllerContext.prototype.routeData = function () {
            return this._routeData;
        };
        return ControllerContext;
    })();
    chitu.ControllerContext = ControllerContext;
})(chitu || (chitu = {}));
;var chitu;
(function (chitu) {
    var e = chitu.Errors;
    var ns = chitu;
    var ControllerFactory = (function () {
        function ControllerFactory() {
            //if (!actionLocationFormater)
            //    throw e.argumentNull('actionLocationFormater');
            this._controllers = {};
            this._controllers = {};
        }
        ControllerFactory.prototype.controllers = function () {
            return this._controllers;
        };
        ControllerFactory.prototype.createController = function (name) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="ns.Controller"/>
            //if (!routeData.values().controller)
            //    throw e.routeDataRequireController();
            return new ns.Controller(name);
        };
        ControllerFactory.prototype.actionLocationFormater = function () {
            return this._actionLocationFormater;
        };
        ControllerFactory.prototype.getController = function (routeData) {
            /// <summary>Gets the controller by routeData.</summary>
            /// <param name="routeData" type="Object"/>
            /// <returns type="chitu.Controller"/>
            if (!routeData.values().controller)
                throw e.routeDataRequireController();
            if (!this._controllers[routeData.values().controller])
                this._controllers[routeData.values().controller] = this.createController(routeData.values().controller);
            return this._controllers[routeData.values().controller];
        };
        return ControllerFactory;
    })();
    chitu.ControllerFactory = ControllerFactory;
})(chitu || (chitu = {}));
;var chitu;
(function (chitu) {
    var Route = (function () {
        function Route(name, pattern, defaults) {
            this._name = name;
            this._pattern = pattern;
            this._defaults = defaults;
        }
        Route.prototype.name = function () {
            return this._name;
        };
        Route.prototype.defaults = function () {
            return this._defaults;
        };
        Route.prototype.url = function () {
            return this._pattern;
        };
        return Route;
    })();
    chitu.Route = Route;
})(chitu || (chitu = {}));
;var chitu;
(function (chitu) {
    var ns = chitu;
    var e = chitu.Errors;
    var RouteCollection = (function () {
        function RouteCollection() {
            this._init();
        }
        RouteCollection.prototype._init = function () {
            var crossroads = window['crossroads'];
            this._source = crossroads.create();
            this._source.ignoreCase = true;
            this._source.normalizeFn = crossroads.NORM_AS_OBJECT;
            this._priority = 0;
        };
        RouteCollection.prototype.count = function () {
            return this._source.getNumRoutes();
        };
        RouteCollection.prototype.mapRoute = function (args) {
            args = args || {};
            var name = args.name;
            var url = args.url;
            var defaults = args.defaults;
            var rules = args.rules || {};
            if (!name)
                throw e.argumentNull('name');
            if (!url)
                throw e.argumentNull('url');
            this._priority = this._priority + 1;
            var route = new chitu.Route(name, url, defaults);
            route.viewPath = args.viewPath;
            route.actionPath = args.actionPath;
            var originalRoute = this._source.addRoute(url, function (args) {
            }, this._priority);
            originalRoute.rules = rules;
            originalRoute.newRoute = route;
            if (this._defaultRoute == null) {
                this._defaultRoute = route;
                if (this._defaultRoute.viewPath == null)
                    throw new Error('default route require view path.');
                if (this._defaultRoute.actionPath == null)
                    throw new Error('default route require action path.');
            }
            route.viewPath = route.viewPath || this._defaultRoute.viewPath;
            route.actionPath = route.actionPath || this._defaultRoute.actionPath;
            return route;
        };
        RouteCollection.prototype.getRouteData = function (url) {
            var data = this._source.getRouteData(url);
            if (data == null)
                throw e.canntParseUrl(url);
            var values = {};
            var paramNames = data.route._paramsIds || [];
            for (var i = 0; i < paramNames.length; i++) {
                var key = paramNames[i];
                values[key] = data.params[0][key];
            }
            var routeData = new chitu.RouteData(url);
            routeData.values(values);
            routeData.actionPath(data.route.newRoute.actionPath);
            routeData.viewPath(data.route.newRoute.viewPath);
            return routeData;
        };
        RouteCollection.defaultRouteName = 'default';
        return RouteCollection;
    })();
    chitu.RouteCollection = RouteCollection;
})(chitu || (chitu = {}));
;var chitu;
(function (chitu) {
    var RouteData = (function () {
        function RouteData(url) {
            this._url = url;
        }
        RouteData.prototype.values = function (value) {
            if (value === void 0) { value = undefined; }
            if (value !== undefined)
                this._values = value;
            return this._values;
        };
        RouteData.prototype.viewPath = function (value) {
            if (value === void 0) { value = undefined; }
            if (value !== undefined)
                this._viewPath = value;
            return this._viewPath;
        };
        RouteData.prototype.actionPath = function (value) {
            if (value === void 0) { value = undefined; }
            if (value !== undefined)
                this._actionPath = value;
            return this._actionPath;
        };
        RouteData.prototype.pageName = function (value) {
            if (value === void 0) { value = undefined; }
            if (value !== undefined)
                this._pageName = value;
            return this._pageName;
        };
        RouteData.prototype.url = function () {
            return this._url;
        };
        return RouteData;
    })();
    chitu.RouteData = RouteData;
})(chitu || (chitu = {}));
;
;var chitu;
(function (chitu) {
    var e = chitu.Errors;
    var crossroads = window['crossroads'];
    function interpolate(pattern, data) {
        var http_prefix = 'http://'.toLowerCase();
        if (pattern.substr(0, http_prefix.length).toLowerCase() == http_prefix) {
            var link = document.createElement('a');
            link.setAttribute('href', pattern);
            pattern = decodeURI(link.pathname);
            var route = crossroads.addRoute(pattern);
            return http_prefix + link.host + route.interpolate(data);
        }
        var route = crossroads.addRoute(pattern);
        return route.interpolate(data);
    }
    var ViewFactory = (function () {
        function ViewFactory() {
            this._views = [];
        }
        ViewFactory.prototype.view = function (routeData) {
            /// <param name="routeData" type="Object"/>
            /// <returns type="jQuery.Deferred"/>
            if (!routeData.values().controller)
                throw e.routeDataRequireController();
            if (!routeData.values().action)
                throw e.routeDataRequireAction();
            var url = interpolate(routeData.viewPath(), routeData.values());
            var self = this;
            var viewName = routeData.values().controller + '_' + routeData.values().action;
            if (!this._views[viewName]) {
                this._views[viewName] = $.Deferred();
                var http = 'http://';
                if (url.substr(0, http.length).toLowerCase() == http) {
                    $.ajax({ url: url })
                        .done($.proxy(function (html) {
                        if (html != null)
                            this.deferred.resolve(html);
                        else
                            this.deferred.reject();
                    }, { deferred: this._views[viewName] }))
                        .fail($.proxy(function (err) {
                        this.deferred.reject(err);
                    }, { deferred: this._views[viewName] }));
                }
                else {
                    requirejs(['text!' + url], $.proxy(function (html) {
                        if (html != null)
                            this.deferred.resolve(html);
                        else
                            this.deferred.reject();
                    }, { deferred: this._views[viewName] }), $.proxy(function (err) {
                        this.deferred.reject(err);
                    }, { deferred: this._views[viewName] }));
                }
            }
            return this._views[viewName];
        };
        return ViewFactory;
    })();
    chitu.ViewFactory = ViewFactory;
})(chitu || (chitu = {}));
;var chitu;
(function (chitu) {
    var ns = chitu;
    var u = chitu.Utility;
    var e = chitu.Errors;
    var PAGE_STACK_MAX_SIZE = 10;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';
    var Application = (function () {
        function Application(config) {
            this.pageCreating = ns.Callbacks();
            this.pageCreated = ns.Callbacks();
            this.page_stack = [];
            this._routes = new chitu.RouteCollection();
            this._runned = false;
            this.controllerFactory = new chitu.ControllerFactory();
            this.viewFactory = new chitu.ViewFactory();
            if (config == null)
                throw e.argumentNull('container');
            if (!config['container']) {
                throw new Error('The config has not a container property.');
            }
            if (!$.isFunction(config['container']) && !config['container'].tagName)
                throw new Error('Parameter container is not a function or html element.');
            this._container = config['container'];
        }
        Application.prototype.on_pageCreating = function (context) {
            return ns.fireCallback(this.pageCreating, [this, context]);
        };
        Application.prototype.on_pageCreated = function (page) {
            return ns.fireCallback(this.pageCreated, [this, page]);
        };
        Application.prototype.routes = function () {
            return this._routes;
        };
        Application.prototype.controller = function (routeData) {
            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');
            if (!routeData)
                throw e.argumentNull('routeData');
            return this.controllerFactory.getController(routeData);
        };
        Application.prototype.currentPage = function () {
            if (this.page_stack.length > 0)
                return this.page_stack[this.page_stack.length - 1];
            return null;
        };
        Application.prototype.previousPage = function () {
            if (this.page_stack.length > 1)
                return this.page_stack[this.page_stack.length - 2];
            return null;
        };
        Application.prototype.action = function (routeData) {
            if (typeof routeData !== 'object')
                throw e.paramTypeError('routeData', 'object');
            if (!routeData)
                throw e.argumentNull('routeData');
            var controllerName = routeData.controller;
            if (!controllerName)
                throw e.argumentNull('name');
            if (typeof controllerName != 'string')
                throw e.routeDataRequireController();
            var actionName = routeData.action;
            if (!actionName)
                throw e.argumentNull('name');
            if (typeof actionName != 'string')
                throw e.routeDataRequireAction();
            var controller = this.controller(routeData);
            return controller.action(actionName);
        };
        Application.prototype.hashchange = function () {
            var hash = window.location.hash;
            if (!hash) {
                u.log('The url is not contains hash.');
                return;
            }
            var current_page_url = '';
            if (this.previousPage() != null)
                current_page_url = this.previousPage().context().routeData().url();
            if (current_page_url.toLowerCase() == hash.substr(1).toLowerCase()) {
                this.closeCurrentPage();
            }
            else {
                var args = window.location['arguments'] || {};
                window.location['arguments'] = null;
                if (window.location['skip'] == true) {
                    window.location['skip'] = false;
                    return;
                }
                this.showPage(hash.substr(1), args);
            }
        };
        Application.prototype.run = function () {
            if (this._runned)
                return;
            var app = this;
            $.proxy(this.hashchange, this)();
            $(window).bind('hashchange', $.proxy(this.hashchange, this));
            this._runned = true;
        };
        Application.prototype.getCachePage = function (name) {
            for (var i = this.page_stack.length - 1; i >= 0; i--) {
                if (this.page_stack[i].name() == name)
                    return this.page_stack[i];
            }
            return null;
        };
        Application.prototype.showPage = function (url, args) {
            /// <param name="container" type="HTMLElement" canBeNull="false"/>
            /// <param name="url" type="String" canBeNull="false"/>
            /// <param name="args" type="object" canBeNull="true"/>
            /// <returns type="jQuery.Deferred"/>
            var _this = this;
            args = args || {};
            if (!url)
                throw e.argumentNull('url');
            var routeData = this.routes().getRouteData(url);
            if (routeData == null) {
                throw e.noneRouteMatched(url);
            }
            var container;
            if ($.isFunction(this._container)) {
                container = this._container(routeData.values());
                if (container == null)
                    throw new Error('The result of continer function cannt be null');
            }
            else {
                container = this._container;
            }
            var page = this._createPage(url, container, this.currentPage());
            this.page_stack.push(page);
            console.log('page_stack lenght:' + this.page_stack.length);
            if (this.page_stack.length > PAGE_STACK_MAX_SIZE) {
                var p = this.page_stack.shift();
                p.close();
            }
            $.extend(args, routeData.values());
            var result = $.Deferred();
            page.open(args)
                .done(function () {
                result.resolve();
            })
                .fail(function (error) {
                result.reject(_this, error);
            });
            return result;
        };
        Application.prototype.createPageNode = function () {
            var element = document.createElement('div');
            return element;
        };
        Application.prototype.closeCurrentPage = function () {
            var current = this.currentPage();
            var previous = this.previousPage();
            if (current != null) {
                current.close();
                if (previous != null)
                    previous.show();
                this.page_stack.pop();
                console.log('page_stack lenght:' + this.page_stack.length);
            }
        };
        Application.prototype._createPage = function (url, container, previous) {
            if (!url)
                throw e.argumentNull('url');
            if (!container)
                throw e.argumentNull('element');
            var routeData = this.routes().getRouteData(url);
            if (routeData == null) {
                throw e.noneRouteMatched(url);
            }
            var controllerName = routeData.values().controller;
            var actionName = routeData.values().action;
            var controller = this.controller(routeData);
            var view_deferred = this.viewFactory.view(routeData);
            var context = new ns.ControllerContext(controller, view_deferred, routeData);
            this.on_pageCreating(context);
            var page = new ns.Page(context, container, previous);
            this.on_pageCreated(page);
            return page;
        };
        Application.prototype.redirect = function (url, args) {
            if (args === void 0) { args = {}; }
            window.location['arguments'] = args;
            window.location.hash = url;
        };
        Application.prototype.back = function (args) {
            if (args === void 0) { args = undefined; }
            if (window.history.length == 0)
                return $.Deferred().reject();
            window.history.back();
            return $.Deferred().resolve();
        };
        return Application;
    })();
    chitu.Application = Application;
})(chitu || (chitu = {}));
;    //
    window['chitu'] = chitu;
    return chitu;
});