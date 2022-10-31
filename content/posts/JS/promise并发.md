---
title: 'Promise并发'
date: 2022-09-20T14:41:20+08:00
tags: [JavaScript, promise]
---

一个比较经典的问题，就是 n 个 请求，实现一个方法，让每次并发请求个数是 x 个这样子。  
其实在前端中应该是比较常用的应用，如果 n 个请求瞬间被发送到后端，这个是不合理的，应该控制在一定的范围内，当某个请求返回时，再去发起下个请求。

## promise

关键点，一个限定数量的请求池，一个 promise 有结果后，再去加入下一个请求，递归直到所有结束。

```JavaScript
/**
 * @desc    控制并发请求，注意请求池内的是 promise 实例，而不是请求函数
 * @param   {Promise[]} ajaxFns - 请求函数集合
 * @param   {Number}    limit   - 请求池限制
 */
const concurrentPromise = (ajaxFns, limit) => {
  // if (limit >= ajaxFns.length) return Promise.all(ajaxFns.map(fn => fn()))
  const pool = []
  const ret = []
  for (let i = 0; i < limit; ++i) {
    const promise = ajaxFns.shift()()
    // pool.push(promise) // 由于 后续需要递归的更新请求池，所以提取一个递归函数
    managePool(pool, promise, ret, ajaxFns)
  }
}

/**
 * 递归调用请求，利用then的回调
 */
function managePool(pool, promise, ret, ajaxFns) {
  pool.push(promise)
  promise.then(res => {
    ret.push(res)
    pool.splice(pool.indexOf(promise), 1)
    const next = ajaxFns.shift()
    next !== undefined && managePool(pool, next(), ret, ajaxFns)
    pool.length === 0 && console.log('ret', ret)
  })
}

/* ---------- 测试 ---------- */
const test = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

/**
 * 创建模拟请求函数
 */
const imitateAjax = i => {
  return () => {
    console.log('start --: ', i)
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(i)
        console.log('end ==: ', i)
      }, (Math.random() + 1) * i * 100)
    })
  }
}
function run(params) {
  const requests = []
  for (let i = 0; i < params.length; i++) {
    requests.push(imitateAjax(test[i]))
  }
  return requests
}

concurrentPromise(run(test), 3)
```

重点是：

1. 控制请求池 pool，先利用 for 循环装入 limit 的请求（利用递归函数），之后的都递归加入
2. 通过 promise 的状态改变来进行递归控制（我这里模拟的都是成功请求，可以考虑上失败请求）

## async + promise.race

通过 aync + promise.race 能更简单的控制。

```JavaScript
const asyncPool = async (ajaxFns, limit) => {
  const res = []
  const pool = []
  for (const fn of ajaxFns) {
    const p = fn()
    res.push(p)
    if (limit < ajaxFns.length) {
      const e = p.then(() => pool.splice(pool.indexOf(e), 1))
      pool.push(e)
      if (pool.length === limit) {
        await Promise.race(pool)
      }
    }
  }
  return Promise.all(res)
}
```

关键点：与原生 promise 维护一个请求池不同的是，直接通过**普通 for** 循环添加 await 和 Promise.race 来实现等待效果。

> 需要注意 await 在 for 循环和 forEach, map...中的表现是不一样，带回调的循环会放入下一个 trick 中。

上文重在思想，如有问题，欢迎留言指正。

## 参考

- [async-pool](https://github.com/rxaviers/async-pool/blob/master/lib/es6.js)
