var assign = require('object-assign')
var Promise = require('any-promise')

module.exports = function around (block) {
  return function (test) {
    return function (name, fn) {
      var run = function (t, args) {
        return new Promise(function (resolve, reject) {
          var tt = assign({}, t, { end: resolve })
          var result = fn.apply(this, [tt].concat(args))
          if (isPromise(result)) {
            result.then(resolve, reject)
          }
        })
      }

      test(name, function (t) {
        Promise.resolve(block(t, function () {
          return run(t, [].slice.apply(arguments))
        }))
        .catch(function (err) {
          t.error(err.stack)
        })
      })
    }
  }
}

function isPromise (promise) {
  return promise && typeof promise.then === 'function'
}
