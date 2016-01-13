# tape-around

> Add before and after hooks to [tape][] tests

[![Status](https://travis-ci.org/rstacruz/tape-around.svg?branch=master)](https://travis-ci.org/rstacruz/tape-around "See test builds")

[tape]: https://github.com/substack/tape

## Usage

Call `around(function (t, run))(test)` to define a test block. The given function will be executed as the test. The return value of this is a function that works exactly like tape's `test`.

From within the function block you gave, call `run()` to invoke the test.

```js
var test = require('tape')
var around = require('tape-around')

testBlock = around(function (t, run) {
  t.pass('before hooks')
  run(1337)
  t.pass('after hooks')
  t.end()
})

testBlock(test)('synchronous test', function (t, value) {
  t.equal(value, 1337)
  t.end()
})
```

## Example

You can use this to build data before your tests and clean them up after.

```js
var test = require('tape')

testBlock = around(function (t, run) {
  var user = User.create({ name: 'John' })  // before
  run(user)
  user.destroy()  // after
  t.end()
})

testBlock(test)('synchronous test', function (t, user) {
  t.equal(user.name, 'John', 'value is passed from the block')
  t.end()
})
```

## Asynchronous

The `run()` function in the block always returns a promise. With this, you can invoke an after-test hook asynchronously.

```js
testBlock = around(function (t, run) {
  t.pass('before called')
  run()
  .then(function () {
    t.pass("called after your test's t.end()")
    t.end()
  })
})

testBlock(test)('asynchronous', function (t, value) {
  setTimeout(function () {
    t.pass('im an async test')
    t.end()
  })
})
```

## Promises in blocks

The block passed to `around()` can return a promise. In fact, since `run()` will always return a promise, you can chain that as well. If the `around()` block returns a rejected promise, the error will be passed onto `t.error`.

When blocks return promises, there's no need to call `t.end()` in the block anymore.

```js
testBlock = around(function (t, run) {
  return before()
    .then(run)
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

## Sinon.js example

You can create [sinon][] sandboxes to automatically clear out sinon stubs.

```js
var sandbox = around(function (t, next) {
  var sandbox = require('sinon').sandbox.create()
  return next(sandbox)
    .then(function () { sandbox.restore() })
})

sandbox(test)('testing with sinon', function (t, sinon) {
  sinon.stub($, 'ajax')
  // ...
  t.end()
})
```

[sinon]: http://sinonjs.org/

## Thanks

**tape-around** © 2016+, Rico Sta. Cruz. Released under the [MIT] License.<br>
Authored and maintained by Rico Sta. Cruz with help from contributors ([list][contributors]).

> [ricostacruz.com](http://ricostacruz.com) &nbsp;&middot;&nbsp;
> GitHub [@rstacruz](https://github.com/rstacruz) &nbsp;&middot;&nbsp;
> Twitter [@rstacruz](https://twitter.com/rstacruz)

[MIT]: http://mit-license.org/
[contributors]: http://github.com/rstacruz/tape-around/contributors
