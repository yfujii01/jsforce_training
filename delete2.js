const jsforce = require('jsforce');

async function manyDelete() {
    try {
        const conn = new jsforce.Connection();
        await conn.login(process.env.SF_USER, process.env.SF_PASS);

        const promises = [];
        conn.bulk.pollTimeout = Number.MAX_SAFE_INTEGER; // 9007199254740991

        const limit = 210000;

        let queryResult = await conn.query(
            `SELECT Id FROM Account WHERE CreatedDate = Today LIMIT ${limit}`
        );
        console.log(`Total-Size : ${queryResult.totalSize}`);

        if (queryResult.totalSize > 0) {
            while (queryResult.records) {
                // 削除
                promises.push(
                    conn.sobject('Account').deleteBulk(queryResult.records)
                );
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
        return err;
    }
}

const startTime = Date.now(); // 開始時間
manyDelete().then((resolve) => {
    console.log(resolve);
    const endTime = Date.now(); // 終了時間
    console.log(`${(endTime - startTime) / 1000}秒 で完了`);
});
