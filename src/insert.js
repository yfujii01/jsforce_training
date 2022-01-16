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
        ShippingCountry: faker.address.country(),
        ShippingPostalCode: faker.address.zipCode(),
        ShippingState: faker.address.state(),
        ShippingCity: faker.address.city(),
        ShippingStreet: faker.address.streetName(),
        Website: faker.internet.url(),
        AnnualRevenue: faker.datatype.number({
            min: 10 * 1000 * 1000,
            max: 10 * 1000 * 1000 * 1000,
        }),
        NumberOfEmployees: faker.datatype.number({
            min: 10,
            max: 100 * 1000,
        }),
        Site: faker.random.word(),
    };
}

/**
 * 実行完了待ち
 *
 * @param {*} promises
 */
async function waitComplete(promises) {
    const executeResults = await Promise.all(promises); // 実行完了待ち

    // 登録結果のエラーチェック
    executeResults.forEach((results) => {
        results.forEach((res) => {
            if (!res.success) {
                throw res;
            }
        });
    });

    /*
     * API連続呼び出し負荷軽減用
     * 短時間に連続して呼び出すとネットワークエラーが発生する
     */
    await sleep(100);
}

/**
 * 取引先大量作成
 *
 * @param {*} insertCount 作成件数
 */
async function manyCreate(insertCount) {
    const conn = new jsforce.Connection();
    await conn.login(process.env.SF_USER, process.env.SF_PASS);

    const BAT_SIZE = 200; // 同時コミット数
    const PARALELL_SIZE = 50; // 並列処理数
    // ↑コミット数(200件)のデータを50並列で、1万件ずつinsertする

    let promises = []; // 並列数を管理するobject
    let totalCount = 0; // 実行件数

    // 登録したい数をコミット数で割った数だけループさせる
    const loopMaxCount = Math.ceil(insertCount / BAT_SIZE);
    for (let count = 0; count < loopMaxCount; count++) {
        // 同時登録件数の設定(MAXはBAT_SIZE)
        let childLoopMax = BAT_SIZE;
        if (insertCount < totalCount + BAT_SIZE) {
            childLoopMax = insertCount - totalCount;
        }

        // 取引先レコード作成
        const objs = [];
        for (let i = 0; i < childLoopMax; i++) {
            objs.push(generateFakeAccount());
        }
        totalCount += objs.length;

        const time1 = Date.now(); // 処理時間計測2(start)

        // 並列処理のための配列に登録
        promises.push(
            conn.sobject('Account').create(objs, { allOrNone: true })
        );

        // 並列処理数に達したら、完了を待つ
        if (promises.length >= PARALELL_SIZE) {
            await waitComplete(promises); // 実行完了待ち

            const processTime = (Date.now() - time1) / 1000; // 処理時間計測2(end)
            console.log(
                `${totalCount.toLocaleString()}件 登録完了 ${processTime}秒`
            );
            promises = [];
        }
    }
    await waitComplete(promises); // 実行完了待ち
}

const startTime = Date.now(); // 処理時間計測1(start)
const insertCount = 1000 * 1000; // 作成件数(100万件 = 1000 * 1000)
// 100万件で約10分
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
