'use strict';

/*
  multi-child-process
  A multi-child-process module for Node job.
*/

/*是否已经启动进程池
线程池新增，或数量减少
是否维护进程池
每个函数参数效验
异常抛出错误

*/
var cp = require('child_process');
var util = require('util');
const cpus = require('os').cpus().length;
const events = require('events');
var path = require("path");
var maxProcNum = cpus;
const MaxProcNumLimit = 10;
var awaitingJobs = [];
var availProcPool = [];
var allProcPool = [];

var procPoolSize = 0;
var that = null;

/* init multiProcess pool methods */
function initPool(processNum) {
    if (processNum && !(/(^[1-9]\d*$)/.test(processNum))) {
        throw (new Error(`argument processNum ${processNum} is not a number`));
    }
    if (processNum > MaxProcNumLimit) {
        throw (new Error('Exceed max process number limit '));
    }

    that = this;

    maxProcNum = processNum || cpus;
    for (; procPoolSize < maxProcNum; procPoolSize++) {
        var childProc = cp.fork(path.join(__dirname, "./subProcess"));
        availProcPool.push(childProc);
        allProcPool.push(childProc);
    }
    return this;
}
util.inherits(initPool, events.EventEmitter);

/* apply a child Process methods */
function initChildProc(workPath, job, args, cb) {
    var workpath = require(workPath);
    if (!workpath[job]) {
        cb(new Error(` Module name '${job}' of path '${workPath}' is not exit`));
        return
    }

    if (!(cb instanceof Function)) {
        cb(new Error(` '${cb}' is not a function`));
        return
    }

    var cbTriggered = false;

    if (!availProcPool.length) {
        return awaitingJobs.push([initChildProc, workPath, job, args, cb]);
    }
    var childProc = availProcPool.shift();

    childProc.removeAllListeners();

    childProc.once('error', function (err) {
        if (!cbTriggered) {
            cb(err);
            cbTriggered = true;
        }
        childProc.kill();
    });

    childProc.once('exit', function (code, signal) {
        if (!cbTriggered && code) {
            cb(new Error(`Child Process pid ${childProc.pid} exited with code: ${code} , signal: ${signal}`));
        }

        procPoolSize--;
        var availPoolIdx = availProcPool.indexOf(childProc);
        var allPoolIdx = allProcPool.indexOf(childProc);
        if (availPoolIdx != -1) {
            availProcPool.splice(availPoolIdx, 1);
        }
        if (allPoolIdx != -1) {
            allProcPool.splice(allPoolIdx, 1);
        }
        if(!allProcPool.length){
            that.emit('closed');
        }
    });

    childProc.once('message', function (msg) {
        cb(msg.err, msg.ret);
        cbTriggered = true;
        availProcPool.push(childProc);
        if (awaitingJobs.length) {
            setImmediate.apply(null, awaitingJobs.shift());
        } else if (allProcPool.length == availProcPool.length) {
            that.emit('isAllAvail');
        }
    });

    childProc.send({ workPath: workPath, job: job, data: args });
}

/* close Process pool methods */
function closePool(cb) {
    for (var idx=availProcPool.length; idx > 0;) {
        idx--;
        availProcPool[idx].kill();
    }
    that.on('closed',function(){
        cb(null,true);
    })
}

/* Process is or isn't all available methods */
function isAllAvail() {
    return procPoolSize == availProcPool.length;
}

/* active process number */
function actiProcNum() {
    return procPoolSize - availProcPool.length;
}

/* active process number */
function totalProcNum() {
    return procPoolSize;
}

/* Public API */
module.exports.initPool = initPool;
module.exports.closePool = closePool;
module.exports.isAllAvail = isAllAvail;
module.exports.initChildProc = initChildProc;
module.exports.actiProcNum = actiProcNum;
module.exports.totalProcNum = totalProcNum;
