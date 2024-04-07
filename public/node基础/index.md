# Node基础


> [Node.js 中文网](http://nodejs.cn/)。Node 有大量的 api，关键时刻还是得查文档，但是一些常用的基础的东西还是得牢记的。

### path

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

### events

所有触发事件的对象都是 EventEmitter 类的实例

`EventEmitter.on(eventname, listener)`

- listener 为普通函数，内部 this 指向 `EventEmitter` 实例，箭头函数则指向空对象
- 使用 `setImmediate`(MDN 非标准) 和 `process.nextTick()` 让其变成异步

> [process.nextTick 和 setImmediate 的区别](https://juejin.cn/post/7102633430713630750)

```js
const EventEmitter = require('events');
const event = new EventEmitter()
event.on('demo', (a, b) => {
  console.log(a, b)
})
event.emit()
```

### process

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

### fs

Node 中的异步默认是回调风格，`callback(err, returnValue)`：

```js
const fs = require('fs')
fs.stat('.', (err, stats) => {
  // ...
});
```

v14 之后，文件系统提供了 `fs/promises` 支持 promise 风格的使用方法：

```js
const fs = require('fs/promises');
fs.stat('.').then((stats) => {}).catch((err) => {});
```

为了统一，内置的 `util` 模块提供了 `promisify` 方法可以把所有标准 callback 风格方法转成 promise 风格方法：

```js
const fs = require('fs');
const { promisify } = require('util');

const stat = promisify(fs.stat);
stat('.').then((stats) => {
  console.log('📌📌📌 ~ stat ~ stats', stats);
});

// 对应的同步方法就是在其后添加 Sync 标识
const syncInfo = fs.statSync()
```

> 几乎大部分的异步 api 都有对应的 同步方法，常规的 API 不在本文赘述，直接看官网，孰能生巧。

关于 `fs.watch/fs.watchFile` 都有不足，日常在监视文件变化可以选择社区的优秀方案：

1. node-watch
2. chokidar

### Buffer 和 stream

这两个概念比较重要，在于理解，看以下参考文章吧：

Buffer 类的实例类似于 0 到 255 之间的整型数组（其他整数会通过 ＆ 255 操作强制转换到此范围），Buffer 是一个 JavaScript 和 C++ 结合的模块，对象内存不经 V8 分配，而是由 C++ 申请、JavaScript 分配。缓冲区的大小在创建时确定，不能调整。

> Buffer 对象用于表示固定长度的字节序列。
> Buffer 类是 JavaScript 的 `Uint8Array` 类的子类，且继承时带上了涵盖额外用例的方法。 只要支持 Buffer 的地方，Node.js API 都可以接受普通的 `Uint8Array`。 -- 官方文档

> 数据的移动是为了处理或读取它，如果**数据到达的速度比进程消耗的速度快**，那么少数早到达的数据会处于等待区等候被处理。 《Node.js 中的缓冲区（Buffer）究竟是什么？》

- [理解 Node 中的 Buffer 与 stream](https://juejin.cn/post/6955331683499376676)
- [Node.js 语法基础 —— Buffter & Stream](https://zhaomenghuan.js.org/note/nodejs/nodejs-buffer-stream.html)
- [Buffer 和 stream](https://www.yuque.com/sunluyong/node/buffer)

补充：为了比较 Buffer 与 String 的效率，顺便学习呀一下 ab 这个命令，见[使用 Apache Bench 对网站性能进行测试](https://blog.csdn.net/dongdong9223/article/details/49248979)

```js
const http = require('http');
let s = '';
for (let i=0; i<1024*10; i++) {
    s+='a'
}

const str = s;
const bufStr = Buffer.from(s);
const server = http.createServer((req, res) => {
    console.log(req.url);

    if (req.url === '/buffer') {
        res.end(bufStr);
    } else if (req.url === '/string') {
        res.end(str);
    }
});

server.listen(3000);
```

```sh
ab -n 1000 -c 100 http://localhost:3000/buffer
ab -n 1000 -c 100 http://localhost:3000/string
# 从跑出来的结果能清晰的看出消耗时间和传输效率 buffer > string
```

### http

`http.createServer()`. 详细见官网。

### 进程

Node.js 本身就使用的事件驱动模型，为了解决单进程单线程对多核使用不足问题，可以按照 CPU 数目多进程启动，理想情况下一个每个进程利用一个 CPU。

Node.js 提供了 child_process 模块支持多进程，通过 child_process.fork(modulePath) 方法可以调用指定模块，衍生新的 Node.js 进程 。

```js
const { fork } = require('child_process');
const os = require('os');

for (let i = 0, len = os.cpus().length; i < len; i++) {
  fork('./server.js'); // 每个进程启动一个http服务器
}
```

进程之间的通信，使用 WebWorker API。

node 内置模块`cluster` 基于 child_process.fork 实现.

```js
const cluster = require('cluster');            // | |
const http = require('http');                  // | |
const numCPUs = require('os').cpus().length;   // | |    都执行了
                                               // | |
if (cluster.isMaster) {                        // |-|-----------------
  // Fork workers.                             //   |
  for (var i = 0; i < numCPUs; i++) {          //   |
    cluster.fork();                            //   |
  }                                            //   | 仅父进程执行
  cluster.on('exit', (worker) => {             //   |
    console.log(`${worker.process.pid} died`); //   |
  });                                          //   |
} else {                                       // |-------------------
  // Workers can share any TCP connection      // |
  // In this case it is an HTTP server         // |
  http.createServer((req, res) => {            // |
    res.writeHead(200);                        // |   仅子进程执行
    res.end('hello world\n');                  // |
  }).listen(8000);                             // |
}                                              // |-------------------
                                               // | |
console.log('hello');                          // | |    都执行了
```

推荐两篇文章：

- [多进程 & Node.js 实现](https://www.yuque.com/sunluyong/node/cluster)
- [Node.js cluster 踩坑小结](https://zhuanlan.zhihu.com/p/27069865)

## 参考

- [Node.js 中文网](http://nodejs.cn/)
- [七天学会 NodeJS](https://nqdeng.github.io/7-days-nodejs/)
- [Node.js 资源](https://cnodejs.org/getstart)
- [setTimeout 和 setImmediate 到底谁先执行](https://juejin.cn/post/6844904100195205133)
- [Node.js cluster 踩坑小结](https://zhuanlan.zhihu.com/p/27069865)

