# tape-around

> Add before and after hooks to [tape][] tests

[![Status](https://travis-ci.org/rstacruz/tape-around.svg?branch=master)](https://travis-ci.org/rstacruz/tape-around "See test builds")

[tape]: https://github.com/substack/tape

## Usage

Call [`around(test)`](#around) to define a test block. The functions given to [before()](#before) and [after()](#after]) will be executed before and after the test. The return value of this is a function that works exactly like tape's `test`.

```js
var test = require('tape')
var around = require('tape-around')

// Define a test block using around().
testBlock = around(test)
  .before(function (t) {
    t.pass('before hook called')
    t.next()
  })
  .after(function (t) {
    t.pass('after hook called')
    t.end()
  })
})

testBlock('my test', function (t) {
  t.equal(25 * 4, 100)
  t.end()
})
```

## Passing data

You can use this to build data before your tests and clean them up after. Call [`t.next()`](#t.next) with arguments and they will be passed onto your tests as additional arguments after `t`.

```js
var test = require('tape')

testBlock = around()
  .before(function (t) {
    var user = User.create({ name: 'John' })
    t.next(user)
  })
  .after(function (t, user) {
    user.destroy()
    t.end()
  })

testBlock('user test', function (t, user) {
  t.equal(user.name, 'John', 'value is passed from the block')
  t.end()
})
```

## Nesting

Since the return value of [`around(test)`](#around) works exactly like tape's `test`, you can chain them to make multiple *around()* blocks wrap around each other.

```js
var one = around(test)
  .before((t) => { t.next(100) })

var two = around(one)
  .before((t, a) => { t.next(a, 200) })

two('chaining', function (t, a, b) {
  t.equal(a, 100)
  t.equal(b, 200)
  t.end()
})
```

## API Reference

### around

> `around(test, [prefix])`

Creates a wrapper around `test`. You can also call `.before()` and `.after()` to add hooks to the pipeline. See [t.end](#t.end) for an example.

Parameters:

- `test` *Function* — can either be `require('tape')`, or another `around()` function.
-  `prefix` *String?* — if given, test names will be prefixed by this name.

Returns:

* *Function* — the return value is a function that works exactly like tape.

```js
var aTest = around(test)
  .before(...)
  .after(...)

aTest('using around()', function (t) {
  t.pass('this works')
  t.end()
})
```

### before

> `around(...).before(fn)`

Adds hooks to the pipeline to run before the tests. These methods are chainable, and you may call this multiple times to add more functions. See [t.end](#t.end) for an example. Be sure to call [t.end()](#t.end) or [t.next()](#t.next) or [t.nextAdd](#t.nextAdd) in each of these blocks.

When one of your before hooks fail, the test is not executed, and other before hooks will not be executed too. The *after* hooks, however, will continue to run.

Parameters:

- `fn` *(Function(t, ...params))* — The function block to be invoked before (or after) the test. The `params` arguments are parameters taken from whatever was passed to `t.next()` in the previous function in the pipeline.

### after

> `around(...).after(fn)`

Adds hooks to the pipeline to run before the tests. These methods are chainable, and you may call this multiple times to add more functions. See [t.end](#t.end) for an example. Be sure to call [t.end()](#t.end) or [t.next()](#t.next) or [t.nextAdd](#t.nextAdd) in each of these blocks.

Unlike [before()](#before), *after* hooks will always run, even if tests and before hooks fail.

See [before()](#before) for explanation on parameters.

### t.end

> `t.end([err])`

Ends the current block in the pipeline.

This is changed from tape's default `t.end` so that you can invoke `t.end()` in any of the blocks (before, after, or the test) to call the next function in the pipeline. In short: it doesn't end the whole test, it end the block in the pipeline. If there are no more functions in the pipeline, the test will be ended.

```js
testBlock = around(test)
  .before(function (t) {
    t.pass('before hooks')
    t.end()
  })
  .after(function (t) {
    t.pass('after hooks')
    t.end()
  })
})

testBlock('my test', function (t) {
  t.equal(25 * 4, 100)
  t.end()
})
```

### t.next

> `t.next(...params)`

Calls the next function in the pipeline and passes `params` to the parameters.

Note that calling `t.next()` with no arguments will erase the current arguments. If you wish to preserve them, use `t.end()`.

Parameters:

- `...params` *(Any)* — The objects to be passed to the next function in the pipeline.

```js
var nextTest = around(test)
  .before((t)       => { t.next(100) })
  .before((t, a)    => { t.next(a, 200) })
  .before((t, a, b) => { t.next(a, b, 300) })

addTest('using t.next', function (t, a, b, c) {
  t.equal(a, 100)
  t.equal(b, 200)
  t.equal(c, 300)
  t.end()
})
```

### t.nextAdd

> `t.nextAdd(...params)`

Calls the next function in the pipeline and passes `params` as additional parameters.

If you notice in the [t.next example](#t.next), the parameter `a` is passed through `t.next()`. This may be cumbersome once you have a lot of parameters to pass. Use `t.nextAdd()` to simply append it to the already-passed parameters.

Here's the same [t.next example](#t.next) but written with `t.nextAdd`:

```js
var addTest = around(test)
  .before((t) => { t.nextAdd(100) })
  .before((t) => { t.nextAdd(200) })
  .before((t) => { t.nextAdd(300) })

addTest('using nextAdd', function (t, a, b, c) {
  t.equal(a, 100)
  t.equal(b, 200)
  t.equal(c, 300)
  t.end()
})
```

## Sinon.js example

You can create [sinon][] sandboxes to automatically clear out sinon stubs.

```js
var sandbox = around(test)
  .before((t) => {
    var sandbox = require('sinon').sandbox.create()
    t.next(sandbox)
  })
  .after((t, sandbox) => {
    sandbox.restore()
    t.end()
  })

sandbox('my test', (t, sinon) => {
  sinon.spyOn($, 'ajax')
  // ...the spies will be cleaned up on exit automatically
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
