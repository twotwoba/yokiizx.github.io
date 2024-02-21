---
title: 'Event Loop'
date: 2022-09-26T21:22:27+08:00
tags: [JavaScript, node]
---

事件循环是 JavaScript 中很重要的概念，对于初学者，更是应该牢牢掌握，不然对一个程序的执行顺序都不清楚，还怎么在代码的世界里遨游呢？🔥

## 单线程的 JavaScript

JavaScript 设计之初就是单线程的，因为要用来操作 DOM，假如一个线程在某个 DOM 节点上添加内容，另一个线程删除了这个节点，浏览器就 😳 了。

HTML5 新增了 Web Worker，但完全受控于主线程，不能操作 I/O,DOM，协助大量计算倒是很优秀，本质上还是单线程。

## 代码执行

如下图，JS 内存模型分为三种，栈空间，堆空间和代码执行空间。基本类型数据和引用类型数据的指针存储在栈中，引用类型数据存储在堆中
![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/20220926221003.png)

之前作用域的文章里提到过三个上下文，全局上下文，函数上下文，eval 上下文。当代码执行的时候需要一个栈来存储各个上下文的，这样才能保证后进入的上下文先执行结束（这里的后是指内部的嵌套函数）。

```js
// ...
// 代码扫描到此处时，执行上下文栈栈底有个全局上下文
function a() { // 函数a创建执行上下文,并推入栈中
  function b() { // 函数b创建执行上下文,并推入栈中
    console.log('hello world') // 在b的上下文中,打印字符串
  } // b 结束, 弹出栈, 把控制权交给了 a
} // a也执行完毕, 弹出栈, 交给后续的
```

> 所以当内部有 n 个函数嵌套的时候，栈就会爆，递归的死循环就是这么搞出来的。

同步任务按照上面的路子走的很顺，但是异步任务怎么办呢？就一直等吗，等到天荒地老？那是不可能的，我 JavaScript，永不阻塞！

异步任务不会进入主线程，而是被加入了一个任务队列，当主线程的同步任务跑完了，异步任务可以执行的时候再通知主线程来执行它。

## 浏览器的事件循环

一个`<script>`可以看成是一个宏任务，可以这么理解：

```txt

主线程：
┌─────────────────────────────────────────────────────────────────────────┐
│       sync code | sync code | sync code | sync code ...                 │
└─────────────────────────────────────────────────────────────────────────┘

任务队列（只是帮助理解，实际只有一个任务队列）：
        🔼  同步代码执行完毕，先检查微任务，有就加入主线程执行
┌──────────────────────────────────────────────────────────────────────────┐
│        micro | micro | micro |                                           │
└──────────────────────────────────────────────────────────────────────────┘
        🔼  微任务也执行完毕，再检查队列中是否有宏任务，加入执行，一直到任务队列为空
┌──────────────────────────────────────────────────────────────────────────┐
│     ┌─────────────────┐    ┌─────────────────┐                           │
│     │      macro      │    │      marco      │  other MacroTask...       │
│     └─────────────────┘    └─────────────────┘                           │
└──────────────────────────────────────────────────────────────────────────┘

不管事宏任务还是微任务都把它放到对应的队列中，
当主线程执行完，找微任务，微任务执行完找宏任务这样循环下去。
```

> 关于 js 执行到底是先宏任务再微任务还是先微任务再宏任务网上的文章各有说辞。如果把整个 js 代码块当做宏任务的时候我们的 js 执行顺序是先宏任务后微任务的。

练一练 😏

```js
function test3() {
  console.log(1);

  setTimeout(function () {
    console.log(2);
    new Promise(function (resolve) {
      console.log(3);
      resolve();
    }).then(function () {
      console.log(4);
    });
    console.log(5);
  }, 1000);

  new Promise(function (resolve) {
    console.log(6);
    resolve();
    console.log(7)
  }).then(function () {
    console.log(8);
    setTimeout(function () {
      console.log(9);
    },500);
  });

  setTimeout(function () {
    console.log(10);
    new Promise(function (resolve) {
      console.log(11);
      resolve();
    }).then(function () {
      console.log(12);
    });
  }, 100);

  console.log(13);
}

test3(); // 试一试~
```

> 注意：

- `new Promise(xxx)` 中的代码也是同步代码，直接执行的
- `setTimeOut(() => , wait)`中，并不是 wait 后一定执行回调，当主线程一直没有清空，则它就不会执行
- 当遇见 async/await 时，变换成 promise 更好理解

## Node 的事件循环

Node 中，会把一些异步操作放到系统内核中去。当一个操作完成的时候，内核通知 Node 将适合的回调函数添加到 轮询 队列中等待时机执行。

