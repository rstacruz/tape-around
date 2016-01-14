# tape-around

> Add before and after hooks to [tape][] tests

[![Status](https://travis-ci.org/rstacruz/tape-around.svg?branch=master)](https://travis-ci.org/rstacruz/tape-around "See test builds")

[tape]: https://github.com/substack/tape

## Usage

Call `around(test)` to define a test block. The functions given to `.before()` and `.after()` will be executed before and after the test. The return value of this is a function that works exactly like tape's `test`.

```js
var test = require('tape')
var around = require('tape-around')

// Define a test block using around().
testBlock = around(test)
  .before(function (t) {
    t.plan(3)
    t.pass('before hooks')
    t.next()
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

## Passing data

You can use this to build data before your tests and clean them up after. Call `t.next()` with arguments and they will be passed onto your tests as additional arguments after `t`.

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

Since the return value of `around(test)` works exactly like tape's `test`, you can chain them to make multiple `around` blocks wrap around each other.

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

Creates a wrapper around `test`.

Parameters:

- `test` *Function* — can either be `require('tape')`, or another `around()` function.
-  `prefix` *String?* — if given, test names will be prefixed by this name.

Returns:

* *Function* — the return value is a function that works exactly like tape.

You can also call `.before()` and `.after()` to add hooks to the pipeline.

### before / after

> `around(...).before(fn)`<br>
> `around(...).after(fn)`

Adds before and after hooks to the pipeline. These methods are chainable, and you may call this multiple times to add more functions.

Parameters:

- `fn` *(Function(t, ...params))* — The function block to be invoked before (or after) the test. The `params` arguments are parameters taken from whatever was passed to `t.next()` in the previous function in the pipeline.

### t.next

> `t.next(...params)`

Calls the next function in the pipeline and passes `params` to the parameters.

Note that calling `t.next()` with no arguments will erase the current arguments. If you wish to preserve them, use `t.end()`.

Parameters:

- `...params` *(Any)* — The objects to be passed to the next function in the pipeline.

### t.end

> `t.end([err])`

This is changed so that you can invoke `t.end()` in any of the blocks (before, after, or the test) to call the next function in the pipeline. If there are no more functions in the pipeline, the test will be ended.

### t.nextAdd

> `t.nextAdd(params...)`

Calls the next function in the pipeline and passes `params` as additional parameters.

If you notice in the [nesting example](#nesting), the parameter `a` is passed through `t.next()`. This may be cumbersome once you have a lot of parameters to pass. Use `t.nextAdd()` to simply append it to the already-passed parameters.

```js
var addTest = around(test)
  .before((t) => { t.nextAdd(100) })
  .before((t) => { t.nextAdd(200) })
  .before((t) => { t.nextAdd(300) })

addTest('using nextAdd', function (t, a, b, c) {
  t.equal(a, 100)
  t.equal(b, 200)
  t.equal(c, 200)
  t.end()
})
```

Without `nextAdd`, this example would be written as:


```js
var nextTest = around(test)
  .before((t)       => { t.next(100) })
  .before((t, a)    => { t.next(a, 200) })
  .before((t, a, b) => { t.next(a, b, 300) })
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
