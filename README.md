Long Stacktraces
================

Long stacktraces for V8 implemented in user-land JavaScript.

Background
----------

A common problem when debugging event-driven JavaScript is stack traces are limited to a single "event", so it's difficult to trace the code path that caused an error.

A contrived example (taken from the PDF referenced below):

    function f() {
        throw new Error('foo');
    }

    setTimeout(f, Math.random()*1000);
    setTimeout(f, Math.random()*1000);

Which one throws the first error?

Node.js intended to fix this problem with a solution called "Long Stacktraces": http://nodejs.org/illuminati0.pdf

But what if we wanted something like this in the browser? It turns out V8 already has everything needed to implement this in user-land JavaScript (although in a slightly hacky way).

V8 has a [stack trace API](http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi) that allows custom formatting of textual stack trace representations. By wrapping any function that registers an asynchronous event callback (e.x. `setTimeout` and `addEventListener` in the browser) we can store the stack trace at the time of callback registration, and later append it to stack traces. This also works for multiple levels of events (a timeout or event registered within a timeout or event, etc).

Currently the only supported platform is Chrome, but other V8 platforms such as Node.js should be easy to support as well. Hopefully other JavaScript engines will eventually implement V8's stack trace API too.

Usage
-----

Simply include the "long-stack-traces.js" via a script tag or other method before any event listener or timeout registrations.

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

See examples.html for more examples.

TODO
----

* Node.js support. Since Node.js has a large number of callback based APIs perhaps an automatic method of discovering and wrapping them would be possible.
* XMLHttpRequest's "onreadystatechange" and other DOM "on*" event properties are difficult to hook. Perhaps using Object.defineProperty?
* Gracefully degrade in non-V8 environments.
* Figure out what's up with these stack frames when throwing an exception from an input's event handler:
    <error: TypeError: Accessing selectionEnd on an input element that cannot have a selection.>