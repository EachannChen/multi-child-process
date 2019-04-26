### <a name="usage-pane"></a>使用介绍
#### 安装
可以通过 npm 命令安装.

``` bash
$ npm install multi-child-process
```
#### 测试
``` bash
$ npm test
```
#### 使用
首先require模块

```js
var pool = require('multi-child-process');
```
在使用childprocess之前，需要先初始化进程池：

```js
var procPool = new pool.initPool(3);//default: the number of cpus
```
调用`pool.initPool()`，默认产生的子进程数是服务器的cpu个数，你可以根据自己需要传入一个正整数。但是上限是10。如果你确实需要更大的进程数，你可以修改源码。


接下里就可以初始化子进程了，以下参数必须传递：

```js
pool.initChildProc(workPath, jobname, jobArgObject, cb);
```
- `workPath`(string) : 模块的所在文件的绝对路径，比如 `__dirname+'/logic.js'`
- `jobname`(string)  : 在`workPath`路径下的模块exports的函数名字，比如 'module.exports.jobname=jobname'
- `jobArgObject`(object): 对应函数所需的参数, 比如 {key1:value1,key2:value2}
- `cb`(function)  : 子进程运行完后的回调函数

```js
//./main.js
pool.initChildProc(__dirname+'/logic.js', jobname, jobArgObject, function(err,ret){
//err: error of child process or job
//ret: result of job function callback
});

//./logic.js
function jobname(jobArgObject,callback){
//callback(error,ret)
}
module.exports.jobname=jobname;
```
以下是对外API

如果进程池已经完成初始化，函数 `pool.isInited()` 会返回去true。
```js
pool.isInited();
```

如果所有的子进程都没在运行任务，则事件 '`isAllAvail`'会被触发。
```js
procPool.on('isAllAvail',cb);
```

如果所有的子进程都没在运行任务, 函数 `pool.isAllAvail()` 会返回true。
```js
pool.isAllAvail();
```

返回在运行任务的子进程数目。
```js
pool.actiProcNum();
```

返回子进程池的大小。
```js
pool.totalProcNum();
```

如果在完成所有任务后，确定进程池不再需要的话，可以调用 `pool.closePool(cb)` 函数。但是建议在监听到事件'`isAllAvail`'被触发后，再调用`pool.closePool(cb)`。参数`cb` 是关闭进程池后的回调函数。
```js
pool.closePool(cb);
```