var jsforce = require('jsforce');

async function manyCreate() {
    try {
        const conn = new jsforce.Connection();
        const response = await conn.login(
            process.env.SF_USER,
            process.env.SF_PASS
        );
        console.log(response)

        createData(conn);
    } catch (err) {
        console.log(err);
    }
}

async function createData(conn) {
    const startTime = Date.now(); // 開始時間

    const maxCount = 100;
    const batSize = 200;

    const promises = [];

    for (let count = 0; count < maxCount; count++) {
        const objs = [];
        for (let i = count * batSize; i < (count + 1) * batSize; i++) {
            objs.push({ Name: 'AccountsHOGE #' + ('' + i).padStart(7, '0') });
        }
        promises.push(
            conn.sobject('Account').create(objs, { allOrNone: true })
        );
    }

    const executeResults = await Promise.all(promises);

    executeResults.forEach((results) => {
        results.forEach((res) => {
            if (!res.success) {
                console.log(res.errors);
            }
        });
    });

    const endTime = Date.now(); // 終了時間
    console.log(
        `${(endTime - startTime) / 1000}秒 で ${(
            maxCount * batSize
        ).toLocaleString()} 件の投入完了`
    );
}

manyCreate();
