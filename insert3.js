const jsforce = require('jsforce');
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

async function manyCreate(insertCount) {
    try {
        const conn = new jsforce.Connection();
        await conn.login(process.env.SF_USER, process.env.SF_PASS);

        const BAT_SIZE = 200;
        const loopCount = Math.ceil(insertCount / BAT_SIZE);
        // conn.bulk.pollTimeout = Number.MAX_SAFE_INTEGER; // 9007199254740991

        let promises = [];
        let totalCount = 0;
        const paralellNum = 50; // 50=1万件単位、100=2万件単位
        for (let count = 0; count < loopCount; count++) {
            const objs = [];
            for (let i = count * BAT_SIZE; i < (count + 1) * BAT_SIZE; i++) {
                if (i >= insertCount) {
                    break;
                }
                objs.push({
                    Name: 'AccountsHOGE #' + ('' + i).padStart(7, '0'),
                });
                totalCount++;
            }
            const time1 = Date.now();

            // console.log('登録処理:' + count);
            // await conn.sobject('Account').create(objs, { allOrNone: true });

            promises.push(
                conn.sobject('Account').create(objs, { allOrNone: true })
            );

            if (promises.length % paralellNum == 0) {
                await Promise.all(promises);
                // const time2 = Date.now();

                await sleep(100)
                const processTime = (Date.now() - time1) / 1000;
                console.log(
                    `${totalCount.toLocaleString()}件 登録完了 ${processTime}秒`
                );

                // 配列クリア
                promises = [];

                // console.log('sleep start')
                // console.log('sleep end')

            }
        }

        console.log('promises = ' + promises.length);
        const executeResults = await Promise.all(promises);

        console.log('suc');
        executeResults.forEach((results) => {
            results.forEach((res) => {
                if (!res.success) {
                    console.log('res.success = false');
                    // console.log(res.errors);
                    throw res;
                }
                // console.log(res)
            });
        });

        return 'success';
    } catch (err) {
        console.log(err);
        throw err;
    }
}

const startTime = Date.now(); // 開始時間
const insertCount = 1000 * 1000; // 100万(全並列だとエラー)
// const insertCount = 20 * 1000;
manyCreate(insertCount)
    .then(() => {
        const endTime = Date.now(); // 終了時間
        console.log(
            `${
                (endTime - startTime) / 1000
            }秒 で ${insertCount.toLocaleString()} 件 insert`
        );
    })
    .catch((err) => {
        console.log('error');
        // console.log(err);
    });
