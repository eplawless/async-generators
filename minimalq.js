function $__Promise__() {
    this.arrFulfilledActions = [];
    this.arrRejectedActions = [];
    this.then = this.then.bind(this);
    this.fulfill = this.fulfill.bind(this);
    this.reject = this.reject.bind(this);
    this.executeActions = this.executeActions.bind(this);
}

$__Promise__.prototype = {
    isPromise: true,
    isFulfilled: false,
    isRejected: false,
    executeTimeout: 0,
    value: null,
    defer: setTimeout,
    adoptState: function(otherPromise) {
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
    executeActions: function() {
        if ((!this.isFulfilled && !this.isRejected) || this.arrFulfilledActions.length === 0) {
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
        this.executeTimeout = this.defer(this.executeActions, 0);
    },
    then: function(onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : this.noop;
        onRejected = typeof onRejected === 'function' ? onRejected : this.noop;
        this.arrFulfilledActions.push(onFulfilled);
        this.arrRejectedActions.push(onRejected);
        if ((this.isFulfilled || this.isRejected) && this.executeTimeout === 0) {
            this.executeTimeout = this.defer(this.executeActions, 0);
        }
        return this;
    },
    fulfill: function(value) {
        if (this === value) {
            this.reject(new TypeError("Can't fulfill promise with itself"));
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
            this.executeTimeout = this.defer(this.executeActions, 0);
        }
    },
    reject: function(value) {
        this.isFulfilled = false;
        this.isRejected = true;
        this.value = value;
        if (!this.executeTimeout) {
            this.executeTimeout = this.defer(this.executeActions, 0);
        }
    }
};
