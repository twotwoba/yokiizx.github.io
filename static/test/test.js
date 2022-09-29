/**
 * @description  : promise 实现
 * @date         : 2022-09-28 21:42:08
 * @author       : yokiizx
 */
const PENGDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class _Promise {
  constructor(executor) {
    this.status = PENGDING
    this.value = null
    this.reason = null
    this.onFulfilledCb = []
    this.onRejectedCb = []
    try {
      executor(this.resovle, this.reject)
    } catch (e) {
      this.reject(e)
    }
  }

  resovle = value => {
    if (this.status === PENGDING) {
      this.status = FULFILLED
      this.value = value
      this.onFulfilledCb.forEach(cb => cb(value))
    }
  }
  reject = reason => {
    if (this.status === PENGDING) {
      this.status = REJECTED
      this.reason = reason
      this.onRejectedCb.forEach(cb => cb(reason))
    }
  }
  then = (onFulfilled, onRejected) => {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : x => x
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : e => {
            throw e
          }

    const promise2 = new _Promise((resolve, reject) => {
      const fulfilledTask = () => {
        queueMicrotask(() => {
          try {
            const x = onFulfilled(this.value)
            resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      const rejectedTask = () => {
        queueMicrotask(() => {
          try {
            const x = onRejected(this.reason)
            resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      if (this.status === FULFILLED) {
        fulfilledTask()
      } else if (this.status === REJECTED) {
        rejectedTask()
      } else {
        this.onFulfilledCb.push(fulfilledTask)
        this.onRejectedCb.push(rejectedTask)
      }
    })
    return promise2
  }
}

function resolvePromise(promise, x, resolve, reject) {
  if (promise === x) return reject(new TypeError('type error'))
  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    let then
    try {
      then = x.then
    } catch (e) {
      reject(e)
    }

    let called = false
    if (typeof then === 'function') {
      try {
        then.call(
          x,
          y => {
            if (called) return
            called = true
            resolvePromise(promise, y, resolve, reject)
          },
          r => {
            if (called) return
            called = true
            reject(r)
          }
        )
      } catch (e) {
        if (called) return
        called = true
        reject(e)
      }
    } else {
      resolve(x)
    }
  } else {
    resolve(x)
  }
}

_Promise.deferred = function () {
  var result = {}
  result.promise = new _Promise(function (resolve, reject) {
    result.resolve = resolve
    result.reject = reject
  })

  return result
}
module.exports = _Promise
