# oatmeal
De/serializes JavaScript models for use in REST APIs.

## Installation

NPM:

    $ npm install --save Temoto-kun/oatmeal
    
## Load

### Browser

Include Oatmeal after Moment.js:

```html
<!-- ... some HTML code ... -->

<script src="moment.js"></script>
<script src="oatmeal.js"></script>

<!-- Use Oatmeal here. -->
```

### CommonJS

Just require Oatmeal:

```javascript
var oatmeal = require('@theoryofnekomata/oatmeal');

// ... use Oatmeal here.
```

### RequireJS

Just add Oatmeal to your module's dependencies:

```javascript
define(['oatmeal'], function (oatmeal) {

// ... use Oatmeal here.

});
```

## Usage

```javascript
var serializedData = oatmeal.serialize(rawDataFromRestApi, model);
var deserializedData = oatmeal.deserialize(serializedData, model);
```

## Model Spec

This is the general structure of a model definition object:

```javascript
var ModelName = {
    "name": "ModelName",
    "attributes": {
        "attrName1": {
            "_type": "string",
            ...
        },
        "attrName2": {
            "_type": "object",
            "_model": AnotherModel,
            ...
        }
    }
}
```

## License

Apache-2.0. See LICENSE file for details.

### TODO

- [ ] Update documentation on model definition spec. 
