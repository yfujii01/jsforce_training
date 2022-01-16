const jsforce = require('jsforce');

/**
 * 与えられたイテラブルから得られる関数を順に、
 * 指定された数まで並列に実行する。
 *
 * @param iterable {Iterable<() => Promise<void>}
 *  実行したい関数を要素に持つイテラブル。
 *  各関数は引数を持たず、Promise を返す。
 * @param concurrency {number} この数まで並列に実行する。
 * @return {Promise<void>}
 *  全ての関数を実行し終えると resolve される Promise。
 */
async function runConcurrentlyAsync(iterable, concurrency) {
    const iterator = iterable[Symbol.iterator]();
    let index = 0; // ログ用
    const promises = Array.from({ length: concurrency }, (_, id) => {
        return new Promise(async (resolve) => {
            for (
                let result = iterator.next();
                !result.done;
                result = iterator.next()
            ) {
                const i = index++;
                console.log(`${id}: ${i}...`);

                await result.value();

                console.log(`        ...${id}: ${i}`);
            }

            resolve();
        });
    });
    await Promise.all(promises);
}

async function manyCreate(insertCount) {
    try {
        const conn = new jsforce.Connection();
        await conn.login(process.env.SF_USER, process.env.SF_PASS);

        const BAT_SIZE = 200;
        const loopCount = Math.ceil(insertCount / BAT_SIZE);

        const promises = [];

        for (let count = 0; count < loopCount; count++) {
            const objs = [];
            for (let i = count * BAT_SIZE; i < (count + 1) * BAT_SIZE; i++) {
                if (i >= insertCount) {
                    break;
                }
                objs.push({
                    Name: 'AccountsHOGE #' + ('' + i).padStart(7, '0'),
                });
            }
            promises.push(
                conn.sobject('Account').create(objs, { allOrNone: true })
            );
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
