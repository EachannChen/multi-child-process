process.on('message', (msg) => {
    var work = require(msg.workPath);
    try {
        work[msg.job](msg.data, function (err, ret) {
            process.send({ err: err, ret: ret });
        })
    } catch (error) {
        process.send({ err: error, ret: null });
    }
})



