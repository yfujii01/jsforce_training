const jsforce = require('jsforce');
const faker = require('@faker-js/faker');
const sleep = (msec) => new Promise((resolve) => setTimeout(resolve, msec));

/**
 * 取引先ダミーデータ(JSON)生成
 */ 
function generateFakeAccount() {
    return {
        Name: faker.company.companyName(),
        Phone: faker.phone.phoneNumberFormat(),
        Fax: faker.phone.phoneNumberFormat(),
        BillingCountry: faker.address.country(),
        BillingPostalCode: faker.address.zipCode(),
        BillingState: faker.address.state(),
        BillingCity: faker.address.city(),
        BillingStreet: faker.address.streetName(),
        BillingLatitude: faker.address.latitude(),
        BillingLongitude: faker.address.longitude(),
        ShippingCountry: faker.address.country(),
        ShippingPostalCode: faker.address.zipCode(),
        ShippingState: faker.address.state(),
        ShippingCity: faker.address.city(),
        ShippingStreet: faker.address.streetName(),
        ShippingLatitude: faker.address.latitude(),
        ShippingLongitude: faker.address.longitude(),
        Website: faker.internet.url(),
        AnnualRevenue: faker.datatype.number({
            min: 10 * 1000 * 1000,
            max: 10 * 1000 * 1000 * 1000,
        }),
        NumberOfEmployees: faker.datatype.number({
            min: 10,
            max: 100 * 1000,
        }),
    };
}

/**
 * 取引先大量作成
 *
 * @param 作成件数
 */
async function manyCreate(insertCount) {
    try {
        const conn = new jsforce.Connection();
        await conn.login(process.env.SF_USER, process.env.SF_PASS);

        const BAT_SIZE = 200; // 同時コミット数
        const loopCount = Math.ceil(insertCount / BAT_SIZE);

        let promises = [];
        let totalCount = 0;
        const paralellNum = 50; // 並列数
        for (let count = 0; count < loopCount; count++) {
            const objs = [];
            for (let i = count * BAT_SIZE; i < (count + 1) * BAT_SIZE; i++) {
                if (i >= insertCount) {
                    break;
                }
                objs.push(generateFakeAccount());
                totalCount++;
            }
            const time1 = Date.now(); // 処理時間計測2(start)

            promises.push(
                conn.sobject('Account').create(objs, { allOrNone: true })
            );

            if (promises.length % paralellNum == 0) {
                await Promise.all(promises);

                /*
                 * API連続呼び出し負荷軽減用
                 * 短時間に連続して呼び出すとネットワークエラーが発生する
                 */
                await sleep(100);

                const processTime = (Date.now() - time1) / 1000; // 処理時間計測2(end)
                console.log(
                    `${totalCount.toLocaleString()}件 登録完了 ${processTime}秒`
                );
                promises = [];
            }
        }

        const executeResults = await Promise.all(promises);
        executeResults.forEach((results) => {
            results.forEach((res) => {
                if (!res.success) {
                    throw res;
                }
            });
        });

        return 'success';
    } catch (err) {
        console.log(err);
        throw err;
    }
}

const startTime = Date.now(); // 処理時間計測1(start)
const insertCount = 1 * 1000;
manyCreate(insertCount)
    .then(() => {
        const processTime = (Date.now() - startTime) / 1000; // 処理時間計測1(end)
        console.log(
            `${processTime}秒 で ${insertCount.toLocaleString()} 件 insert`
        );
    })
    .catch((err) => {
        console.log('error');
        console.log(err);
    });
