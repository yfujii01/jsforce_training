var jsforce = require('jsforce');
var conn = new jsforce.Connection();
conn.login(process.env.SF_USER, process.env.SF_PASS, function (err, res) {
    if (err) {
        return console.error(err);
    }

    const startTime = Date.now(); // 開始時間
    console.log(`${getNowFormat()} : 処理開始`);

    const maxCount = 10;
    const batSize = 200;

    const promises = [];

    for (let count = 0; count < maxCount; count++) {
        const objs = [];
        for (let i = count * batSize; i < (count + 1) * batSize; i++) {
            objs.push({ Name: 'My AccountsZ #' + ('' + i).padStart(3, '0') });
        }
        promises.push(
            conn
                .sobject('Account')
                .create(objs, { allOrNone: true }, function (err, rets) {
                    if (err) {
                        console.log('error !!!!');
                        return console.error(err);
                    }
                    if (rets) {
                        console.log(`${batSize}件投入`);
                    }
                })
        );
    }

    Promise.all(promises)
        .then((values) => {
            const endTime = Date.now(); // 終了時間
            console.log(`${getNowFormat()} : 処理完了`);
            console.log(
                `${(endTime - startTime) / 1000}秒 で ${(
                    maxCount * batSize
                ).toLocaleString()} 件の投入完了`
            ); // 何ミリ秒かかったかを表示する
        })
        .catch((err) => {
            console.error('[failure]', err);
        });
});

function getNowFormat() {
    const date1 = new Date();
    const date2 =
        date1.getFullYear() +
        '/' +
        (date1.getMonth() + 1) +
        '/' +
        date1.getDate() +
        ' ' +
        date1.getHours() +
        ':' +
        date1.getMinutes() +
        ':' +
        date1.getSeconds() +
        '.' +
        date1.getMilliseconds();
    return date2;
}
