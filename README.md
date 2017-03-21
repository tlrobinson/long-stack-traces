Long Stacktraces
================

Long stacktraces for V8 implemented in user-land JavaScript. Supports Chrome/Chromium and Node.js.

NOTE: there are various issues such as memory leaks (due to *very* long stack traces). This should not be used in production.

Background
----------

A common problem when debugging event-driven JavaScript is stack traces are limited to a single "event", so it's difficult to trace the code path that caused an error.

A contrived example (taken from the PDF referenced below):
```js
function f() {
    throw new Error('foo');
}

setTimeout(f, Math.random()*1000);
setTimeout(f, Math.random()*1000);
```

Which one throws the first error?

Node.js intended to fix this problem with a solution called "Long Stacktraces": http://nodejs.org/illuminati0.pdf

But what if we wanted something like this in the browser? It turns out V8 already has everything needed to implement this in user-land JavaScript (although in a slightly hacky way).

V8 has a [stack trace API](http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi) that allows custom formatting of textual stack trace representations. By wrapping any function that registers an asynchronous event callback (e.x. `setTimeout` and `addEventListener` in the browser) we can store the stack trace at the time of callback registration, and later append it to stack traces. This also works for multiple levels of events (a timeout or event registered within a timeout or event, etc).

Usage
-----

For Node.js install using `npm install long-stack-traces`.

Simply include the "long-stack-traces.js" via a script tag or other method before any event listener or timeout registrations. In Node.js call `require("long-stack-traces")`.

Stack traces from example above:

    Uncaught Error: foo
        at f (index.html:24:23)
        ----------------------------------------
        at setTimeout
        at onload (index.html:28:40)
    Uncaught Error: foo
        at f (index.html:24:23)
        ----------------------------------------
        at setTimeout
        at onload (index.html:27:40)

Note one was from the timeout on line 27, the other on line 28. Events' stack traces are divided by a line of dashes.

See examples.html for more examples, and run `node examples.js` for a Node.js example.

Supported APIs
--------------

Currently supports the following APIs:

### Chromium ###
* `setTimeout`
* `setInterval`
* `addEventListener`
* `XMLHttpRequest.onreadystatechange` (stack actually recorded upon `send()`)

### Node.js ###
* `setTimeout`
* `setInterval`
* `process.nextTick`
* `EventEmitter.addListener`
* `EventEmitter.on`
* All APIs that use `EventEmitter`

TODO
----

* Gracefully degrade in non-V8 environments.
* Figure out what's up with these stack frames when throwing an exception from an input's event handler:
    <error: TypeError: Accessing selectionEnd on an input element that cannot have a selection.>
* Configurable stack trace length limit to prevent memory leaks (not _technically_ a leak). Trivial example:
    function foo() {
        setTimeout(foo, 1000);
    }
    foo();

License
-------

Copyright (c) 2011, Thomas Robinson <tom@tlrobinson.net>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
