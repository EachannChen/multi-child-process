// index.test.js

var expect = require('chai').expect;
var events = require('events');
var path = require("path");
var poolSize = 3;


describe('主函数测试', function () {
  var poolModule = require('../lib/index.js');
  var procPool = new poolModule.initPool(poolSize);

  it('测试：进程池启动成功initPool', function () {
    expect(procPool).to.be.an.instanceof(events);
  });

  it('测试：使用子进程并运行完毕', function (done) {
    poolModule.initChildProc(path.join(__dirname, "./logic"), 'job', 1, function (err, ret) {
      expect(err).to.be.not.ok;
      expect(ret).to.be.ok;
      done();
    })
  });

  it('测试：进程是否全部可用isAllAvail', function () {
    expect(poolModule.isAllAvail()).to.be.ok;
  });

  it('测试：激活的进程总数totalProcNum', function () {
    expect(poolModule.totalProcNum()).to.be.equal(poolSize);
  });

  it('测试：运行中的进程数actiProcNum', function (done) {
    poolModule.initChildProc(path.join(__dirname, "./logic"), 'job', 1, function (err, ret) {
      done();
    })
    expect(poolModule.actiProcNum()).to.be.equal(1);
  });

  it('测试：监听isAllAvail事件', function (done) {
    poolModule.initChildProc(path.join(__dirname, "./logic"), 'job', 1, function (err, ret) {
    })
    procPool.on('isAllAvail', function () {
      expect(true).to.be.ok;
      done();
    })
  });

  it('测试：关闭进程池closePool', function () {
    expect(poolModule.totalProcNum()).to.be.equal(poolSize);
    poolModule.closePool(function (done) {
      expect(poolModule.actiProcNum()).to.be.equal(0);
      expect(poolModule.totalProcNum()).to.be.equal(0);
      done();
    });
  });

});
