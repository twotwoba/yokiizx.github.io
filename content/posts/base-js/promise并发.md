---
title: 'Promise并发'
date: 2022-09-20T14:41:20+08:00
tags: [JavaScript, promise]
---

一个比较经典的问题，就是 n 个 请求，实现一个方法，让每次并发请求个数是 x 个这样子。  
其实在前端中应该是比较常用的应用，如果 n 个请求瞬间被发送到后端，这个是不合理的，应该控制在一定的范围内，当某个请求返回时，再去发起下个请求。

## promise

关键点，一个限定数量的请求池，一个 promise 有结果后，再去加入下一个请求，递归直到所有结束。

```js
const mockReq = function (time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(time);
    }, time);
  });
};
const reqList = [1000, 2000, 2000, 3000, 3000, 5000];
const res = [];

/**
 * 核心就是利用递归调用请求，在then回调中自动加入请求池
 */
function concurrentPromise(limit) {
  const pool = [];
  for (let i = 0; i < limit; ++i) {
    // pool.push(mockReq(reqList.shift());
    managePool(pool, mockReq(reqList.shift()));
  }
}
function managePool(pool, promise) {
  pool.push(promise);
  promise.then((r) => {
    res.push(r);
    pool.splice(pool.indexOf(promise), 1);
    if (reqList.length) managePool(pool, mockReq(reqList.shift()));
    pool.length === 0 && console.log('ret', res);
  });
}
concurrentPromise(3);
```

重点是：

1. 控制请求池 pool，先利用 for 循环装入 limit 的请求（利用递归函数），之后的都递归加入
2. 通过 promise 的状态改变来进行递归控制（我这里模拟的都是成功请求，可以考虑上失败请求）

## async + promise.race

通过 aync + promise.race 能更简单的控制。

```js
async function concurrentPromise(limit) {
  const pool = [];
  for (let i = 0; i < reqList.length; ++i) {
    const req = mockReq(reqList[i]);
    pool.push(req);
    req.then((r) => {
      res.push(r);
      pool.splice(pool.indexOf(req), 1);
      if (pool.length === 0) console.log(res);
    });
    if (pool.length === limit) {
      await Promise.race(pool);
    }
  }
}
concurrentPromise(3);
```

关键点：与原生 promise 维护一个请求池不同的是，直接通过**普通 for** 循环添加 await 和 Promise.race 来实现等待效果。

> 需要注意 await 在 for 循环和 forEach, map...中的表现是不一样，带回调的循环会放入下一个 trick 中。

上文重在思想，如有问题，欢迎留言指正。

## 参考

- [async-pool](https://github.com/rxaviers/async-pool/blob/master/lib/es9.js)
