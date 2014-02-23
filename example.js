var reader = {
    value: 1,
    read: function() {
        if (this.value > 20) {
            return { done: true };
        }
        var promise = new $__Promise__();
        var value = this.value++;
        setTimeout(function() {
            promise.fulfill({ done: false, value: value });
        }, 100);
        return promise;
    }
}

async function *test() {
    while (true) {
        var result = await reader.read();
        if (result.done) return;
        if (result.value === 15) {
            throw new Error('What do you mean, ' + result.value + '!?');
        }
        yield result.value;
    }
}

test({
    next: function(value) {
        console.log(value);
    },
    throw: function(error) {
        console.error(error);
    }
});

