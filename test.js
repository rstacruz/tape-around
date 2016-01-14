require('loud-rejection')()
var test = require('tape')
var around = require('./index')
var block

var sandbox = around(test)
  .before(function (t) {
    var sandbox = require('sinon').sandbox.create()
    t.next(sandbox)
  })
  .after(function (t, sandbox) {
    sandbox.restore()
    t.end()
  })

/*
 * Simple
 */

block = around(test)
  .before(function (t) {
    t.plan(3)
    t.pass('before called')
    t.next()
  })
  .after(function (t) {
    t.pass('after called')
    t.end()
  })

block('simple', function (t) {
  t.pass('hello')
  t.end()
})

/*
 * Multiple hooks
 */

block = around(test)
  .before(function (t) {
    t.plan(5)
    t.pass('before called')
    t.end()
  })
  .before(function (t) {
    t.pass('before 2 called')
    t.end()
  })
  .after(function (t) {
    t.pass('after called')
    t.end()
  })
  .after(function (t) {
    t.pass('after 2 called')
    t.end()
  })

block('multiple hooks', function (t, a) {
  t.pass('test called')
  t.end()
})

/*
 * Passing
 */

block = around(test)
  .before(function (t) {
    t.plan(3)
    t.pass('before called')
    t.next(100)
  })
  .after(function (t) {
    t.pass('after called')
    t.end()
  })

block('passing values', function (t, a) {
  t.equal(a, 100, 'value passed')
  t.end()
})

/*
 * Passing values in a pipeline
 */

block = around(test)
  .before(function (t) {
    t.plan(4)
    t.pass('before called')
    t.next(100)
  })
  .before(function (t, a) {
    t.pass('before called')
    t.next(200)
  })
  .after(function (t) {
    t.pass('after called')
    t.end()
  })

block('passing values in a pipeline', function (t, a) {
  t.equal(a, 200, 'value passed')
  t.end()
})
