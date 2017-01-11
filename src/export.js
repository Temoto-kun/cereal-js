(function (root, name, dependencies, factory) {
    var Oatmeal = function Oatmeal(deps) {
        return (root[name] = factory.apply(null, deps));
    };

    if (typeof define === 'function' && define.amd) {
        define(dependencies, function (moment) {
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

    // http://blog.soulserv.net/understanding-object-cloning-in-javascript-part-ii/
    function clone(originalObject) {
        // First create an empty object with
        // same prototype of our original source

        var propertyIndex,
            descriptor,
            keys,
            current,
            nextSource,
            indexOf,
            copies = [{
                source: originalObject,
                target: Object.create(Object.getPrototypeOf(originalObject))
            }],
            cloneObject = copies[0].target,
            sourceReferences = [originalObject],
            targetReferences = [cloneObject];

        // First in, first out
        while (current = copies.shift()) {
            keys = Object.getOwnPropertyNames(current.source);

            for (propertyIndex = 0; propertyIndex < keys.length; propertyIndex++) {
                // Save the source's descriptor
                descriptor = Object.getOwnPropertyDescriptor(current.source, keys[propertyIndex]);

                if (!descriptor.value || typeof descriptor.value !== 'object' || descriptor.value instanceof Date) {
                    // Added instanceof Date check
                    Object.defineProperty(current.target, keys[propertyIndex], descriptor);
                    continue;
                }

                nextSource = descriptor.value;
                descriptor.value = Array.isArray(nextSource) ?
                    [] :
                    Object.create(Object.getPrototypeOf(nextSource));

                indexOf = sourceReferences.indexOf(nextSource);

                if (indexOf !== -1) {
                    // The source is already referenced, just assign reference
                    descriptor.value = targetReferences[indexOf];
                    Object.defineProperty(current.target, keys[propertyIndex], descriptor);
                    continue;
                }

                sourceReferences.push(nextSource);
                targetReferences.push(descriptor.value);

                Object.defineProperty(current.target, keys[propertyIndex], descriptor);

                copies.push({ source: nextSource, target: descriptor.value });
            }
        }

        return cloneObject;
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
     * @returns {*} The serialized data.
     */
    self.serialize = function serialize(data, model) {
        var parents = [];
        var loadedData = {};
        var loadedModels = {};

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
         * @returns {*}
         */
        function serializeObject(data, model) {
            if (data === null || typeof data === 'undefined') {
                return null;
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
                            if (!(data[dataAttrName] instanceof Array)) {
                                data[dataAttrName] = [];
                            }
                            data[dataAttrName].forEach(function (datum, i) {
                                data[dataAttrName][i] = serializeObject(datum, model.attributes[attrName]._model);
                            });
                            break;
                        case 'object':
                            data[dataAttrName] = serializeObject(data[attrName], model.attributes[attrName]._model);
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
     * @param {*} data The data to deserialize.
     * @param {*} model The model of the data.
     * @returns {*} The deserialized data.
     */
    self.deserialize = function deserialize(data, model) {
        var loadedModels = {};

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
            return data[attrName] = { id: data[attrName].id };
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

                    if (typeof setter === 'function') {
                        setter.call(model);
                        return;
                    }

                    switch (type) {
                        case 'array-collection':
                            if (!(data[dataAttrName] instanceof Array)) {
                                data[dataAttrName] = [];
                            }
                            data[dataAttrName].forEach(function (datum, i) {
                                data[dataAttrName][i] = deserializeObject(datum, model.attributes[attrName]._model);
                            });
                            break;
                        case 'object':
                            if (typeof data[dataAttrName] !== 'object') {
                                data[dataAttrName] = null;
                            }
                            data[dataAttrName] = deserializeObject(data[attrName], model.attributes[attrName]._model);
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
