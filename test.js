var test = require('tape')
var around = require('./index')
var block

var sandbox = around(function (t, next) {
  var sandbox = require('sinon').sandbox.create()
  return next(sandbox)
    .then(function () { sandbox.restore() })
})

block = around(function (t, next) {
  t.pass('before called')
  return next(200)
    .then(function () {
      t.pass('after called')
    })
})

block(test)('try', function (t, value) {
  t.equal(2, 2, 'is equal')
  t.equal(value, 200, 'value is passed')
  t.end()
})

block = around(function (t, next) {
  t.pass('before called')
  next(200)
  t.pass('after called')
  t.end()
})

block(test)('synchronous', function (t, value) {
  t.equal(value, 200, 'value is passed')
  t.end()
})

block = around(function (t, next) {
  t.plan(3)
  t.pass('before called')
  next(200)
    .then(function () {
      t.pass('after called')
      t.end()
    })
})

block(test)('promise', function (t, value) {
  return new Promise(function (resolve, reject) {
    t.equal(value, 200, 'value is passed')
    resolve()
  })
})

block = around(function (t, next) {
  t.plan(3)
  t.pass('before called')
  return next(200)
    .then(function () {
      t.pass('after called')
    })
})

block(test)('promise 2', function (t, value) {
  return new Promise(function (resolve, reject) {
    t.equal(value, 200, 'value is passed')
    resolve()
  })
})

block = around(function (t, next) {
  t.pass('before called')
  next(200)
  t.pass('after called')
  t.end()
})

block(test)('synchronous', function (t, value) {
  t.equal(value, 200, 'value is passed')
  t.end()
})

sandbox(test)('mutex (sandbox)', function (t, sinon) {
  var tt = {
    pass: sinon.spy(),
    equal: sinon.spy(),
    error: sinon.spy(),
    end: sinon.spy(function () {
      setTimeout(function () {
        t.pass('ended')
        t.deepEqual(tt.equal.getCall(0).args, [200, 200, 'value is passed'], 't.equal')
        t.ok(tt.end.calledOnce, 't.end called once')
        t.ok(tt.pass.calledOnce, 't.pass called once')
        t.ok(tt.error.called, 't.error called')
        t.end()
      })
    })
  }

  var faketest = function (name, fn) {
    fn(tt)
  }

  block = around(function (tt, next) {
    tt.pass('before')
    next(200)
    tt.end()
  })

  block(faketest)('mutex', function (tt, value) {
    tt.equal(value, 200, 'value is passed')
    setTimeout(function () { tt.end() })
  })
})

test('standard', require('tape-eslint')())
