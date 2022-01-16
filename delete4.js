const jsforce = require('jsforce');
const sleep = (msec) => new Promise((resolve) => setTimeout(resolve, msec));

/**
 * 実行完了待ち
 * 1万件の登録で3～5秒
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

async function manyDelete() {
    const conn = new jsforce.Connection();
    await conn.login(process.env.SF_USER, process.env.SF_PASS);

    let promises = [];
    conn.bulk.pollTimeout = Number.MAX_SAFE_INTEGER; // bulk待ち時間

    // const soql = `SELECT Id FROM Account WHERE CreatedDate = Today LIMIT 10000`;
    const soql = `SELECT Id FROM Account WHERE CreatedDate = Today LIMIT 150000`;
    let queryResult = await conn.query(soql);
    console.log(`Total-Size : ${queryResult.totalSize.toLocaleString()}`);
    let totalCount = 0;
    const PARALELL_SIZE = 50; // 並列処理数(5=1万、20=4万、50=10万)
    // query 1回の取得件数は2000件のため、1万件並列で処理

    if (queryResult.totalSize > 0) {
        let time1 = Date.now();
        console.log('処理開始')
        while (queryResult.records) {

            // 削除処理
            promises.push(
                conn.sobject('Account').deleteBulk(queryResult.records)
            );
            totalCount += queryResult.records.length;

            // 並列処理数に達したら、完了を待つ
            if (promises.length >= PARALELL_SIZE) {
                await waitComplete(promises); // 実行完了待ち

                const processTime = (Date.now() - time1) / 1000; // 処理時間計測2(end)
                console.log(
                    `${totalCount.toLocaleString()}件 削除完了 ${processTime}秒`
                );
                promises = [];
                time1 = Date.now();
            }

            // 未処理のレコードが存在する場合、処理を継続
            if (queryResult.nextRecordsUrl) {
                queryResult = await conn.queryMore(queryResult.nextRecordsUrl);
            } else {
                break;
            }
        }

        await waitComplete(promises); // 実行完了待ち
    }
    return { result: 'success' };
}

const startTime = Date.now(); // 開始時間
manyDelete()
    .then((resolve) => {
        console.log(resolve);
        const endTime = Date.now(); // 終了時間
        console.log(`${(endTime - startTime) / 1000}秒 で完了`);
    })
    .catch((err) => {
        console.log('error');
        console.log(err);
    });
