(function (root, name, dependencies, factory) {
    var Oatmeal = function Oatmeal(deps) {
        return (root[name] = factory.apply(null, deps));
    };

    if (typeof define === 'function' && define.amd) {
        define(dependencies, function () {
            return new Oatmeal(
                Array.prototype.slice.call(arguments)
            );
        });
        return;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = new Oatmeal(
            dependencies.map(function (depName) {
                return require(depName);
            })
        );
        return;
    }

    return new Oatmeal(
        dependencies.map(function (depName) {
            return root[depName];
        })
    );
})(this, 'Oatmeal', ['moment'], function Oatmeal(moment) {
    var
        /**
         * The Oatmeal instance.
         * @type {Oatmeal}
         */
        self = {},

        /**
         * The constructors for each registered type.
         * @type {Object}
         */
        constructors = {},

        /**
         * The default values for each registered type.
         * @type {Object}
         */
        defaultValues = {},

        /**
         * The serializer queues for each registered type.
         * @type {Object}
         */
        serializers = {},

        /**
         * The deserializer queues for each registered type.
         * @type {Object}
         */
        deserializers = {},

        /**
         * The validators for each registered type that will be used before serialization.
         * @type {Object}
         */
        serializerValidators = {},

        /**
         * The validators for each registered type that will be used before deserialization.
         * @type {Object}
         */
        deserializerValidators = {},

        /**
         * The prefix for the expando values of computed attributes.
         * @type {string}
         */
        computedAttributePrefix = '@',

        /**
         * The prefix for the expando value of the types of serialized objects.
         * @type {string}
         */
        typePrefix = '@@';

    function clone(data) {
        var _clone = (function () {
            var nativeMap;
            try {
                nativeMap = Map;
            } catch (_) {
                // maybe a reference error because no `Map`. Give it a dummy value that no
                // value will ever be an instanceof.
                nativeMap = function () {
                };
            }

            var nativeSet;
            try {
                nativeSet = Set;
            } catch (_) {
                nativeSet = function () {
                };
            }

            var nativePromise;
            try {
                nativePromise = Promise;
            } catch (_) {
                nativePromise = function () {
                };
            }

            /**
             * Clones (copies) an Object using deep copying.
             *
             * This function supports circular references by default, but if you are certain
             * there are no circular references in your object, you can save some CPU time
             * by calling clone(obj, false).
             *
             * Caution: if `circular` is false and `parent` contains circular references,
             * your program may enter an infinite loop and crash.
             *
             * @param `parent` - the object to be cloned
             * @param `circular` - set to true if the object to be cloned may contain
             *    circular references. (optional - true by default)
             * @param `depth` - set to a number if the object is only to be cloned to
             *    a particular depth. (optional - defaults to Infinity)
             * @param `prototype` - sets the prototype to be used when cloning an object.
             *    (optional - defaults to parent prototype).
             * @param `includeNonEnumerable` - set to true if the non-enumerable properties
             *    should be cloned as well. Non-enumerable properties on the prototype
             *    chain will be ignored. (optional - false by default)
             */
            function doClone(parent, circular, depth, prototype, includeNonEnumerable) {
                if (typeof circular === 'object') {
                    depth = circular.depth;
                    prototype = circular.prototype;
                    includeNonEnumerable = circular.includeNonEnumerable;
                    circular = circular.circular;
                }
                // maintain two arrays for circular references, where corresponding parents
                // and children have the same index
                var allParents = [];
                var allChildren = [];

                var useBuffer = typeof Buffer != 'undefined';

                if (typeof circular == 'undefined')
                    circular = true;

                if (typeof depth == 'undefined')
                    depth = Infinity;

                // recurse this function so we don't reset allParents and allChildren
                function _clone(parent, depth) {
                    // cloning null always returns null
                    if (parent === null)
                        return null;

                    if (depth === 0)
                        return parent;

                    var child;
                    var proto;
                    if (typeof parent != 'object') {
                        return parent;
                    }

                    if (parent instanceof nativeMap) {
                        child = new nativeMap();
                    } else if (parent instanceof nativeSet) {
                        child = new nativeSet();
                    } else if (parent instanceof nativePromise) {
                        child = new nativePromise(function (resolve, reject) {
                            parent.then(function (value) {
                                resolve(_clone(value, depth - 1));
                            }, function (err) {
                                reject(_clone(err, depth - 1));
                            });
                        });
                    } else if (doClone.__isArray(parent)) {
                        child = [];
                    } else if (doClone.__isRegExp(parent)) {
                        child = new RegExp(parent.source, __getRegExpFlags(parent));
                        if (parent.lastIndex) child.lastIndex = parent.lastIndex;
                    } else if (doClone.__isDate(parent)) {
                        child = new Date(parent.getTime());
                    } else if (useBuffer && Buffer.isBuffer(parent)) {
                        child = new Buffer(parent.length);
                        parent.copy(child);
                        return child;
                    } else if (parent instanceof Error) {
                        child = Object.create(parent);
                    } else {
                        if (typeof prototype == 'undefined') {
                            proto = Object.getPrototypeOf(parent);
                            child = Object.create(proto);
                        }
                        else {
                            child = Object.create(prototype);
                            proto = prototype;
                        }
                    }

                    if (circular) {
                        var index = allParents.indexOf(parent);

                        if (index != -1) {
                            return allChildren[index];
                        }
                        allParents.push(parent);
                        allChildren.push(child);
                    }

                    if (parent instanceof nativeMap) {
                        var keyIterator = parent.keys();
                        while (true) {
                            var next = keyIterator.next();
                            if (next.done) {
                                break;
                            }
                            var keyChild = _clone(next.value, depth - 1);
                            var valueChild = _clone(parent.get(next.value), depth - 1);
                            child.set(keyChild, valueChild);
                        }
                    }
                    if (parent instanceof nativeSet) {
                        var iterator = parent.keys();
                        while (true) {
                            var next = iterator.next();
                            if (next.done) {
                                break;
                            }
                            var entryChild = _clone(next.value, depth - 1);
                            child.add(entryChild);
                        }
                    }

                    for (var i in parent) {
                        var attrs;
                        if (proto) {
                            attrs = Object.getOwnPropertyDescriptor(proto, i);
                        }

                        if (attrs && attrs.set == null) {
                            continue;
                        }
                        child[i] = _clone(parent[i], depth - 1);
                    }

                    if (Object.getOwnPropertySymbols) {
                        var symbols = Object.getOwnPropertySymbols(parent);
                        for (var i = 0; i < symbols.length; i++) {
                            // Don't need to worry about cloning a symbol because it is a primitive,
                            // like a number or string.
                            var symbol = symbols[i];
                            var descriptor = Object.getOwnPropertyDescriptor(parent, symbol);
                            if (descriptor && !descriptor.enumerable && !includeNonEnumerable) {
                                continue;
                            }
                            child[symbol] = _clone(parent[symbol], depth - 1);
                            if (!descriptor.enumerable) {
                                Object.defineProperty(child, symbol, {
                                    enumerable: false
                                });
                            }
                        }
                    }

                    if (includeNonEnumerable) {
                        var allPropertyNames = Object.getOwnPropertyNames(parent);
                        for (var i = 0; i < allPropertyNames.length; i++) {
                            var propertyName = allPropertyNames[i];
                            var descriptor = Object.getOwnPropertyDescriptor(parent, propertyName);
                            if (descriptor && descriptor.enumerable) {
                                continue;
                            }
                            child[propertyName] = _clone(parent[propertyName], depth - 1);
                            Object.defineProperty(child, propertyName, {
                                enumerable: false
                            });
                        }
                    }

                    return child;
                }

                return _clone(parent, depth);
            }

            /**
             * Simple flat clone using prototype, accepts only objects, usefull for property
             * override on FLAT configuration object (no nested props).
             *
             * USE WITH CAUTION! This may not behave as you wish if you do not know how this
             * works.
             */
            doClone.clonePrototype = function clonePrototype(parent) {
                if (parent === null)
                    return null;

                var c = function () {
                };
                c.prototype = parent;
                return new c();
            };

            // private utility functions

            function __objToStr(o) {
                return Object.prototype.toString.call(o);
            }

            doClone.__objToStr = __objToStr;

            function __isDate(o) {
                return typeof o === 'object' && __objToStr(o) === '[object Date]';
            }

            doClone.__isDate = __isDate;

            function __isArray(o) {
                return typeof o === 'object' && __objToStr(o) === '[object Array]';
            }

            doClone.__isArray = __isArray;

            function __isRegExp(o) {
                return typeof o === 'object' && __objToStr(o) === '[object RegExp]';
            }

            doClone.__isRegExp = __isRegExp;

            function __getRegExpFlags(re) {
                var flags = '';
                if (re.global) flags += 'g';
                if (re.ignoreCase) flags += 'i';
                if (re.multiline) flags += 'm';
                return flags;
            }

            doClone.__getRegExpFlags = __getRegExpFlags;

            return doClone;
        })();

        return _clone(data)
    }

    function isBoolean(booleanish) {
        return true;
    }

    function oatmealParseBoolean(value) {
        switch (typeof value) {
            case 'string':
                value = value.trim().toLowerCase();
                return value === 'false';
            case 'number':
                return value !== 0;
            default:
                break;
        }

        return !!value;
    }

    function isPrimitive(data) {
        return typeof data !== 'object' || data instanceof Date;
    }

    /**
     * Checks if a value is not a number
     * @param {*} numberish A value.
     * @returns {Boolean} Is value a number?
     */
    function isNumber(numberish) {
        return !isNaN(numberish);
    }

    /**
     * Parses a value to an integer (or null).
     * @param {*} value A value.
     * @returns {Number|null} The parsed value.
     */
    function oatmealParseInt(value) {
        return value === null ? null : parseInt(value);
    }

    /**
     * Parses a value to a float (or null).
     * @param {*} value A value.
     * @returns {Number|null} The parsed value.
     */
    function oatmealParseFloat(value) {
        return value === null ? null : parseFloat(value);
    }

    /**
     * Determines if a value is a string.
     * @param {String} stringish
     * @returns {Boolean} Is value a string (or null)?
     */
    function isString(stringish) {
        return typeof stringish === 'string' || stringish === null;
    }

    /**
     * Serializes a value to a string.
     * @param {*} stringish A value.
     * @returns {string} The string value.
     */
    function stringSerializer(stringish) {
        return typeof stringish === 'string' || stringish instanceof String ? stringish : stringish.toString();
    }

    /**
     * Determines if a value is a valid Date.
     * @param {*} dateish A value.
     * @param {Object} model The model.
     * @returns {Boolean} Is the value a valid Date?
     */
    function dateTimeValidator(dateish, model) {
        if (arguments.length < 2) {
            return !isNaN(moment(dateish).toDate());
        }
        return !isNaN(moment(dateish, model._format).toDate());
    }

    /**
     * Serializes a value to a Date.
     * @param {*} dateish A value.
     * @param {Object} model The model.
     * @returns {Date} The Date value.
     */
    function dateTimeSerializer(dateish, model) {
        if (arguments.length < 2) {
            return moment(dateish).toDate();
        }
        return moment(dateish, model._format).toDate();
    }

    /**
     * Creates a new date.
     * @param {*} data The date data.
     * @returns {Date} The new date.
     */
    function constructDate(data) {
        return moment(new Date(data)).toDate();
    }

    /**
     * Deserializes a Date value.
     * @param {*} date A value.
     * @param {Object} model The model.
     * @returns {String} The deserialized Date value.
     */
    function dateTimeDeserializer(date, model) {
        if (arguments.length < 2) {
            return moment(date).format('YYYY-MM-DD');
        }
        return moment(date).format(model._format);
    }

    /**
     * Validates an email.
     * @param {*} value A value.
     * @returns {Boolean} Is the value a valid email?
     */
    function emailValidator(value) {
        return typeof value === 'string' && (
                value.trim().length < 1 ||
                    // http://www.ex-parrot.com/~pdw/Mail-RFC822-Address.html
                value.search(/(?:(?:\r\n)?[ \t])*(?:(?:(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*))*@(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*))*|(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*)*\<(?:(?:\r\n)?[ \t])*(?:@(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*))*(?:,@(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*))*)*:(?:(?:\r\n)?[ \t])*)?(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*))*@(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*))*\>(?:(?:\r\n)?[ \t])*)|(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*)*:(?:(?:\r\n)?[ \t])*(?:(?:(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*))*@(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*))*|(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*)*\<(?:(?:\r\n)?[ \t])*(?:@(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*))*(?:,@(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*))*)*:(?:(?:\r\n)?[ \t])*)?(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*))*@(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*))*\>(?:(?:\r\n)?[ \t])*)(?:,\s*(?:(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*))*@(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*))*|(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*)*\<(?:(?:\r\n)?[ \t])*(?:@(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*))*(?:,@(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*))*)*:(?:(?:\r\n)?[ \t])*)?(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.|(?:(?:\r\n)?[ \t]))*"(?:(?:\r\n)?[ \t])*))*@(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*)(?:\.(?:(?:\r\n)?[ \t])*(?:[^()<>@,;:\\".\[\] \000-\031]+(?:(?:(?:\r\n)?[ \t])+|\Z|(?=[\["()<>@,;:\\".\[\]]))|\[([^\[\]\r\\]|\\.)*\](?:(?:\r\n)?[ \t])*))*\>(?:(?:\r\n)?[ \t])*))*)?;\s*)/i) === 0
            );
    }

    function attachType(obj, type) {
        if (!obj) {
            return;
        }
        obj[typePrefix + 'type'] = type;
    }

    function detachType(obj) {
        if (!obj) {
            return;
        }
        delete obj[typePrefix + 'type'];
    }

    /**
     * Instantiates a value from the given model
     * @param {String} type The type of the instantiated value.
     * @param {String|Object} data The data to merge with the instantiated value.
     * @returns {*} The instantiated value.
     */
    self.instantiateValue = function instantiateValue(type, data) {
        var newValue;

        if (typeof type === 'object' && typeof data === 'undefined') {
            data = {};
        }

        if (isPrimitive(data) || typeof defaultValues[type] !== 'undefined' && isPrimitive(defaultValues[type])) {
            return data;
        }

        newValue = typeof constructors[type] === 'function' ? new constructors[type](data) : clone(data);
        newValue.id = typeof newValue.id === 'undefined' ? null : newValue.id;

        return newValue;
    };

    /**
     * Sets the default value for a type.
     * @param {String} type The type.
     * @param {*} value The default value for the type.
     */
    self.setTypeDefaultValue = function setTypeDefaultValue(type, value) {
        defaultValues[type] = value;
    };

    /**
     * Sets the constructor function for a type.
     * @param {String} type The type.
     * @param {Function} ctorFn The constructor function.
     */
    self.setConstructor = function setConstructor(type, ctorFn) {
        if (typeof ctorFn !== 'function') {
            throw new Error('Unknown constructor function for type "' + type + '"');
        }

        constructors[type] = ctorFn;
    };

    /**
     * Adds a serializer function for a type.
     * @param {String} type The type.
     * @param {Function} serializeFn The serializer function.
     */
    self.addTypeSerializer = function addTypeSerializer(type, serializeFn) {
        serializers[type] = serializers[type] || [];

        if (typeof serializeFn !== 'function') {
            throw new Error('Unknown serialize function for type "' + type + '"');
        }

        serializers[type].push(serializeFn);
    };

    /**
     * Adds a deserializer function for a type.
     * @param {String} type The type.
     * @param {Function} deserializeFn The deserializer function.
     */
    self.addTypeDeserializer = function addTypeDeserializer(type, deserializeFn) {
        deserializers[type] = deserializers[type] || [];

        if (typeof deserializeFn !== 'function') {
            throw new Error('Unknown deserialize function for type "' + type + '"');
        }

        deserializers[type].push(deserializeFn);
    };

    /**
     * Adds a serializer validator function for a type.
     * @param {String} type The type.
     * @param {Function} validateFn The validator function.
     */
    self.addTypeSerializerValidator = function addTypeSerializerValidator(type, validateFn) {
        serializerValidators[type] = serializerValidators[type] || [];

        if (typeof validateFn !== 'function') {
            throw new Error('Unknown serializer validate function for type "' + type + '"');
        }

        serializerValidators[type].push(validateFn);
    };

    /**
     * Adds a deserializer validator function for a type.
     * @param {String} type The type.
     * @param {Function} validateFn The validator function.
     */
    self.addTypeDeserializerValidator = function addTypeSerializerValidator(type, validateFn) {
        deserializerValidators[type] = deserializerValidators[type] || [];

        if (typeof validateFn !== 'function') {
            throw new Error('Unknown deserializer validate function for type "' + type + '"');
        }

        deserializerValidators[type].push(validateFn);
    };

    /**
     * Serializes a value with a model.
     * @param {*} data The data to serialize.
     * @param {*} model The model of the data.
     * @param {*} options The options.
     * @returns {*} The serialized data.
     */
    self.serialize = function serialize(data, model, options) {
        var parents = [],
            loadedData = {},
            loadedModels = {},
            depth;

        options = options || {};
        depth = options.depth;

        if (!isPrimitive(data)) {
            data = clone(data);
        }

        /**
         *
         * @param value
         * @param model
         * @param attrName
         * @returns {*}
         */
        function validate(value, model, attrName) {
            var type = model.attributes[attrName]._type;

            if (!(serializerValidators[type] instanceof Array)) {
                return true;
            }

            return serializerValidators[type]
                    .reduce(function (isValid, validateFn) {
                        if (typeof validateFn !== 'function') {
                            throw new Error('Invalid validator function for type "' + type + '".');
                        }
                        return isValid && validateFn(value, model.attributes[attrName]);
                    }, true) || value === null;
        }

        /**
         *
         * @param value
         * @param model
         * @param attrName
         * @returns {*}
         */
        function serializeValue(value, model, attrName) {
            var type = model.attributes[attrName]._type;

            value = self.instantiateValue(type, value);

            if (!(serializers[type] instanceof Array)) {
                return value;
            }

            serializers[type]
                .forEach(function (serializerFn) {
                    if (typeof serializerFn !== 'function') {
                        throw new Error('Invalid serializer function for type "' + type + '".');
                    }
                    value = serializerFn(value, model.attributes[attrName]);
                });

            attachType(value, model.attributes[attrName]._type);
            return value;
        }

        /**
         *
         * @param data
         * @param attrName
         * @param model
         * @returns {*}
         */
        function serializeNonObject(data, attrName, model) {
            var isNullable, defaultValue, value;

            isNullable = model.attributes[attrName]._nullable !== false;
            defaultValue = model.attributes[attrName]._default;
            value = data[attrName];

            if (!validate(defaultValue, model, attrName) || defaultValue === null) {
                defaultValue = isNullable ? null : defaultValues[model.attributes[attrName]._type];
            }

            if (!validate(value, model, attrName) || value === null) {
                return isNullable ? null : defaultValue;
            }

            return serializeValue(value, model, attrName);
        }

        /**
         *
         * @param data
         * @param attrName
         * @param parentModelName
         * @returns {*}
         */
        function serializeParent(data, attrName, parentModelName) {
            var theParent = null;

            parents.forEach(function (parent, i) {
                var p = parents[parents.length - 1 - i];
                if (theParent !== null || p.model.name !== parentModelName) {
                    return;
                }

                theParent = p.data;
            });

            return data[attrName] = theParent;
        }

        function determineModel(model) {
            var loadedModel = (typeof model === 'object' ? loadedModels[model.name] = model : loadedModels[model]);

            if (!loadedModel) {
                throw new Error('Model not yet defined: "' + model + '"');
            }

            return loadedModel;
        }

        function storeData(data, model) {
            loadedData[model.name] = loadedData[model.name] || {};
            loadedData[model.name][data.id] = data;
        }

        /**
         *
         * @param data
         * @param model
         * @param level
         * @returns {*}
         */
        function serializeObject(data, model, level) {
            if (data === null || typeof data === 'undefined') {
                return null;
            }

            if (isNaN(level) || level === null) {
                level = 0;
            }

            model = determineModel(model);

            parents.push({
                data: data,
                model: model
            });

            storeData(data, model);
            attachType(data, model.name);

            if (!model.attributes) {
                parents.pop();
                return data;
            }

            Object
                .keys(model.attributes) // TODO sort attributes on which comes first
                .forEach(function (attrName) {
                    var dataAttrName = attrName,
                        type = model.attributes[attrName]._type,
                        getter = model.attributes[attrName]._get;

                    if (typeof getter === 'function') {
                        data[computedAttributePrefix + dataAttrName] = getter.call(data);
                        return;
                    }

                    model.attributes[attrName]._nullable = model.attributes[attrName]._nullable !== false;

                    switch (type) {
                        case 'array-collection':
                            if (typeof data[attrName] === 'undefined' || !(data[attrName] instanceof Array)) {
                                data[dataAttrName] = [];
                            }
                            break;
                        case 'object':
                            if (isPrimitive(data[attrName])) {
                                data[dataAttrName] = [];
                            }
                            break;
                        case 'parent':
                            data[dataAttrName] = null;
                            break;
                        default:
                            if (!isPrimitive(data[attrName])) {
                                data[dataAttrName] = defaultValues[model.attributes[attrName]._type];
                            }
                            break;
                    }

                    switch (type) {
                        case 'array-collection':
                            data[dataAttrName].forEach(function (datum, i) {
                                data[dataAttrName][i] = serializeObject(datum, model.attributes[attrName]._model);
                            });
                            break;
                        case 'object':
                            data[dataAttrName] = !isNaN(depth) && level <= depth ? serializeObject(data[attrName], model.attributes[attrName]._model, level + 1) : null;
                            break;
                        case 'parent':
                            data[dataAttrName] = serializeParent(data, attrName, model.attributes[attrName]._model);
                            break;
                        default:
                            data[dataAttrName] = serializeNonObject(data, attrName, model);
                            break;
                    }
                });

            parents.pop();
            return data;
        }

        return serializeObject(data, model);
    };

    /**
     * Deserializes a value with a model.
     * @param {*} rawData The data to deserialize.
     * @param {*} model The model of the data.
     * @param {*} options The options.
     * @returns {*} The deserialized data.
     */
    self.deserialize = function deserialize(rawData, model, options) {
        var loadedModels = {},
            data = !isPrimitive(rawData) ? clone(rawData) : rawData;

        /**
         *
         * @param value
         * @param model
         * @param attrName
         * @returns {*}
         */
        function validate(value, model, attrName) {
            var type = model.attributes[attrName]._type;

            if (!(serializerValidators[type] instanceof Array)) {
                return true;
            }

            return serializerValidators[type]
                    .reduce(function (isValid, validateFn) {
                        if (typeof validateFn !== 'function') {
                            throw new Error('Invalid validator function for type "' + type + '".');
                        }
                        return isValid && validateFn(value, model.attributes[attrName]);
                    }, true) || value === null;
        }

        /**
         *
         * @param value
         * @param model
         * @param attrName
         * @returns {*}
         */
        function deserializeValue(value, model, attrName) {
            var type = model.attributes[attrName]._type;

            if (!(deserializers[type] instanceof Array)) {
                return value;
            }

            deserializers[type]
                .forEach(function (deserializerFn) {
                    if (typeof deserializerFn !== 'function') {
                        throw new Error('Invalid deserializer function for type "' + type + '".');
                    }
                    value = deserializerFn(value, model.attributes[attrName]);
                });

            detachType(value);
            return value;
        }

        /**
         *
         * @param data
         * @param attrName
         * @param model
         * @returns {*}
         */
        function deserializeNonObject(data, attrName, model) {
            var isNullable, defaultValue, value, getter;

            isNullable = model.attributes[attrName]._nullable !== false;
            defaultValue = model.attributes[attrName]._default;
            getter = model.attributes[attrName]._get;
            value = typeof getter === 'function' ? getter.call(data) : data[attrName];

            if (!validate(defaultValue, model, attrName) || defaultValue === null) {
                defaultValue = isNullable ? null : defaultValues[model.attributes[attrName]._type];
            }

            if (!validate(value, model, attrName) || value === null) {
                return isNullable ? null : defaultValue;
            }

            return deserializeValue(value, model, attrName);
        }

        /**
         *
         * @param data
         * @param attrName
         * @returns {{id: *}}
         */
        function deserializeParent(data, attrName) {
            return data[attrName] === null ? null : data[attrName] = { id: data[attrName].id };
        }

        function determineModel(model) {
            var loadedModel = (typeof model === 'object' ? loadedModels[model.name] = model : loadedModels[model]);

            if (!loadedModel) {
                throw new Error('Model not yet defined: "' + model + '"');
            }

            return loadedModel;
        }

        /**
         *
         * @param data
         * @param model
         * @returns {*}
         */
        function deserializeObject(data, model) {
            if (data === null || typeof data === 'undefined') {
                return null;
            }

            detachType(data);
            model = determineModel(model);

            if (!model.attributes) {
                return data;
            }

            function setToDefaultValues(data, model, attrName) {
                var type = model.attributes[attrName]._type;

                switch (type) {
                    case 'array-collection':
                        if (!(data[attrName] instanceof Array)) {
                            data[attrName] = [];
                        }
                        break;
                    case 'object':
                    case 'parent':
                        if (typeof data[attrName] !== 'object') {
                            data[attrName] = null;
                        }
                        break;
                    default:
                        if (typeof data[attrName] === 'undefined') { // TODO validate values
                            data[attrName] = defaultValues[type];
                        }
                        break;
                }
            }

            Object
                .keys(data)
                .sort() // TODO fix sort so that some attributes have priority
                .forEach(function (attrName) {
                    var dataAttrName = attrName,
                        type,
                        setter;

                    if (!model.attributes[attrName]) {
                        return;
                    }

                    type = model.attributes[attrName]._type;
                    setter = model.attributes[attrName]._set;

                    if (typeof setter === 'function' && typeof data[computedAttributePrefix + dataAttrName] !== 'undefined') {
                        setter.call(model);
                        return;
                    }

                    setToDefaultValues(data, model, attrName);

                    switch (type) {
                        case 'array-collection':
                            data[dataAttrName].forEach(function (datum, i) {
                                data[dataAttrName][i] = deserializeObject(datum, model.attributes[attrName]._model);
                            });
                            break;
                        case 'object':
                            data[dataAttrName] = deserializeObject(data[dataAttrName], model.attributes[attrName]._model);
                            break;
                        case 'parent':
                            data[dataAttrName] = deserializeParent(data, attrName);
                            break;
                        default:
                            data[dataAttrName] = deserializeNonObject(data, attrName, model);
                            break;
                    }
                });

            return data;
        }

        return deserializeObject(data, model);
    };

    //
    // Default handling for primitives
    //

    // Booleans
    self.setTypeDefaultValue('boolean', false);
    self.addTypeSerializerValidator('boolean', isBoolean);
    self.addTypeSerializer('boolean', oatmealParseBoolean);
    self.addTypeDeserializerValidator('boolean', isBoolean);
    self.addTypeDeserializer('boolean', oatmealParseBoolean);

    // Integers
    self.setTypeDefaultValue('integer', 0);
    self.addTypeSerializerValidator('integer', isNumber);
    self.addTypeSerializer('integer', oatmealParseInt);
    self.addTypeDeserializerValidator('integer', isNumber);
    self.addTypeDeserializer('integer', oatmealParseInt);

    //  Floats
    self.setTypeDefaultValue('float', 0);
    self.addTypeSerializerValidator('float', isNumber);
    self.addTypeSerializer('float', oatmealParseFloat);
    self.addTypeDeserializerValidator('float', isNumber);
    self.addTypeDeserializer('float', oatmealParseFloat);

    // Strings
    self.setTypeDefaultValue('string', '');
    self.addTypeSerializerValidator('string', isString);
    self.addTypeSerializer('string', stringSerializer);
    self.addTypeDeserializerValidator('string', isString);

    // Date/time
    self.setTypeDefaultValue('datetime', new Date(0));
    self.addTypeSerializer('datetime', dateTimeSerializer);
    self.addTypeSerializerValidator('datetime', dateTimeValidator);
    self.addTypeDeserializerValidator('datetime', dateTimeValidator);
    self.addTypeDeserializer('datetime', dateTimeDeserializer);
    self.setConstructor('datetime', constructDate);

    //
    // Additions
    //
    self.setTypeDefaultValue('email', '');
    self.addTypeSerializer('email', stringSerializer);
    self.addTypeSerializerValidator('email', emailValidator);
    self.addTypeDeserializer('email', stringSerializer);
    self.addTypeDeserializerValidator('email', emailValidator);

    return self;
});
