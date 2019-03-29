var pool = require('../lib/index');
var procPool = new pool.initPool();

for (var i = 0; i < 5; i++) {
    pool.initChildProc('../test/logic.js', 'job', 'i * 1000000000000', function (err, ret) {
        console.log(err, ret, i);
    })
}

procPool.on('isAllAvail', () => {
    console.log('isAllAvail');
    pool.closePool(function(err,ret){
        console.log('close triggered')
    });
});
