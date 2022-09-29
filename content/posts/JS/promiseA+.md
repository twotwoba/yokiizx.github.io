---
title: 'Promise A+'
date: 2022-09-20T14:05:12+08:00
tags: [JavaScript, promise]
---

简直是 JavaScript 界的宠儿，[promise A+](https://github.com/promises-aplus/promises-spec) 送上！如果你有 CET4 的水平，或者 google 翻译，请一定先看完这个，而不是其他杂文（包括这篇 0.0）

> 注意：promise A+ 主要专注于可交互的 then 方法

## 解读规范

##### promise state

三种状态：` pending`、`fulfilled`、`rejected`。  
`pending ` 最终转为 `fulfilled`或 `rejected` 且是不可逆的。

##### then

一个 `promise` 必须有个 `then` 方法。

```JavaScript
promise.then(onFulfilled, onRejected)
```

1. then 方法的两个参数必须都是函数，否则将被忽略(真的是忽略吗？实际上发生了值传递和异常传递，见第 6 条)
2. 这两个函数都必须在 `promise` 转变状态后才能执行，并且只能执行一次，  
   它们的参数分别为 `promise` 的 `value` 和 `reason`
3. 这两个函数执行时机是在执行上下文只剩下 `promise` 时才去执行（指 then 的异步执行）
4. 这两个函数必须被作为函数调用（即没有 `this` 值）  
   毫无疑问要使用箭头函数，目的是确保 `this` 指向为 `promise` 实例。（假如使用 class 实现，class 默认为严格模式，this 指向 undefined）
5. 一个 `promise` 可以注册多个 `then` 方法，按照初始声明时的调用顺序执行 `then`
6. `then` 必须返回一个 `promise：`

   ```JavaScript
   promise2 = promise1.then(onFulfilled, onRejected)
   ```

   - 如果`onFulfilled`或`onRejected` 返回了值 `x`，会进入 `[[reslove]](poromise2, x)` 的程序
   - 如果`onFulfilled`或`onRejected` 抛出了错 `e`，promise2 必须用 `e` 作为 `onRejected` 的 `reason`
   - 如果`onFulfilled`或`onRejected` 不为函数，则 promise2 必须采用 promise1 的 value 或 reason (即会发生值/异常传递)

     ```JavaScript
     // 案例1 resolve
     console.log(new Promise((resolve) => {
        resolve(1)
     }).then((x) => x))
     // 案例2 reject
     console.log(new Promise((resolve, reject) => {
        reject(1)
     }).then(undefined,(r) => r))
     // 验证上方6.1，最终 PromiseState 都是 fulfilled 而不是第二个为 rejected
     ```

##### [[reslove]](poromise2, x)

首先这是一个抽象的操作程序，就是把 `then 返回的 promise` 与 `then的两个参数onFulfilled/onRejected返回的值 value` (即 x) 作为程序的输入。

主要注意 `thenable` 的处理。

程序执行将进行以下操作(4 步)：

1. 若 `promise` 和 `x` 是同一个对象(引用)，`reject promise with TypeError reason` (死循环)
2. 若 `x` 是 promise 对象，采用它的状态，三个状态该干嘛干嘛
3. 若 `x` 为 普通对象或函数
   1. 用一个变量 `then` 存储 `x.then`，如果获取 `x.then` 报错，就 `reject promise with throw error reason`
   2. 如果 `then` 是函数，用 `x` 作为 `this` 来调用，第一个参数为 `resolvePromise`，第二个参数为 `rejectPromise`
      - 当`resolvePromise`被调用，参数为 `y`，执行 `[[resolve]](promise, y)`
      - 当`rejectPromise`被调用,参数为 `r`， `reject promise with r`
      - 如果`resolvePromise`和`rejectPromise`都被调用，第一个调用执行，其他的忽略
      - 当在 `then` 中抛出了异常 `e`，若是 `resolvePromise` 或者 `rejectPromise` 已经执行，则忽略该异常，否则 `reject promise with e`
   3. 如果 `then` 不是函数，`resolve promise with x`
4. 如果 `x` 不是对象或函数，`resolve promise with x`

> 有的地方我感觉英语更好理解，比如第一条，意思就是让 promise 进入 rejected 状态，并且返回一个 TypeError 作为 reason，后续此类表达都将使用英语，真的简练也更好理解 😂

##### 代码实现

```JavaScript
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
    onRejected = typeof onRejected === 'function' ? onRejected : e => { throw e }

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
```

> 上面代码就是 promise 的核心了，跑完下面的测试，完美通过

##### 其他方法的实现

```JavaScript
class _Promise {
   // ... 主代码省略,见上方

   // catch 妥妥的语法糖嘛
  catch = (onRejected) => {
    return this.then(null, onRejected)
  }
  // finally最终返回promise，值在finallly中穿堂而过~
  // callback可能是异步的，需要等待
  finally = callback => {
    return this.then(
      value => _Promise.resolve(callback()).then(() => value),
      reason =>
        _Promise.reject(callback()).then(() => {
          throw reason
        })
    )
  }

  // 如果 x 是 promise 直接返回，否则返回个 promise 并在内部调用 resolve(x)
  static resolve(x) {
    if (x instanceof _Promise) return x
    return new _Promise((resolve, null) => {
      resolve(x)
    })
  }
  static reject(e) {
    return new _Promise((undefined, reject) => {
      reject(e)
    })
  }

  // 返回一个promise，其value是入参所有promise的value集合数组,
  // 内部调用Promsie.resolve把结果存入数组, 需要一个计数器, 监听全部完成后，改变返回promise的状态
  static all(promises) {
    let count = 0
    const max = promises.length
    const res = []
    return new _Promise((resolve, reject) => {
      for (const p of promises) {
        _Promise.resolve(p).then((v) => {
          res[count++] = v
          if(count === max) resolve(x)
        })
      }
    })
  }
  // 这个简单, 也给完成了就直接改变返回promise的状态即可
  static race(promises) {
    return new _Promsie((resolve,reject) => {
      for (const p of promises) {
        _Promise.resovle(p).then((v) => resolve(v), (r) => reject(r))
      }
    })
  }
  // allSettled 解决 all 强硬一个出错全部重来问题(2019年后主流浏览器支持,node12.9之后支持)
  // https://zhuanlan.zhihu.com/p/374005591
  static allSettled(promises) {
    const resolveHandler = value => ({status: "fulfilled", value})
    const rejectHandler = reason => ({status: "rejected", reason})
    return _Promise.all(
      promises.map(p => {
        _Promise.resolve(p).then(resolveHandler, rejectHandler)
      })
    )
  }
}
```

##### 测试 promise A+

1. npm 初始化, 依赖安装

```sh
npm init
npm install promises-aplus-tests -D
```

2. 在实现的 promise 中添加以下代码

```JavaScript
_Promise.deferred = function () {
  var result = {};
  result.promise = new _Promise(function (resolve, reject) {
    result.resolve = resolve;
    result.reject = reject;
  });

  return result;
}
module.exports = _Promise;
```

3. 配置启动 script

```JavaScript
"test": "promises-aplus-tests MyPromise"
```

最后 `npm run test` 测试一下吧.

## 推荐

- [遵循 Promises/A+规范，深入分析 Promise 源码实现(基础篇)](https://developer.aliyun.com/article/904989#slide-2)
- [几个常见的 promise 笔试题](https://mp.weixin.qq.com/s/3TDT61hk8JYdDgvQFzSmNA)
- [拓展阅读-深入理解 generator](https://github.com/Sunny-lucking/blog/issues/6)
- [拓展阅读-手写 async await 核心原理](https://juejin.cn/post/7136424542238408718)
