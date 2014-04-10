function delayed(value, delay) {
    var result = new Promise;
    setTimeout(result.fulfill.bind(result, value), delay);
    return result;
}

async function *range(min, max, delay) {
    for (var number = min; number < max; ++number) {
        yield await delayed(number, delay);
    }
}

async function *applyOperator(operator, promise, ys) {
    for (var y await ys) {
        yield operator(await promise, y);
    }
}

function add(x, y) { return x + y; }

async function *concat(xs, ys) {
    for (var x await xs) yield x;
    for (var y await ys) yield y;
}

async function *cartesianProduct(xs, ys) {
    for (var x await xs) {
        for (var y await ys) {
            yield x + ' ' + y;
        }
    }
}

// Create a SafeObserver - prevents any further next calls, more than one error call
// Call it onNext

function merge(xs, ys) {
    return new Observable(function(observer) {
        var disposeXs = xs.subscribe({
            next: function next(value) {
                return observer.next(value)
            }
        });
        var disposeYs = ys.subscribe({
            next: function next(value) {
                return observer.next(value)
            },
        });
    })
}

var promise = new Promise;
var observable = applyOperator(add, promise, range(5, 10, 200))
promise.fulfill(20)

var disposable = concat(
        concat(observable, observable),
        observable
    ).
    subscribe(function(tuple) {
        tuple.done || console.log(tuple.value)
    });

setTimeout(function() {
    console.log('CANCELLED');
    disposable.dispose()
}, 1500);
