---
title: 'Async/await原理'
date: 2022-09-20T15:43:30+08:00
tags: [JavaScript, promise]
---

前端在平时开发中，应该没少使用 async/await 来让异步任务看上去像是同步的。经典的 `await-to-js` 这个库更是把错误捕捉都一并处理好了。

以前学习的时候，就知道这个流行 api 是 promise 和 generator 函数的语法糖，但是没有详细的审视过因为 generator 用的不多，在重新认识一下 async/await 之前还是先去看看 generator 的原理吧。

### generator

`generator` 生成器函数使用 `function*` 语法，这种函数在调用时并不会执行任何代码，而是返回一个 `Generator` 的迭代器（关于迭代器在[这篇](https://yokiizx.site/posts/js/map%E5%92%8Cset/)文章中我有提到），且迭代器之间互不影响，调用迭代器的 `next` 方法，返回一个形如 `{value: .., done: Boolean}` 的对象。  
另一个需要知道的点是，next 方法参数的作用，是`为上一个 yield 语句赋值`。其他详细的用法见参考中第一篇文章。

---

核心原理大致如下：

```js
// 1. 不同实例，返回的迭代器互不干扰，所以应该是有个生成上下文的构造器
class Context {
  constructor() {
    this.curr = null
    this.next = null
    this.done = false
  }
  finish() {
    this.done = true
  }
}

// 2. 使用switch..case的流程控制函数
function process(ctx) {
  var xxx
  while (1) {
    switch ((ctx.curr = ctx.next)) {
      case 0:
        ctx.next = 2
        return 'p1'

      case 2:
        ctx.next = 4
        return 'p2'

      case 4:
        ctx.next = 6
        return 'p3'

      case 6:
        ctx.finish()
        return undefined
    }
  }
}

// 3. 一个返回迭代器的函数，在这里创建上下文
function gen() {
  const ctx = new Context()
  return {
    next() {
      value: process(ctx)
      done: ctx.done
      return {
        value,
        done
      }
    }
  }
}
```

### async/await

理解了上面 generator 的原理，理解 async/await 就容易得多了。

```js
async function demo() {
    await new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(1);
            console.log(1);
        }, 1000);
    })
    await new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(2);
            console.log(2);
        }, 500);
    })
    await new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(3);
            console.log(3);
        }, 100);
    })
}

demo()  // 1 2 3
```

现在来打开这个语法糖的魔盒，看看怎么来实现它：

```js
function* demo() {
  yield new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(1)
      console.log(1)
    }, 1000)
  })
  yield new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(2)
      console.log(2)
    }, 500)
  })
  yield new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(3)
      console.log(3)
    }, 100)
  })
}
const gen = demo()
gen.next().value.then(() => {
  gen.next().value.then(() => {
    gen.next()
  })
})
```

上方是最朴实无华的语法糖解密，但是不够优雅，n 个 await 那不得回调地狱了？可以很自然的联想到使用一个递归函数来处理：

```js
function co(gen) {
  const curr = gen.next()
  if(curr.done) return
  curr.value.then(() => {
    co(gen)
  })
}
```

async/await 的原理挺简单的，要善于理解。

再记录一个常用的 async/await 处理错误比较好的库，`await-to-js`，源码如下（短小精炼）：

```js
export function to<T, U = Error> (
  promise: Promise<T>,
  errorExt?: object
): Promise<[U, undefined] | [null, T]> {
  return promise
    .then<[null, T]>((data: T) => [null, data])
    .catch<[U, undefined]>((err: U) => {
      if (errorExt) {
        const parsedError = Object.assign({}, err, errorExt);
        return [parsedError, undefined];
      }

      return [err, undefined];
    });
}

export default to;
```

## 参考

- [深入理解 generators](http://www.alloyteam.com/2016/02/generators-in-depth/)
- [深入理解 generator](https://github.com/Sunny-lucking/blog/issues/6)
- [co 函数库的含义和用法](https://www.ruanyifeng.com/blog/2015/05/co.html)
- [手写 async await 核心原理](https://juejin.cn/post/7136424542238408718)
