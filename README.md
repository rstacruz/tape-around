# tape-around

> Add before and after hooks to tape tests

[![Status](https://travis-ci.org/rstacruz/tape-around.svg?branch=master)](https://travis-ci.org/rstacruz/tape-around "See test builds")

## Usage

Call `around(function (t, next))(test)` to define a test block. The given function will be executed as the test. From within that block, call `next()` to invoke the test.

```js
testBlock = around(function (t, next) {
  t.pass('before called')
  next(1337)
  t.pass('after called')
  t.end()
})

testBlock(test)('synchronous', function (t, value) {
  t.equal(value, 1337, 'value is passed from the block')
  t.end()
})
```

## Asynchronous

The `next()` function in the block always returns a promise. With this, you can invoke an after-test hook asynchronously.

```js
testBlock = around(function (t, next) {
  t.pass('before called')
  next()
  .then(function () {
    t.pass('after called')
    t.end()
  })
})

testBlock(test)('asynchronous', function (t, value) {
  setTimeout(function () {
    t.pass('i'm an async test')
    t.end()
  })
})
```

## Promises in blocks

The block passed to `around()` can return a promise. In fact, since `next()` will always return a promise, you can chain that as well. If the `around()` block returns a rejected promise, the error will be passed onto `t.error`.

When blocks return promises, there's no need to call `t.end()` in the block anymore.

```js
testBlock = around(function (t, next) {
  return before()
    .then(next)
    .then(after)
})

function before () { /* returns a promise */ }
function after () { /* returns a promise */ }

testBlock(test)('promises', function (t, value) {
  /* ... */
})
```

## Promises in tests

Your tests, too, can return a promise. If it fails, the rejection message will be passed onto `t.error`.

When tests return promises, there's no need to call `t.end()` in the test anymore.

```js
testBlock = around(/* ... */)

testBlock(test)('promises', function (t, value) {
  return new Promise((resolve, reject) => {
    // do stuff here
    resolve()
  })
})
```

## Chaining

Since the return value of `around()(test)` works exactly like tape's `test`, you can chain them to make multiple `around` blocks wrap around each other.

```js
var one = around(/* ... */)
var two = around(/* ... */)

one(two(test))('chaining', function (t, value) {
  /* ... */
})
```

## Thanks

**tape-around** © 2016+, Rico Sta. Cruz. Released under the [MIT] License.<br>
Authored and maintained by Rico Sta. Cruz with help from contributors ([list][contributors]).

> [ricostacruz.com](http://ricostacruz.com) &nbsp;&middot;&nbsp;
> GitHub [@rstacruz](https://github.com/rstacruz) &nbsp;&middot;&nbsp;
> Twitter [@rstacruz](https://twitter.com/rstacruz)

[MIT]: http://mit-license.org/
[contributors]: http://github.com/rstacruz/tape-around/contributors
