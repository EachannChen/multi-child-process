function job(arg, cb) {
    sleep(1000);
    cb(null, arg);
}

function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime) {
            break;
        }
    }
}

module.exports.job = job