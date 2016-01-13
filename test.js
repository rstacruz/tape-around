var test = require('tape')
var around = require('./index')
var block

block = around(function (t, next) {
  t.pass('before called')
  return next(200)
    .then(function () {
      t.pass('after called')
      t.end()
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
  t.pass('before called')
  next(200)
  t.pass('after called')
  t.end()
})

block(test)('synchronous', function (t, value) {
  t.equal(value, 200, 'value is passed')
  t.end()
})
