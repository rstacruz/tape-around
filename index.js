var assign = require('object-assign')
var Promise = require('any-promise')

module.exports = function around (block) {
  return function (test) {
    return function (name, fn) {
      var ended

      function mutexEnd (t, fn, real) {
        return function () {
          if (ended) return t.error('.end() called twice')
          if (real) ended = true
          fn.apply(this, arguments)
        }
      }

      var run = function (t, args) {
        return new Promise(function (resolve, reject) {
          var tt = assign({}, t, { end: mutexEnd(t, resolve, false) })
          var result = fn.apply(this, [tt].concat(args))
          if (isPromise(result)) {
            result.then(resolve, reject)
          }
        })
      }

      test(name, function (t) {
        var tt = assign({}, t, { end: mutexEnd(t, t.end, true) })
        // Invoke the block
        var result = block(tt, function () {
          var result = run(tt, [].slice.apply(arguments))
          if (isPromise(result)) return result
        })

        if (isPromise(result)) {
          result
          .then(function () { t.end() })
          .catch(function (err) { tt.error(err.stack); t.end() })
        } else {
          Promise.resolve(result)
          .catch(function (err) { tt.error(err.stack); t.end() })
        }
      })
    }
  }
}

function isPromise (promise) {
  return promise && typeof promise.then === 'function'
}
