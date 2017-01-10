var Oatmeal, data, User, serialized, deserialized;

Oatmeal = require('./../bin/oatmeal');
data = require('./data.json');

User = require('./models/User');

console.log("DATA");
console.log(data);
console.log("SERIALIZED");
console.log(serialized = Oatmeal.serialize(data, User));
console.log("DESERIALIZED");
console.log(deserialized = Oatmeal.deserialize(serialized, User));
console.log("COMPARISON");
console.log(JSON.stringify(data), JSON.stringify(deserialized));
