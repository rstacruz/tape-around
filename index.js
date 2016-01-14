var assign = require('object-assign')
var Promise = require('any-promise')

module.exports = function around (tape, msg, _hooks) {
  var hooks = {
    before: _hooks && _hooks.before || [],
    after: _hooks && _hooks.after || []
  }

  run.before = before
  run.after = after
  run.only = only
  run.skip = skip
  return run

  function run (name, fn) {
    return run2(name, fn, tape)
  }

  function only (name, fn) {
    return run2.only(name, fn, tape.only)
  }

  function skip (name, fn) {
    return run2.skip(name, fn, tape.skip)
  }

  function run2 (name, fn, tape) {
    var newname = msg ? msg + ' ' + name : name

    return tape(newname, function (t) {
      var _args

      var block = Promise.resolve()
        .then(invoke(hooks.before, t))
        .then(function (args) { _args = args; return args })
        .then(promisify(fn, t))

      // catch errors in before or the test. ensure after() hooks get invoked.
      // if they both yield errors, oh well.
      block
        .catch(function (err) {
          invokeForce(hooks.after, t)(_args)
            .then(function () { t.end(err) })
            .catch(function (err2) { t.error(err); t.end(err2) })
        })

      block
        .then(invokeForce(hooks.after, t))
        .then(function () { t.end() })
        .catch(function (err) { t.end(err) })
    })
  }

  function before (fn) {
    return around(tape, msg,
      assign({}, hooks, { before: hooks.before.concat([fn]) }))
  }

  function after (fn) {
    return around(tape, msg,
      assign({}, hooks, { after: hooks.after.concat([fn]) }))
  }
}

/*
 * Invokes all blocks in the given `hooks`. Returns a promise.
 */

function invoke (hooks, t) {
  return function (args) {
    var pipeline = Promise.resolve(args)
    hooks.forEach(function (hook) {
      pipeline = pipeline.then(promisify(hook, t))
    })
    return pipeline
  }
}

/*
 * Like invoke(), but errors will still continue to run the next block
 */

function invokeForce (hooks, t) {
  return function (args) {
    var pipeline = Promise.resolve(args)
    var _args
    var len = hooks.length
    hooks.forEach(function (hook, i) {
      pipeline = pipeline
        .then(promisify(hook, t))
        .catch(function (err) {
          if (i === len - 1) throw err
          t.error(err)
          return args
        })
    })
    return pipeline
  }
}

/*
 * Turns a block (before, after, or test) into a promise.
 */

function promisify (fn, t) {
  return function (args) {
    return new Promise(function (resolve, reject) {
      var tt = assign({}, t, { next: next, nextAdd: nextAdd, end: end })
      fn.apply(this, [tt].concat(args || []))

      function next () {
        var newargs = [].slice.call(arguments)
        resolve(newargs)
      }

      function nextAdd () {
        var newargs = [].slice.call(arguments)
        resolve(args.concat(newargs))
      }

      function end (err) {
        if (err) reject(err)
        else resolve(args)
      }
    })
  }
}
