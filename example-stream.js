function delayed(value, delay) {
    var promise = new $__Promise__;
    setTimeout(promise.fulfill, delay, value);
    return promise;
}

async function *source() {
    var value = 1;
    while (value < 10) {
        yield await delayed(value++, 100);
    }
}

function *printer() {
    while (true) {
        console.log(yield null);
    }
}

var endpoint = printer();
endpoint.next();

var observable = source();
var disposable = observable.subscribe(endpoint);

