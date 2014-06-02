function Observable(subscribe) {
    this.subscribe = subscribe;
}
Observable.prototype = {
    '@@observe': function observe(iterator) {
        return this.subscribe(iterator);
    }
};
function Promise() {
    this.arrFulfilledActions = [];
    this.arrRejectedActions = [];
    this.then = this.then.bind(this);
    this.fulfill = this.fulfill.bind(this);
    this.reject = this.reject.bind(this);
    this.executeActions = this.executeActions.bind(this);
}
Promise.prototype = {
    isPromise: true,
    isFulfilled: false,
    isRejected: false,
    executeTimeout: 0,
    value: null,
    defer: setImmediate || setTimeout,
    adoptState: function (otherPromise) {
        var arrFulfilledActions = this.arrFulfilledActions;
        var arrRejectedActions = this.arrRejectedActions;
        for (var key in this) {
            if (this.hasOwnProperty(key)) {
                delete this[key];
            }
        }
        this.__proto__ = otherPromise;
        for (var idx = 0; idx < arrFulfilledActions.length; ++idx) {
            this.arrFulfilledActions.push(arrFulfilledActions[idx]);
        }
        for (var idx = 0; idx < arrRejectedActions.length; ++idx) {
            this.arrRejectedActions.push(arrRejectedActions[idx]);
        }
    },
    executeActions: function () {
        if (!this.isFulfilled && !this.isRejected || this.arrFulfilledActions.length === 0) {
            this.executeTimeout = 0;
            return;
        }
        var fulfilledAction = this.arrFulfilledActions.shift();
        var rejectedAction = this.arrRejectedActions.shift();
        var action = this.isFulfilled ? fulfilledAction : rejectedAction;
        try {
            var result = action(this.value);
            if (typeof result !== 'undefined') {
                this.fulfill(result);
            }
        } catch (error) {
            this.reject(error);
        }
        this.executeTimeout = this.defer(this.executeActions);
    },
    then: function (onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : this.noop;
        onRejected = typeof onRejected === 'function' ? onRejected : this.noop;
        this.arrFulfilledActions.push(onFulfilled);
        this.arrRejectedActions.push(onRejected);
        if ((this.isFulfilled || this.isRejected) && this.executeTimeout === 0) {
            this.executeTimeout = this.defer(this.executeActions);
        }
        return this;
    },
    fulfill: function (value) {
        if (this === value) {
            this.reject(new TypeError('Can\'t fulfill promise with itself'));
            return this;
        }
        if (value && value.isPromise) {
            this.adoptState(value);
            return;
        }
        try {
            if (value && typeof value === 'object') {
                var then = value.then;
                if (typeof then === 'function') {
                    then.call(value, this.fulfill, this.reject);
                    return;
                }
            } else if (typeof value === 'function') {
                value(this.fulfill, this.reject);
                return;
            }
        } catch (error) {
            this.reject(error);
            return;
        }
        this.isFulfilled = true;
        this.isRejected = false;
        this.value = value;
        if (!this.executeTimeout) {
            this.executeTimeout = this.defer(this.executeActions);
        }
    },
    reject: function (value) {
        this.isFulfilled = false;
        this.isRejected = true;
        this.value = value;
        if (!this.executeTimeout) {
            this.executeTimeout = this.defer(this.executeActions);
        }
    }
};
function ˀrunAsyncGenerator(asyncGenerator) {
    var generatorArgs = Array.prototype.slice.call(arguments, 1), observer = generatorArgs[1], iterator = asyncGenerator.apply(null, generatorArgs), isFinished = false, response;
    function next(error, result) {
        if (isFinished)
            return;
        try {
            response = error ? iterator.throw(error) : iterator.next(result);
        } catch (error) {
            observer && observer.throw && observer.throw(error);
            return;
        }
        isFinished = response.done;
        if (response && !response.done) {
            if (response.value && response.value.isPromise) {
                response.value.then(success, failure);
            } else {
                next(undefined, response);
            }
        } else {
            next(undefined, response);
        }
    }
    function success(result) {
        next(undefined, result);
    }
    function failure(error) {
        next(error, undefined);
    }
    next();
    return {
        dispose: function dispose() {
            isFinished = true;
        }
    };
}
function _() {
    var generatorArgs = Array.prototype.slice.call(arguments, 0);
    generatorArgs.unshift(null);
    generatorArgs.unshift(function* ˀ_Generatorˀ5(ˀobserver, xs) {
        var ˀvalue;
        function ˀsetValue(value) {
            ˀvalue = value;
        }
        {
            var ˀloopIterationPromiseˀ1 = new Promise();
            var ˀresumeObservablePromiseˀ2 = new Promise();
            var ˀdisposableˀ3 = xs['@@observe']({
                    next: function (tuple) {
                        ˀloopIterationPromiseˀ1.fulfill(tuple);
                        ˀresumeObservablePromiseˀ2 = new Promise();
                        return ˀresumeObservablePromiseˀ2;
                    },
                    error: function (error) {
                        return ˀloopIterationPromiseˀ1.reject(error);
                    }
                });
            try {
                while (true) {
                    ˀresumeObservablePromiseˀ2.fulfill({ done: false });
                    var ˀtupleˀ4 = (ˀvalue = ˀloopIterationPromiseˀ1, ˀvalue && ˀvalue.isPromise ? yield ˀvalue.then(ˀsetValue) : null, ˀvalue);
                    var x = ˀtupleˀ4.value;
                    if (ˀtupleˀ4.done) {
                        break;
                    }
                    {
                        ˀvalue = ˀobserver && ˀobserver.next && ˀobserver.next({
                            done: false,
                            value: x
                        }), ˀvalue && ˀvalue.isPromise ? yield ˀvalue.then(ˀsetValue) : null, ˀvalue;
                    }
                    ˀloopIterationPromiseˀ1 = new Promise();
                }
            } catch (e) {
                ˀdisposableˀ3.dispose();
                throw e;
            }
        }
        ˀobserver && ˀobserver.next && ˀobserver.next({ done: true });
    });
    return new Observable(function subscribe(observer) {
        if (typeof observer === 'function') {
            observer = { next: observer };
        }
        generatorArgs[1] = observer;
        return ˀrunAsyncGenerator.apply(null, generatorArgs);
    });
}
