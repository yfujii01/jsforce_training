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

        const maxCount = 10;
        const batSize = 200;
    
        const promises = [];
    
        conn.bulk.pollInterval = 5000; // 5 sec
        conn.bulk.pollTimeout = 20000; // 60 sec
    
        promises.push(
            conn
                .sobject('Account')
                .find({
                    CreatedDate: { $eq: jsforce.Date.TODAY },
                })
                .limit(20000)
                .destroy({
                    useBulk: true,
                })
        );
    
        const executeResults = await Promise.all(promises);
    
        executeResults.forEach((results) => {
            results.forEach((res) => {
                if (!res.success) {
                    console.log(res.errors);
                }
            });
        });
    
        const endTime = Date.now(); // 終了時間
        console.log(`${(endTime - startTime) / 1000}秒 で完了`);
    } catch (err) {
        console.log(err);
    }
}

// async function deleteData(conn: jsforce.Connection) {

// }

allDelete();
