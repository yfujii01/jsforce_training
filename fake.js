var faker = require('@faker-js/faker');

// faker.setLocale('ja');
var randomName = faker.name.findName(); // Rowan Nikolaus
var randomEmail = faker.internet.email(); // Kassandra.Haley@erich.biz
var randomCard = faker.helpers.createCard(); // random contact card containing many properties


const randomLocation = () => (
    {
     address: {
      country: faker.address.country(),
      city: faker.address.city(),
      streetName: faker.address.streetName(),
      state: faker.address.state()
     },
     position: {
      longitude: -180 + Math.random() * 360,
      latitude: -89.99 + Math.random() * 180
     }
    })
   

// console.log(randomName);
for (let i = 0; i < 20; i++) {
    // console.log(faker.company.companyName());
    // console.log(faker.lorem.word());
    // console.log(faker.address.city());
    // console.log(randomLocation());
    // console.log(faker.company.companySuffix())
    // console.log(faker.finance.amount())
    // console.log(faker.datatype.number({min:100, max:120}))
    console.log(faker.random.word())
}

