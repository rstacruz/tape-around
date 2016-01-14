var assign = require('object-assign')
var Promise = require('any-promise')

module.exports = function around (tape, _hooks) {
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
    return tape(name, function (t) {
      Promise.resolve()
        .then(invoke(hooks.before, t))
        .then(promisify(fn, t))
        .then(invoke(hooks.after, t))
        .then(function () { t.end() })
        .catch(function (err) { t.end(err) })
    })
  }

  function before (fn) {
    return around(tape,
      assign({}, hooks, { before: hooks.before.concat([fn]) }))
  }

  function after (fn) {
    return around(tape,
      assign({}, hooks, { after: hooks.after.concat([fn]) }))
  }
}

function invoke (hooks, t) {
  return function (args) {
    var pipeline = Promise.resolve(args)
    hooks.forEach(function (hook) {
      pipeline = pipeline.then(promisify(hook, t))
    })
    return pipeline
  }
}

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
