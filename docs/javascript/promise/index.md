---
title: Promise
---

## 1. Promise简单实现

```js
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class Myp {
    #status = PENDING
    #value = void 0
    #handler = []
    constructor(executor) {
        const resolve = data => {
            this.#changeStatus(FULFILLED, data)
        }
        
        const reject = reason => {
            this.#changeStatus(REJECTED, reason)
        }

        try {
            executor(resolve, reject)
        } catch (error) {
            reject(error)
        }
    }

    #changeStatus(status, value) {
        if (this.#status !== PENDING) return
        this.#status = status
        this.#value = value
        this.#run()
    }
    #isPromiseLike(promise) {
        return (
            !!promise && 
            typeof promise.then === 'function'
        )
    }

    #run() {
        if (this.#status === PENDING) return
        while(this.#handler.length) {
            let {onFulfilled, onRejected, resolve, reject} = this.#handler.shift()
            if (this.#status === FULFILLED) {
                if (typeof onFulfilled === 'function') {
                    const data = onFulfilled(this.#value)
                    if (this.#isPromiseLike(data)) {
                        data.then(resolve, reject)
                    } else {
                        resolve(data)
                    }
                } else {
                    resolve(this.#value)
                }
            } else if (this.#status === REJECTED) {
                if (typeof onFulfilled === 'function') {
                    onRejected(this.#value)
                } else {
                    reject(this.#value)
                }
            }
        }
    }

    then(onFulfilled, onRejected) {
        return new Myp((resolve, reject) => {
            this.#handler.push({
                onFulfilled,
                onRejected,
                resolve,
                reject
            })
            this.#run()
        })
    }

}
```