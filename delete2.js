const { map } = require('@faker-js/faker/lib/locales/ja/address/country');
var jsforce = require('jsforce');

async function allDelete() {
    try {
        const conn = new jsforce.Connection();
        const response = await conn.login(
            process.env.SF_USER,
            process.env.SF_PASS
        );
        // console.log(response);

        // deleteData(conn);
        const startTime = Date.now(); // 開始時間

        const promises = [];

        conn.bulk.pollInterval = 5000; // 5 sec
        // conn.bulk.pollTimeout = 60000; // 60 sec
        conn.bulk.pollTimeout = Number.MAX_SAFE_INTEGER; // 9007199254740991

        const limit = 210000;

        let queryResult = await conn.query(
            `SELECT Id FROM Account WHERE CreatedDate = Today LIMIT ${limit}`
        );
        console.log(`Total-Size : ${queryResult.totalSize}`);

        while (queryResult.records) {
            // 削除
            promises.push(
                conn.sobject('Account').deleteBulk(queryResult.records)
            );
            // const res = await conn.sobject('Account').deleteBulk(queryResult.records);
            // console.log(`Delete-Size : ${res.length}`);
            if (queryResult.nextRecordsUrl) {
                queryResult = await conn.queryMore(queryResult.nextRecordsUrl);
            } else {
                break;
            }
        }

        // query.records

        // promises.push(
        //     conn
        //         .sobject('Account')
        //         .find({
        //             CreatedDate: { $eq: jsforce.Date.TODAY },
        //         })
        //         // .limit(20000)
        //         .run({ autoFetch: true, maxFetch: 20000 })
        //         .destroy({
        //             useBulk: true,
        //         })
        // );

        const executeResults = await Promise.all(promises);

        // executeResults.forEach((results) => {
        //     results.forEach((res) => {
        //         if (!res.success) {
        //             console.log(res.errors);
        //         }
        //     });
        // });

        const endTime = Date.now(); // 終了時間
        console.log(`${(endTime - startTime) / 1000}秒 で完了`);
    } catch (err) {
        console.log(err);
    }
}

// async function deleteData(conn: jsforce.Connection) {

// }

allDelete();
