/// <reference path="Scripts/typings/crossroads.d.ts"/>
namespace chitu {
    var rnotwhite = (/\S+/g);

    // String to Object options format cache
    var optionsCache = {};

    // Convert String-formatted options into Object-formatted ones and store in cache
    function createOptions(options) {
        var object = optionsCache[options] = {};
        jQuery.each(options.match(rnotwhite) || [], function(_, flag) {
            object[flag] = true;
        });
        return object;
    }

    export class Callback {
        source: any
        constructor(source: any) {
            this.source = source;
        }
        add(func: Function) {
            this.source.add(func);
        }
        remove(func: Function) {
            this.source.remove(func);
        }
        has(func: Function): boolean {
            return this.source.has(func);
        }
        fireWith(context, args) {
            return this.source.fire(context, args);
        }
        fire(arg1?, arg2?, arg3?, arg4?) {
            return this.source.fire(arg1, arg2, arg3);
        }
    }

    export function Callbacks(options: any = null): Callback {
        // Convert options from String-formatted to Object-formatted if needed
        // (we check in cache first)
        options = typeof options === "string" ?
            (optionsCache[options] || createOptions(options)) :
            jQuery.extend({}, options);

        var // Last fire value (for non-forgettable lists)
            memory,
            // Flag to know if list was already fired
            fired,
            // Flag to know if list is currently firing
            firing,
            // First callback to fire (used internally by add and fireWith)
            firingStart,
            // End of the loop when firing
            firingLength,
            // Index of currently firing callback (modified by remove if needed)
            firingIndex,
            // Actual callback list
            list = [],
            // Stack of fire calls for repeatable lists
            stack = !options.once && [],
            // Fire callbacks
            fire = function(data) {
                memory = options.memory && data;
                fired = true;
                firingIndex = firingStart || 0;
                firingStart = 0;
                firingLength = list.length;
                firing = true;
                for (; list && firingIndex < firingLength; firingIndex++) {
                    var result = list[firingIndex].apply(data[0], data[1]);
                    //==============================================
                    // MY CODE
                    if (result != null) {
                        data[0].results.push(result);
                    }
                    //==============================================
                    if (result === false && options.stopOnFalse) {
                        memory = false; // To prevent further calls using add
                        break;
                    }
                }
                firing = false;
                if (list) {
                    if (stack) {
                        if (stack.length) {
                            fire(stack.shift());
                        }
                    } else if (memory) {
                        list = [];
                    } else {
                        self.disable();
                    }
                }
            },
            // Actual Callbacks object
            self = {
                results: [],
                // Add a callback or a collection of callbacks to the list
                add: function() {
                    if (list) {
                        // First, we save the current length
                        var start = list.length;
                        (function add(args) {
                            jQuery.each(args, function(_, arg) {
                                var type = jQuery.type(arg);
                                if (type === "function") {
                                    if (!options.unique || !self.has(arg)) {
                                        list.push(arg);
                                    }
                                } else if (arg && arg.length && type !== "string") {
                                    // Inspect recursively
                                    add(arg);
                                }
                            });
                        })(arguments);
                        // Do we need to add the callbacks to the
                        // current firing batch?
                        if (firing) {
                            firingLength = list.length;
                            // With memory, if we're not firing then
                            // we should call right away
                        } else if (memory) {
                            firingStart = start;
                            fire(memory);
                        }
                    }
                    return this;
                },
                // Remove a callback from the list
                remove: function() {
                    if (list) {
                        jQuery.each(arguments, function(_, arg) {
                            var index;
                            while ((index = jQuery.inArray(arg, list, index)) > -1) {
                                list.splice(index, 1);
                                // Handle firing indexes
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
                // Check if a given callback is in the list.
                // If no argument is given, return whether or not list has callbacks attached.
                has: function(fn) {
                    return fn ? jQuery.inArray(fn, list) > -1 : !!(list && list.length);
                },
                // Remove all callbacks from the list
                empty: function() {
                    list = [];
                    firingLength = 0;
                    return this;
                },
                // Have the list do nothing anymore
                disable: function() {
                    list = stack = memory = undefined;
                    return this;
                },
                // Is it disabled?
                disabled: function() {
                    return !list;
                },
                // Lock the list in its current state
                lock: function() {
                    stack = undefined;
                    if (!memory) {
                        self.disable();
                    }
                    return this;
                },
                // Is it locked?
                locked: function() {
                    return !stack;
                },
                // Call all callbacks with the given context and arguments
                fireWith: function(context, args) {
                    context.results = [];
                    if (list && (!fired || stack)) {
                        args = args || [];
                        args = [context, args.slice ? args.slice() : args];
                        if (firing) {
                            stack.push(args);
                        } else {
                            fire(args);
                        }
                    }
                    return context.results;
                },
                // Call all the callbacks with the given arguments
                fire: function() {
                    return self.fireWith(this, arguments);
                },
                // To know if the callbacks have already been called at least once
                fired: function() {
                    return !!fired;
                },
                count: function() {
                    return list.length;
                }
            };

        return new chitu.Callback(self);
    }

    export function fireCallback(callback: chitu.Callback, args: Array<any>): JQueryPromise<any> {

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

    $.extend(crossroads, {
        _create: crossroads.create,
        create: function() {
            /// <returns type="Crossroads"/>
            var obj = this._create();
            obj.getRouteData = function(request, defaultArgs) {
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

                if (n == 0)
                    return null;

                if (n > 1) {
                    throw Errors.ambiguityRouteMatched(request, 'route1', 'route2');
                }
                return routes[0];
            }
            return obj;
        }
    });

} 