#Async Generators for Javascript
  Usage: app [options] [command]

  Commands:

    exec <filename>        Rewrite and execute the given JS file
    print <filename>       Rewrite and print the contents of the given JS file
    print-ast <filename>   Rewrite and print the abstract syntax tree of the given JS file

  Options:

    -h, --help  output usage information
####Print Compiled Example Code (Node 0.11+)
    node --harmony app.js print example.js
####Run Example Code (Node 0.11+)
    node --harmony app.js exec example.js
##New Constructs
####Async Generator Functions
    async function *range(min, max) {
        for (var num = min; num <= max; ++num) yield num;
    }

    async function *example(yPromise, xs) {
        for (var x await xs) {
            yield (await yPromise) + x;
        }
    }

    var promise = new Promise;
    promise.fulfill(100);
    var numbers = range(1, 10);
    var observable = example(promise, numbers);
    var disposable = observable.subscribe({
        next: function printNumber(tuple) {
            tuple.done || console.log(tuple.value);
        }
    });
