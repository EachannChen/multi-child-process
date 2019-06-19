'use strict';

/*
  multi-child-process
  A multi-child-process module for Node.js job.
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
var childProcObj = {};
var procPoolSize = 0;
var that = null;

/* init multiProcess pool methods */
function initPool(processNum) {
    if (processNum && !(/(^[1-9]\d*$)/.test(processNum))) {
        throw (new Error(`argument ${processNum} is not a number`));
    }
    if (processNum > MaxProcNumLimit) {
        throw (new Error('Exceed max process number limit '));
    }
    if (that) {
        return that;
    }
    that = this;

    maxProcNum = processNum || cpus;

    _initPool();

    return this;
}
util.inherits(initPool, events.EventEmitter);

/* apply a child Process methods */
function initChildProc(workPath, jobName, jobArgs, jobCb) {
    var workpath = require(workPath);
    if (!that) {
        jobCb(new Error(` process pool has not been inited`));
        return
    }
    if (!workpath[jobName]) {
        jobCb(new Error(` Module name '${jobName}' of path '${workPath}' is not exit`));
        return
    }

    if (!(jobCb instanceof Function)) {
        jobCb(new Error(` '${jobCb}' is not a function`));
        return
    }

    var cbTriggered = false;

    _initPool();//promise the pool size is set previously

    if (!availProcPool.length) {
        return awaitingJobs.push([initChildProc, workPath, jobName, jobArgs, jobCb]);
    }
    var childProcPid = availProcPool.shift();

    childProcObj[childProcPid].once('error', function (err) {
        if (!cbTriggered) {
            jobCb(err);
            cbTriggered = true;
        }
    });

    childProcObj[childProcPid].once('exit', function (code, signal) {
        if (!cbTriggered && code) {
            jobCb(new Error(`Child Process pid ${this.pid} exited with code: ${code} , signal: ${signal}`));
        }
    });

    childProcObj[childProcPid].once('message', function (msg) {
        jobCb(msg.err, msg.ret);
        cbTriggered = true;
    });

    childProcObj[childProcPid].send({ workPath: workPath, job: jobName, data: jobArgs });
}

/* internal init pool */
function _initPool() {
    for (; procPoolSize < maxProcNum; procPoolSize++) {
        var childProc = cp.fork(path.join(__dirname, "./subProcess"));
        childProcObj[childProc.pid] = childProc;
        availProcPool.push(childProc.pid);
        allProcPool.push(childProc.pid);
        childProcObj[childProc.pid].removeAllListeners();

        childProcObj[childProc.pid].on('error', function (err) {
            this.kill();
        });

        childProcObj[childProc.pid].on('exit', function (code, signal) {
            procPoolSize--;
            var availPoolIdx = availProcPool.indexOf(this.pid);
            var allPoolIdx = allProcPool.indexOf(this.pid);
            if (availPoolIdx != -1) {
                availProcPool.splice(availPoolIdx, 1);
            }
            if (allPoolIdx != -1) {
                allProcPool.splice(allPoolIdx, 1);
            }
            delete childProcObj[this.pid];
            if (!allProcPool.length) {
                that.emit('closed');
            }
        });

        childProcObj[childProc.pid].on('message', function (msg) {
            availProcPool.push(this.pid);
            if (awaitingJobs.length) {
                setImmediate.apply(null, awaitingJobs.shift());
            } else if (allProcPool.length == availProcPool.length) {
                that.emit('isAllAvail');
            }
        });

    }
}

/* close Process pool methods */
function closePool(cb) {
    if (!(cb instanceof Function)) {
        cb(new Error(` '${cb}' is not a function`));
        return
    }
    for (var idx = availProcPool.length; idx > 0;) {
        idx--;
        childProcObj[availProcPool[idx]].kill();
    }
    that.on('closed', function () {
        that = null;
        cb(null, true);
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

/* process pool size  */
function totalProcNum() {
    return procPoolSize;
}

/* process pool is or isn't inited  */
function isInited() {
    return that !== null;
}


/* Public API */
module.exports.initPool = initPool;
module.exports.closePool = closePool;
module.exports.isAllAvail = isAllAvail;
module.exports.initChildProc = initChildProc;
module.exports.actiProcNum = actiProcNum;
module.exports.totalProcNum = totalProcNum;
module.exports.isInited = isInited;