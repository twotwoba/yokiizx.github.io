---
title: 'Node的特点'
date: 2022-09-20T17:13:40+08:00
tags: [node]
---

## 特点

1. 事件驱动
2. 非阻塞 I/O
3. 单线程
4. 跨平台

##### IO

I/O 任务主要由 CPU 分发给 DMA 执行，I/O 是一个相对耗时较长的工作，大部分时间是在等待。

脚本语言更适合 IO 密集型的任务，node 是其中的佼佼者。

##### 事件驱动

PHP 应用，任何时候当有请求进入的时候，网页服务器（通常是 Apache）就为这一请求新建一个进程，并且开始从头到尾执行相应的 PHP 脚本。而我们的 node 是单线程的。

`http.createServer(callback).listen(port)`，当一个请求到达端口的时候，callback 就会被执行。这个就是传说中的 **回调** 。我们给某个方法传递了一个函数，这个方法在有相应事件发生时调用这个函数来进行 **回调** 。

这依赖于 node 的 **事件循环**。

##### 单线程

node 采用单线程，异步非阻塞模式。

JavaScript 是单线程，但 JavaScript 的 runtime Node.js 并不是，负责 Event Loop 的 libuv 用 C 和 C++ 编写

- 优点
  1.  不用像多线程那样在意状态同步的问题，没有死锁现象，没有线程上下文切换所带来的性能上的开销
- 缺点
  1.  无法利用多核 cpu
  2.  错误会引起整个应用退出
  3.  大量计算占用 cpu 导致无法继续调用异步 I/O
      > 解决方案：1. 编写 C/C++拓展来更高效的利用 CPU，2. 利用子进程(child_process)，将计算分发到各个子进程，再通过进程之间的事件消息来传递结果，将计算与 I/O 分离。

如上方 PHP 应用，采用多线程来处理高并发，一个请求就开个新线程，处理完成后再释放。

- [Node.js 真的性能高嘛?](https://www.yuque.com/sunluyong/node/what-is-node#4UuWj)

用户请求来了， CPU 的部分做完不用等待 I/O，交给底层完成，然后可以接着处理下一个请求了，快就快在

1. 非阻塞 I/O
2. Web 场景 I/O 密集
3. 没多线程 Context 切换开销，多出来的开销是维护 EventLoop

##### 跨平台

Node 一开始只能在 linux 上执行，后来基于 `libuv` 实现了跨平台。  
操作系统和 Node 上层模块系统之间构建了一层平台架构层，即 `libuv`。

## 参考

- [什么是 CPU 密集型、IO 密集型？](https://zhuanlan.zhihu.com/p/62766037)
- [进程和线程的概念、区别及进程线程间通信](https://cloud.tencent.com/developer/article/1688297)
- [nodejs 是单线程还是多线程\_node 是多线程还是单线程？](https://blog.csdn.net/weixin_39916511/article/details/111863857)
- [Understanding the node.js event loop](http://blog.mixu.net/2011/02/01/understanding-the-node-js-event-loop/)
