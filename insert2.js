const jsforce = require('jsforce');

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

        console.log('suc')
        executeResults.forEach((results) => {
            results.forEach((res) => {
                if (!res.success) {
                    console.log('res.success = false')
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
const insertCount = 1000 * 1000
manyCreate(insertCount)
    .then(() => {
        const endTime = Date.now(); // 終了時間
        console.log(`${(endTime - startTime) / 1000}秒 で ${insertCount.toLocaleString()} 件 insert`);
    })
    .catch((err) => {
        console.log('error');
        // console.log(err);
    });
