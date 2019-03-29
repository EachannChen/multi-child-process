# multi-child-process

[![NPM version](http://img.shields.io/npm/v/multi-child-process.svg)](https://www.npmjs.com/package/multi-child-process)
[![Downloads](https://img.shields.io/npm/dm/multi-child-process.svg)](https://www.npmjs.com/package/multi-child-process)

[![NPM](https://nodei.co/npm/multi-child-process.png?downloads=true)](https://nodei.co/npm/multi-child-process/)

A multi-child-process module for Node.js job.

## Usage

### Installation

You can install using [npm](https://www.npmjs.com/package/node-schedule).

```
npm install multi-child-process
```

### Run tests

```
npm test
```

## Examples:
The process pool needs to be initialized before using child processes. The default size of the process pool is the number of cpus. The parameter passed must be a positive integer, but capped at 10. If you do need a larger process pool size, you can modify the source code.
```js
var pool = require('multi-child-process');
var procPool = new pool.initPool(3);//default: the number of cpus
```
Now init child process, these arguments must be passed:

- `workPath`(string) : like './logic' 
- `jobname`(string)  : like 'module.exports.jobname=jobname' in the path './logic' 
- `jobArguments`     : arguments that job function need
- `jobCb`(function)  : callback of job function 

```js
pool.initChildProc(workPath, jobname, jobArguments, jobCb);
```

If all child processes are all available, this message event '`isAllAvail`' will be emitted.
```js
procPool.on('isAllAvail',cb);
```

If all child processes are all available, this `pool.isAllAvail()` will be true.
```js
pool.isAllAvail();
```

Return the number of occupied processes.
```js
pool.actiProcNum();
```

Return the size of child process pool.
```js
pool.totalProcNum();
```

After finishing child process jobs, if you are sure that process pool is no longer needed, `pool.closePool(cb)` can be used. But it is suggested that you are listening to the message event '`isAllAvail`' before using  `pool.closePool(cb)`.  Argument `cb` is callback function.
```js
pool.closePool(cb);
```
