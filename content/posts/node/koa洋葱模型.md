---
title: 'Koa洋葱模型'
date: 2022-09-20T17:56:47+08:00
tags: [node]
---

> 目前 Node.js 社区较为流行的一个 Web 框架，书写比较优雅。
> [koa 常用中间件](https://www.npmjs.com/package/koa-middlewares)

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202302081832987.jpg)

## 简单 demo

```javascript
// 执行顺序
const Koa = require('koa');
const app = new Koa();

// logger
app.use(async (ctx, next) => {
  await next(); // 1
  const rt = ctx.response.get('X-Response-Time'); // 7
  if (ctx.url === '/favicon.ico') return; // 8
  console.log(`${ctx.method} ${ctx.url} - ${rt}`); // 9
});

// x-response-time
app.use(async (ctx, next) => {
  const start = Date.now(); // 2
  await next(); // 3
  const ms = Date.now() - start; // 5
  ctx.set('X-Response-Time', `${ms}ms`); // 6
});

// response
app.use(async (ctx) => {
  ctx.body = 'Hello World'; // 4
});

app.listen(3000);
```

显而易见，`app.use` 貌似被分割成了下面的样子：

```JavaScript
async function customMiddleware(ctx, next) {
	// ctx.request 请求部分处理
  // ...

  await next();

  // ctx.response 响应处理部分
  // ...
}
```

中间件每次调用 next 后，就会进入下一个中间件，直到所有中间件都被执行过，再往回退，类似`递归` 一样的操作，这就是经常听说的`洋葱模型`。接下来具体看看是怎么实现的。

## koa/application.js

##### [use](https://github.com/koajs/koa/blob/master/lib/application.js#L141)

核心代码如下，很简单，就是往 `Application` 实例 即 `new Koa` 的属性 `middleware` 中推入函数 `fn`：

```JavaScript
use (fn) {
  this.middleware.push(fn)
  return this
}
```

##### [listen](https://github.com/koajs/koa/blob/master/lib/application.js#L98)

再来看下 `listen` 方法：

```JavaScript
listen (...args) {
  const server = http.createServer(this.callback())
  return server.listen(...args)
}
```

其实就是 http.createServer 的语法糖，只不过传入的是自身的 callback 方法。

##### [callback](https://github.com/koajs/koa/blob/master/lib/application.js#L156)

```JavaScript
callback () {
  const fn = this.compose(this.middleware)

  const handleRequest = (req, res) => {
    const ctx = this.createContext(req, res)
    return this.handleRequest(ctx, fn)
  }

  return handleRequest
}
handleRequest(ctx, fnMiddleware) {
  // ... 省略, 主要关注下 fnMiddleware
  // 执行 compose 中返回的函数，看上去应该是个 promise
  return fnMiddleware(ctx).then(handleResponse).catch(onerror)
}
```

这里 `this.compose` 默认引用的是 `const compose = require('koa-compose')`。

##### [koa-compose](https://github.com/koajs/compose)

```JavaScript
function compose (middleware) {
  // 错误处理省略...
  return function (context, next) {
    // last called middleware #
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      // 执行多次错误处理省略...
      // 更新 index
      index = i
      // 拿到当前 中间件
      let fn = middleware[i]
      // 当 i 为 middleware 时, 可以选择性传入 next, 如果没有传则为 undefined
      if (i === middleware.length) fn = next
      // 当 fn 为 undefined, 返回 Promise fulfilled 状态, 开始执行 next() 后面的代码
      if (!fn) return Promise.resolve()
      try {
        // 注意这里: 给中间件fn传参, 第一个为 ctx, 第二个为 next
        // 所以 next 就是一个 dispatch.bind(null, i + 1) 这么个函数
        // 这就是为什么 next 会进入下一个中间件的原因
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
```

简易版 compose 实现：

```JavaScript
const middleware = [];
let mw1 = async function (ctx, next) {
  console.log('next前，第一个中间件');
  await next();
  console.log('next后，第一个中间件');
};
let mw2 = async function (ctx, next) {
  console.log('next前，第二个中间件');
  await next();
  console.log('next后，第二个中间件');
};
let mw3 = async function (ctx, next) {
  console.log('第三个中间件，没有next了');
};

function use(mw) {
  middleware.push(mw);
}

function compose(middleware) {
  return (ctx, next) => {
    return dispatch(0);
    function dispatch(i) {
      const fn = middleware[i];
      if (!fn) return;
      return fn(ctx, dispatch.bind(null, i + 1));
    }
  };
}

use(mw1);
use(mw2);
use(mw3);

const fn = compose(middleware);

fn();

```

##### co 原理

通过不断调用 generator 函数的 next 方法来达到自动执行 generator 函数的，类似 async、await 函数自动执行。

```JavaScript
function co(gen) {
  var ctx = this;
  var args = slice.call(arguments, 1)

  // we wrap everything in a promise to avoid promise chaining,
  // which leads to memory leak errors.
  // see https://github.com/tj/co/issues/180
  return new Promise(function(resolve, reject) {
    // 把参数传递给gen函数并执行
    if (typeof gen === 'function') gen = gen.apply(ctx, args);
    // 如果不是函数 直接返回
    if (!gen || typeof gen.next !== 'function') return resolve(gen);

    onFulfilled();

    /**
     * @param {Mixed} res
     * @return {Promise}
     * @api private
     */

    function onFulfilled(res) {
      var ret;
      try {
        ret = gen.next(res);
      } catch (e) {
        return reject(e);
      }
      next(ret);
    }

    /**
     * @param {Error} err
     * @return {Promise}
     * @api private
     */

    function onRejected(err) {
      var ret;
      try {
        ret = gen.throw(err);
      } catch (e) {
        return reject(e);
      }
      next(ret);
    }

    /**
     * Get the next value in the generator,
     * return a promise.
     *
     * @param {Object} ret
     * @return {Promise}
     * @api private
     */

    // 反复执行调用自己
    function next(ret) {
      // 检查当前是否为 Generator 函数的最后一步，如果是就返回
      if (ret.done) return resolve(ret.value);
      // 确保返回值是promise对象。
      var value = toPromise.call(ctx, ret.value);
      // 使用 then 方法，为返回值加上回调函数，然后通过 onFulfilled 函数再次调用 next 函数。
      if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
      // 在参数不符合要求的情况下（参数非 Thunk 函数和 Promise 对象），将 Promise 对象的状态改为 rejected，从而终止执行。
      return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
        + 'but the following object was passed: "' + String(ret.value) + '"'));
    }
  });
}
```

## 参考

- [github - koajs/koa](https://github.com/koajs/koa)
- [koa 中文文档](https://koa.bootcss.com/)
- [学习 koa 源码的整体架构，浅析 koa 洋葱模型原理和 co 原理](https://juejin.cn/post/6844904088220467213)
- [深入浅出 Koa 的洋葱模型](https://juejin.cn/post/7012031464237694983#heading-6)
- [中间件](https://www.yuque.com/sunluyong/node/middleware)
