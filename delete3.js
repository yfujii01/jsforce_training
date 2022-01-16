const jsforce = require('jsforce');
const sleep = (msec) => new Promise((resolve) => setTimeout(resolve, msec));

async function manyDelete() {
    try {
        const conn = new jsforce.Connection();
        await conn.login(process.env.SF_USER, process.env.SF_PASS);

        let promises = [];
        conn.bulk.pollTimeout = Number.MAX_SAFE_INTEGER; // 9007199254740991

        // const limit = 210000;

        const soql = `SELECT Id FROM Account WHERE CreatedDate = Today`;
        // const soql = `SELECT Id FROM Account WHERE CreatedDate = Today LIMIT ${limit}`;
        let queryResult = await conn.query(soql);
        console.log(`Total-Size : ${queryResult.totalSize}`);
        let totalCount = 0;
        const paralellNum = 20; // 50=1万件単位、100=2万件単位

        if (queryResult.totalSize > 0) {
            while (queryResult.records) {
                const time1 = Date.now();

                // 削除
                promises.push(
                    conn.sobject('Account').deleteBulk(queryResult.records)
                );
                totalCount += promises.length * 2000;
                if (promises.length % paralellNum == 0) {
                    await Promise.all(promises);

                    await sleep(100);
                    const processTime = (Date.now() - time1) / 1000;
                    console.log(
                        `${totalCount.toLocaleString()}件 削除完了 ${processTime}秒`
                    );

                    // 配列クリア
                    promises = [];
                }

                if (queryResult.nextRecordsUrl) {
                    queryResult = await conn.queryMore(
                        queryResult.nextRecordsUrl
                    );
                } else {
                    break;
                }
            }

            await Promise.all(promises);
        }
        return { result: 'success' };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

const startTime = Date.now(); // 開始時間
manyDelete().then((resolve) => {
    console.log(resolve);
    const endTime = Date.now(); // 終了時間
    console.log(`${(endTime - startTime) / 1000}秒 で完了`);
});
