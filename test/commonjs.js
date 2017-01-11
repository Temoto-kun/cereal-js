var Oatmeal, data, User, serialized, deserialized;

Oatmeal = require('./../bin/oatmeal');
data = require('./data.json');

User = require('./models/User');

console.log("DATA");
console.log(JSON.stringify(data, null, 2));
console.log("SERIALIZED");
console.log(serialized = Oatmeal.serialize(data, User));
console.log("DESERIALIZED");
console.log(JSON.stringify(deserialized = Oatmeal.deserialize(serialized, User), null, 2));
console.log("COMPARISON");
console.log(JSON.stringify(data, null, 2));
console.log(JSON.stringify(deserialized, null, 2));

console.log(Oatmeal.instantiateValue(User, { email: 'spam@email.com' }));
