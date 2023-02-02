---
title: 'Node基础'
date: 2022-09-20T18:15:40+08:00
tags: [node]
---

> [Node.js 中文网](http://nodejs.cn/)。Node 有大量的 api，关键时刻还是得查文档，但是一些常用的基础的东西还是得牢记的。

##### path

常用属性：

- path.sep：Windows 下返回 `\`，POSIX 下返回 '/'
- path.delimiter：Windows 下返回 `;`， POSIX 下返回 `:`

常用方法：

- path.basename(),dirname(),extname() 返回 path 的对应部分
- path.parse(path)，解析路径，获取对应元信息对象
- path.format(parseObject)，parse 的反操作
- path.normalize(path)，标准化，解析其中的 `.` 和 `..`
- path.join(path1,path2,...)，把路径拼接并且标准化
- path.resolve(path1,path2,...)，将路径或路径片段的序列解析为绝对路径
- path.relative(from, to)，返回 from 到 to 的相对路径

##### events

所有触发事件的对象都是 EventEmitter 类的实例

`EventEmitter.on(eventname, listener)`

- listener 为普通函数，内部 this 指向 `EventEmitter` 实例，箭头函数则指向空对象
- 使用 `setImmediate`(MDN 非标准) 和 `process.nextTick()` 让其变成异步

> [process.nextTick 和 setImmediate 的区别](https://juejin.cn/post/7102633430713630750)

```JavaScript
const EventEmitter = require('events');
const event = new EventEmitter()
event.on('demo', (a, b) => {
  console.log(a, b)
})
event.emit()
```

##### process

process 对象是一个全局变量，是一个 EventEmitter 实例，提供了当前 Node.js 进程的信息和操作方法。

系统属性：

- title：进程名称，默认值 node，程序可以修改，可以让错误日志更清晰
- pid：当前进程 pid
- ppid：当前进程的父进程 pid
- platform：运行进程的操作系统（aix、drawin、freebsd、linux、openbsd、sunos、win32）
- version：Node.js 版本
- env：当前 Shell 的所有环境变量

执行信息：

- process.execPath，返回当前执行的 node 的二进制文件路径
- process.argv，返回一个数组，前两个是固定的 `[execPath, __filename, ...其他自定义的]`
- process.execArgv，返回 `node ... file` 之间的参数数组。比如 `node --inspect demo.js` 中就返回 [--inspect]，PS：该命令可以调起 vscode 的 debug。

常见方法：

- process.nextTick(callback)
- process.chdir()
- process.exit()
- process.cwd()

常见事件：

- process.on('beforeExit', (code) => {})，如果是显式调用 process.exit()退出，或者未捕获的异常导致退出，那么 beforeExit 不会触发。
- process.on('exit', (code) => {})
- process.on('message', (m) => {})
- process.on('uncaught', (err) => {})

##### fs

##### http

##### url
