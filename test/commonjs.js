var Oatmeal, data, model, serialized, deserialized;

Oatmeal = require('./../bin/oatmeal');
data = require('./data.json');

model = require('./models/User');
serialized = Oatmeal.serialize(data, model);
deserialized = Oatmeal.deserialize(serialized, model);

console.log("DATA");
console.log(data);
console.log("SERIALIZED");
console.log(serialized);
console.log("DESERIALIZED");
console.log(deserialized);