```txt
   ┌───────────────────────────┐
┌─>│           timers          │    -> 执行 setTimeout 和 setInterval 的回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │    -> 执行延迟到下一个循环迭代的 I/O 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │    -> 仅系统内部使用
│  └─────────────┬─────────────┘    ┌───────────────┐
│  ┌─────────────┴─────────────┐    │   incoming:   │
│  │           poll            │<───┤  connections, │ -> 执行与 I/O 相关的回调
│  └─────────────┬─────────────┘    │   data, etc.  │
│  ┌─────────────┴─────────────┐    └───────────────┘
│  │           check           │    -> 执行 setImmediate 的回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │    -> 执行一些关闭的回调函数, socket.destroy等事件
   └───────────────────────────┘

```

- pending callbacks  
  根据 Libuv 文档的描述：大多数情况下，在轮询 I/O 后立即调用所有 I/O 回调，但是，某些情况下，调用此类回调会推迟到下一次循环迭代。
- poll  
  这个阶段有一些观察者，文件观察者、I/O 观察者等。观察是否有新的请求进入，包含读取文件等待响应，等待新的 socket 请求，这个阶段在某些情况下是会阻塞的。
  (执行除了计时器回调,关闭回调和 setImmediate 回调之外的几乎所有回调)

详细的见推荐文章，在底部，一定要看看。

## 常见的宏任务和微任务

- 宏:
  - setTimeOut
  - setInterval
  - setImmediate - node
  - requestAnimationFrame - 浏览器刷新率
- 微:
  - promise
  - MutationObeserve
  - process.nextTick - node
  - queueMicroTask (Node.js 11 后实现)

setTimeout VS setImmediate  
拿 `setTimeout` 和 `setImmediate` 对比，这是一个常见的例子，基于被调用的时机和定时器可能会受到计算机上其它正在运行的应用程序影响，它们的输出顺序，不总是固定的。具体可以见文末参考文章。  
但是一旦把这两个函数放入一个 I/O 循环内调用，setImmediate 将总是会被优先调用。因为 setImmediate 属于 check 阶段，在事件循环中总是在 poll 阶段结束后运行，这个顺序是确定的。

```js
fs.readFile(__filename, () => {
  setTimeout(() => log('setTimeout'));
  setImmediate(() => log('setImmediate'));
})
```

Node 中宏任务分为了六大阶段执行，微任务执行时机在 Node11 前后发生了改变。

- 在 Node.js v11.x 之前，当前阶段如果存在多个可执行的 Task，先执行完毕，再开始执行微任务。
- 在 Node.js v11.x 之后，当前阶段如果存在多个可执行的 Task，先取出一个 Task 执行，并清空对应的微任务队列，再次取出下一个可执行的任务，继续执行。

`process.nextTick()`，从技术上讲，它不是事件循环的一部分，同步代码执行完会立马执行 `proces.nextTick()`，也就是说是先于 `promsie.then` 执行。如果出现递归 `process.nextTick()` 会阻断事件循环，陷入无限循环中，与同步的递归不同的是，它不会触碰 v8 最大调用堆栈限制。但是会破坏事件循环调度，setTimeout 将永远得不到执行。

```js
fs.readFile(__filename, () => {
  process.nextTick(() => {
    log('nextTick');
    run();
    function run() {
      process.nextTick(() => run());
    }
  });
  log('sync run');
  setTimeout(() => log('setTimeout'));
});

// 输出
sync run
nextTick
```

将 process.nextTick 改为 setImmediate 虽然是递归的，但它不会影响事件循环调度，setTimeout 在下一次事件循环中被执行。

```js
fs.readFile(__filename, () => {
  process.nextTick(() => {
    log('nextTick');
    run();
    function run() {
      setImmediate(() => run());
    }
  });
  log('sync run');
  setTimeout(() => log('setTimeout'));
});

// 输出
sync run
nextTick
setTimeout
```

> 关于 setImmediate 与 process.nextTick 的历史可以看[这篇小结](https://www.yuque.com/sunluyong/node/timer#IqNr1)

## 推荐

- [Node.js 事件循环，定时器和 process.nextTick()](https://nodejs.org/zh-cn/docs/guides/event-loop-timers-and-nexttick/)
- [浏览器工作原理与实践](https://blog.poetries.top/browser-working-principle/)
- [Node.js 事件循环-比官方更全面](https://learnku.com/articles/38802)
- [说说你对 Node.js 事件循环的理解](https://mp.weixin.qq.com/s/xuaHarOMRp6tzfLYqrWFCw)
- [极简 Node.js 入门](https://www.yuque.com/sunluyong/node)
- [setTimeout 和 setImmediate 到底谁先执行](https://juejin.cn/post/6844904100195205133)
