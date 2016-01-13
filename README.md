# tape-around

> Add before and after hooks to tape tests

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
