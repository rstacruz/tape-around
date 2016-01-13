var assign = require('object-assign')

module.exports = function around (block) {
  return function (test) {
    return function (name, fn) {
      var run = function (t, args) {
        return new Promise(function (resolve, reject) {
          var tt = assign({}, t, { end: resolve })
          fn.apply(this, [tt].concat(args))
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
