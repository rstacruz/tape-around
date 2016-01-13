# tape-around

> Add before and after hooks to tape tests

## Usage

Call `around(function (t, next))(test)` to define a test block. The given function will be executed as the test. From within that block, call `next()` to invoke the test.

```js
testBlock = around(function (t, next) {
  t.pass('before called')
  next(1337)
  t.pass('after called')
  t.end()
})(test)

testBlock('synchronous', function (t, value) {
  t.equal(value, 1337, 'value is passed from the block')
  t.end()
})
```

## Asynchronous

Promises are supported.
