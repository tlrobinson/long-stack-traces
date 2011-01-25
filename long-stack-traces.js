(function() {

    var traces = []; // there should actually never be more than one item in this array if all wrapped functions are asynchronous
    var divider = "\n    " + Array(41).join("-") + "\n";
    var debug = false;

    var filename = new Error().stack.split("\n")[1].match(/^    at ((?:\w+:\/\/)?[^:]+)/)[1];
    function filterInternalFrames(frames) {
        return frames.split("\n").filter(function(frame) { return frame.indexOf(filename) < 0; }).join("\n");
    }

    Error.prepareStackTrace = function(error, structuredStackTrace) {
        var newTrace = filterInternalFrames(FormatStackTrace(error, structuredStackTrace));
        return [newTrace].concat(traces).join(divider);
    }

    var slice = Array.prototype.slice;
    var hop = Object.prototype.hasOwnProperty;

    function wrapRegistrationFunction(object, property, callbackArg) {
        if (!hop.call(object, property))
            console.warn("Object", object, "does not directly contain property", property);

        var fn = object[property];

        object[property] = function() {
            var args = slice.call(arguments);
            var callback = args[callbackArg];
            var trace = "    at " + property + "\n" +
                filterInternalFrames(new Error().stack.split("\n").slice(1).join("\n"));

            args[callbackArg] = function() {
                traces.push(trace);
                try {
                    return callback.apply(this, arguments);
                } catch (e) {
                    console.error("Uncaught " + e.stack);
                    // throw e;
                } finally {
                    traces.pop();
                }
            }

            return fn.apply(this, args);
        }

        if (object[property] === fn)
            console.warn("Couldn't replace ", property, "on", object);
    }

    wrapRegistrationFunction(window.constructor.prototype, "setTimeout", 0);
    wrapRegistrationFunction(window.constructor.prototype, "setInterval", 0);

    var addEventListenerObjects = [
        window.Node.prototype,
        window.MessagePort.prototype,
        window.SVGElementInstance.prototype,
        window.WebSocket.prototype,
        window.XMLHttpRequest.prototype,
        window.EventSource.prototype,
        window.XMLHttpRequestUpload.prototype,
        window.SharedWorker.prototype.__proto__,
        window.constructor.prototype,
        window.applicationCache.constructor.prototype
    ];

    addEventListenerObjects.forEach(function(object) {
        wrapRegistrationFunction(object, "addEventListener", 1);
    });

    // Copyright 2006-2008 the V8 project authors. All rights reserved.
    // Redistribution and use in source and binary forms, with or without
    // modification, are permitted provided that the following conditions are
    // met:
    //
    //     * Redistributions of source code must retain the above copyright
    //       notice, this list of conditions and the following disclaimer.
    //     * Redistributions in binary form must reproduce the above
    //       copyright notice, this list of conditions and the following
    //       disclaimer in the documentation and/or other materials provided
    //       with the distribution.
    //     * Neither the name of Google Inc. nor the names of its
    //       contributors may be used to endorse or promote products derived
    //       from this software without specific prior written permission.
    //
    // THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
    // "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
    // LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
    // A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
    // OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    // SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
    // LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    // DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    // THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    // (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    // OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

    function FormatStackTrace(error, frames) {
      var lines = [];
      try {
        lines.push(error.toString());
      } catch (e) {
        try {
          lines.push("<error: " + e + ">");
        } catch (ee) {
          lines.push("<error>");
        }
      }
      for (var i = 0; i < frames.length; i++) {
        var frame = frames[i];
        var line;
        try {
          line = FormatSourcePosition(frame);
        } catch (e) {
          try {
            line = "<error: " + e + ">";
          } catch (ee) {
            // Any code that reaches this point is seriously nasty!
            line = "<error>";
          }
        }
        lines.push("    at " + line);
      }
      return lines.join("\n");
    }

    function FormatSourcePosition(frame) {
      var fileLocation = "";
      if (frame.isNative()) {
        fileLocation = "native";
      } else if (frame.isEval()) {
        fileLocation = "eval at " + frame.getEvalOrigin();
      } else {
        var fileName = frame.getFileName();
        if (fileName) {
          fileLocation += fileName;
          var lineNumber = frame.getLineNumber();
          if (lineNumber != null) {
            fileLocation += ":" + lineNumber;
            var columnNumber = frame.getColumnNumber();
            if (columnNumber) {
              fileLocation += ":" + columnNumber;
            }
          }
        }
      }
      if (!fileLocation) {
        fileLocation = "unknown source";
      }
      var line = "";
      var functionName = frame.getFunction().name;
      var addPrefix = true;
      var isConstructor = frame.isConstructor();
      var isMethodCall = !(frame.isToplevel() || isConstructor);
      if (isMethodCall) {
        var methodName = frame.getMethodName();
        line += frame.getTypeName() + ".";
        if (functionName) {
          line += functionName;
          if (methodName && (methodName != functionName)) {
            line += " [as " + methodName + "]";
          }
        } else {
          line += methodName || "<anonymous>";
        }
      } else if (isConstructor) {
        line += "new " + (functionName || "<anonymous>");
      } else if (functionName) {
        line += functionName;
      } else {
        line += fileLocation;
        addPrefix = false;
      }
      if (addPrefix) {
        line += " (" + fileLocation + ")";
      }
      return line;
    }
})();