async function foo(value) {
    console.log(await value);
}

var value = new $__Promise__;
foo(value);
setTimeout(value.fulfill, 500, 1234);

