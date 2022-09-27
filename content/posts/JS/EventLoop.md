---
title: 'Event Loop'
date: 2022-09-26T21:22:27+08:00
tags: [JavaScript]
---

事件循环是 JavaScript 中很重要的概念，对于初学者，更是应该牢牢掌握，不然对一个程序的执行顺序都不清楚，还怎么在代码的世界里遨游呢？🔥

## 单线程的 JavaScript

JavaScript 设计之初就是单线程的，因为要用来操作 DOM，假如一个线程在某个 DOM 节点上添加内容，另一个线程删除了这个节点，浏览器就 😳 了。

HTML5 新增了 Web Worker，但完全受控于主线程，不能操作 I/O,DOM，协助大量计算倒是很优秀，本质上还是单线程。

## 代码执行

如下图，JS 内存模型分为三种，栈空间，堆空间和代码执行空间。基本类型数据和引用类型数据的指针存储在栈中，引用类型数据存储在堆中
![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/20220926221003.png)

之前作用域的文章里提到过三个上下文，全局上下文，函数上下文，eval 上下文。当代码执行的时候需要一个栈来存储各个上下文的，这样才能保证后进入的上下文先执行结束（这里的后是值内部的嵌套函数）。

```JavaScript
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

其实`<script>`就是一个宏任务，可以这么理解：

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

```JavaScript
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
  }).then(function () {
    console.log(7);
    setTimeout(function () {
      console.log(8);
    });
  });

  setTimeout(function () {
    console.log(9);
    new Promise(function (resolve) {
      console.log(10);
      resolve();
    }).then(function () {
      console.log(11);
    });
  }, 100);

  console.log(12);
}

test3();
// 1 6 12 7 8 9 10 11 2 3 5 4
```

注意：

- `new Promise(xxx)` 中的代码也是同步代码，直接执行的
- `setTimeOut(() => , wait)`中，并不是 wait 后一定执行回调，当主线程一直没有清空，则它就不会执行

## Node 的事件循环

```txt
   ┌───────────────────────┐
┌─>│        timers         │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
│  │     I/O callbacks     │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
│  │     idle, prepare     │
│  └──────────┬────────────┘      ┌───────────────┐
│  ┌──────────┴────────────┐      │   incoming:   │
│  │         poll          │<──connections───     │
│  └──────────┬────────────┘      │   data, etc.  │
│  ┌──────────┴────────────┐      └───────────────┘
│  │        check          │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
└──┤    close callbacks    │
   └───────────────────────┘
```

[Node.js 事件循环，定时器和 process.nextTick()](https://nodejs.org/zh-cn/docs/guides/event-loop-timers-and-nexttick/)

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
  - queueMicroTask

## 推荐

- [Node.js 事件循环，定时器和 process.nextTick()](https://nodejs.org/zh-cn/docs/guides/event-loop-timers-and-nexttick/)
- [浏览器工作原理与实践](https://blog.poetries.top/browser-working-principle/)
