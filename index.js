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
    return run2(name, fn, tape.only)
  }

  function skip (name, fn) {
    return run2(name, fn, tape.skip)
  }

  function run2 (name, fn, tape) {
    var newname = msg ? msg + ' ' + name : name

    return tape(newname, function (t) {
      var _args

      var block = Promise.resolve()
        .then(invoke(hooks.before, t))
        .then(function (args) { _args = args; return args })
        .then(promisify(fn, t))

        .then(function (args) {
          invokeForce(hooks.after, t)(args)
            .then(function () { t.end() })
            .catch(function (errArgs) { t.end(errArgs.error) })
        })

        // catch errors in `before` or in the test. ensure after() hooks get
        // invoked. if they both yield errors, pass the errors through both
        // `t.error` and `t.end`.
        .catch(function (errArgs) {
          invokeForce(hooks.after, t)(errArgs.args)
            .then(function () { t.end(errArgs.error) })
            .catch(function (errArgs2) { t.error(errArgs.error); t.end(errArgs2.error) })
        })

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
        .catch(function (errArgs) {
          if (i === len - 1) throw errArgs
          t.error(errArgs.error)
          return errArgs.args
        })
    })
    return pipeline
  }
}

/*
 * Turns a block (before, after, or test) into a promise. If it fails, reject
 * with the object `{ error, args }` (so we keep args preserved even if errors
 * happen).
 */

function promisify (fn, t) {
  return function (args) {
    return new Promise(function (resolve, reject) {
      var tt = assign({}, t, { next: next, nextAdd: nextAdd, end: end })
      try {
        fn.apply(this, [tt].concat(args || []))
      } catch (err) {
        return reject({ error: err, args: args })
      }

      function next () {
        var newargs = [].slice.call(arguments)
        resolve(newargs)
      }

      function nextAdd () {
        var newargs = [].slice.call(arguments)
        resolve(args.concat(newargs))
      }

      function end (err) {
        if (err) reject({ error: err, args: args })
        else resolve(args)
      }
    })
  }
}
