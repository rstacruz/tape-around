require('loud-rejection')()
var test = require('tape')
var around = require('./index')
var block

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

/*
 * Sinon
 */

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
 * Intercepting calls
 */

test('intercepting calls', function (t) {
  var calls = []
  var _t = {
    pass: function () {
      calls.push([ 'pass' ].concat([].slice.apply(arguments)))
    },
    plan: function () {
      calls.push([ 'plan' ].concat([].slice.apply(arguments)))
    },
    end: function (err) {
      t.deepEqual(calls, [
        [ 'plan', 3 ],
        [ 'pass', 'fake before called' ],
        [ 'pass', 'fake test called' ],
        [ 'pass', 'fake after called' ]
      ], 't.* functions called in the right order')
      t.pass('t.end called')
      t.end(err)
    }
  }

  var _test = function (name, fn) {
    t.pass('test called')
    fn(_t)
  }

  block = around(_test)
    .before(function (t) {
      t.plan(3)
      t.pass('fake before called')
      t.next()
    })
    .after(function (t) {
      t.pass('fake after called')
      t.end()
    })

  block('simple', function (t) {
    t.pass('fake test called')
    t.end()
  })
})

/*
 * Intercept block
 * using tape-around to test tape-around itself :)
 */

var intercept = around(test, 'interception:')
  .before(function (t) {
    var calls = []
    var next

    var _t = {
      pass: function () {
        calls.push([ 'pass' ].concat([].slice.apply(arguments)))
      },
      error: function () {
        calls.push([ 'error' ].concat([].slice.apply(arguments)))
      },
      equal: function () {
        calls.push([ 'equal' ].concat([].slice.apply(arguments)))
      },
      plan: function () {
        calls.push([ 'plan' ].concat([].slice.apply(arguments)))
      },
      end: function (err) {
        t.pass('(intercept) end called')
        next(err, calls)
      }
    }

    function then (fn) {
      next = fn
    }

    var _test = function (name, fn) {
      t.pass('(intercept) test called')
      fn(_t)
    }

    t.next(_test, then)
  })

/*
 * simple case
 */

intercept('simple case', function (t, _test, then) {
  then(function (err, calls) {
    t.error(err)
    t.deepEqual(calls, [ [ 'pass', 'hi' ] ])
    t.end()
  })

  var block = around(_test)

  block('simple test', function (_t) {
    _t.pass('hi')
    _t.end()
  })
})

/*
 * Errors
 */

intercept('errors', function (t, _test, then) {
  then(function (err, calls) {
    t.ok(err, 'has an error')
    t.equal(err.message, 'snap', 'has the correct error')
    t.deepEqual(calls, [ [ 'pass', 'hi' ] ])
    t.end()
  })

  var block = around(_test)

  block('simple test', function (_t) {
    _t.pass('hi')
    throw new Error('snap')
    _t.end()
  })
})

/*
 * Errors and after
 */

intercept('errors and after', function (t, _test, then) {
  then(function (err, calls) {
    t.ok(err, 'has an error')
    t.equal(err.message, 'snap', 'has the correct error')
    t.deepEqual(calls, [
      [ 'pass', 'hi' ],
      [ 'pass', 'after called' ]
    ])
    t.end()
  })

  var block = around(_test)
    .after(function (t) {
      t.pass('after called')
      t.end()
    })

  block('simple test', function (_t) {
    _t.pass('hi')
    throw new Error('snap')
    _t.end()
  })
})

/*
 * Multiple after errors
 */

intercept('multiple after errors', function (t, _test, then) {
  then(function (err, calls) {
    t.deepEqual(err, new Error('error 2'))
    t.deepEqual(calls, [
      [ 'pass', 'hi' ],
      [ 'error', new Error('error 1') ]
    ])
    t.end()
  })

  var block = around(_test)
    .after(function (t) {
      throw new Error('error 1')
    })
    .after(function (t) {
      throw new Error('error 2')
    })

  block('simple test', function (_t) {
    _t.pass('hi')
    _t.end()
  })
})

/*
 * Multiple before/after errors
 */

intercept('multiple before/after errors', function (t, _test, then) {
  then(function (err, calls) {
    t.pass('then() called')
    t.deepEqual(err, new Error('error 2'), 'has last error')
    t.deepEqual(calls, [
      [ 'error', new Error('error 0') ],
      [ 'error', new Error('error 1') ]
    ], 'has errors from before and after')
    t.end()
  })

  var block = around(_test)
    .before(function (t) {
      throw new Error('error 0')
    })
    .after(function (t) {
      throw new Error('error 1')
    })
    .after(function (t) {
      throw new Error('error 2')
    })

  block('simple test', function (_t) {
    _t.pass('hi')
    _t.end()
  })
})

/*
 * Multiple before errors
 */

intercept('multiple before errors', function (t, _test, then) {
  then(function (err, calls) {
    t.pass('then() called')
    t.deepEqual(err, new Error('error 0'), 'has last error')
    t.deepEqual(calls, [
      [ 'pass', 100 ]
    ], 'has values from before')
    t.end()
  })

  var block = around(_test)
    .before(function (t) {
      t.next(100)
    })
    .before(function (t, a) {
      throw new Error('error 0')
    })
    .after(function (t, a) {
      t.pass(a)
      t.end()
    })

  block('simple test', function (_t) {
    _t.pass('hi')
    _t.end()
  })
})
