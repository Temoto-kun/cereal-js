var Oatmeal, data, model, serialized, deserialized;

Oatmeal = require('./../bin/oatmeal');

model = require('./models/User');
serialized = Oatmeal.serialize(data, model);
deserialized = Oatmeal.deserialize(serialized, model);

console.log(data);
//console.log(serialized);
//console.log(deserialized);
