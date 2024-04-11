---
title: 'Webpack之plugin'
date: 2023-01-05T22:12:22+08:00
tags: [tool]
series: [wp]
draft: true
---

## Tapable

Tapable 是 webpack 实现的一个包，webpack 打包全流程都有它的影子，是 webpack 的核心库，webpack 的插件系统离不开它。

```js
const {
  SyncHook,
  SyncBailHook,
  SyncWaterfallHook,
  SyncLoopHook,
  AsyncParallelHook,
  AsyncParallelBailHook,
  AsyncSeriesHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook
} = require('tapable')
```

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202301301354638.webp)

| 钩子名称                 | 执行方式 | 使用要点                                                                                                                               |
| ------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| SyncHook                 | 同步串行 | 不关心监听函数的返回值                                                                                                                 |
| SyncBailHook             | 同步串行 | 只要监听函数中有一个函数的返回值不为 null,则跳过剩余逻辑                                                                               |
| SyncWaterfallHook        | 同步串行 | 上一个监听函数的返回值将作为参数传递给下一个监听函数                                                                                   |
| SyncLoopHook             | 同步串行 | 当监听函数被触发的时候，如果该监听函数返回 true 时则这个监听函数会反复执行，如果返回 undefined 则表示退出循环                          |
| AsyncParallelHook        | 异步串行 | 不关心监听函数的返回值                                                                                                                 |
| AsyncParallelBailHook    | 异步串行 | 只要监听函数的返回值不为 null，就会忽略后面的监听函数执行，直接跳跃到 callAsync 等触发函数绑定的回调函数，然后执行这个被绑定的回调函数 |
| AsyncSeriesHook          | 异步串行 | 不关心 callback()的参数                                                                                                                |
| AsyncSeriesBailHook      | 异步串行 | callback()的参数不为 null，就会直接执行 callAsync 等触发函数绑定的回调函数                                                             |
| AsyncSeriesWaterfallHook | 异步串行 | 上一个监听函数的中的 callback(err, data)的第二个参数,可以作为下一个监听函数的参数                                                      |

我们从命名就能看出来大致的区别，分为同步/异步，串行/并行/瀑布流/循环类型等。钩子的目的是为了显示的声明触发监听事件时传入的参数，以及订阅该钩子的 callback 函数所接收到的参数，举个简单例子：

```js
const demo = new SyncHook(['hello']) // hello 字符串为参数占位符
demo.tap('Say', (str1, str2) => {
  console.log(str1, str2) // hello-world, undefined
})
demo.call('hello-world')
```

注意：call 传入的参数与定义的参数需要与实力化时传给钩子的数组长度保持一致。

---

其实本质上来看，就是一个发布-订阅模式，订阅事件，当事件被触发时，执行绑定的回调函数，分别来看。

订阅事件有三个方法：

- tap: (name: string | Tap, fn: (context?, ...args) => Result) => void,
- tapAsync: (name: string | Tap, fn: (context?, ...args, callback: (err, result: Result) => void) => void) => void,
- tapPromise: (name: string | Tap, fn: (context?, ...args) => Promise<Result>) => void,

其中只有 tap 可以用与 Sync 开头的钩子，tapAsync 相比 tap 的回调参数多了个 callback 入参，执行 callback 才能确保流程会走入到下一个插件中去。

触发事件对应的也有三个方法：

- call: (...args) => Result,
- callAsync: (...args, callback: (err, result: Result) => void) => void,
- promise: (...args) => Promise<Result>,

## 插件与 tapable

说了一堆 Tapable 的概念，插件到底咋整呢？看官网示例：

```js
// ./CustomPlugin.js
class HelloWorldPlugin {
	apply(compiler) {
		compiler.hooks.done.tap(
			"Hello World Plugin",
			(
				compilation /* compilation is passed as an argument when done hook is tapped.  */
			) => {
				console.log("Hello World!");
			}
		);
	}
}

module.exports = HelloWorldPlugin;

// Webpack.config.js
const HelloWorldPlugin = require("./CustomPlugin");
module.exports = {
  // ...
  plugins: [
    new HelloWorldPlugin()
  ]
}
```

在之前学习 webpack 核心流程时，`createCompiler` 方法体内有这么一段代码：

```js
/** 加载自定义配置的插件 注意这就是为什么插件需要一个 apply 方法 */
if (Array.isArray(options.plugins)) {
  for (const plugin of options.plugins) {
    if (typeof plugin === "function") {
      plugin.call(compiler, compiler);
    } else {
      plugin.apply(compiler);
    }
  }
}
```

这就是为什么自定义插件都要带有一个 apply 方法并传入了 compiler。

apply 虽然是一个函数，但是从设计上就只有输入，webpack 不 care 输出，所以在插件中只能通过调用类型实体的各种方法来或者更改实体的配置信息，变更编译行为。例如：

- compilation.addModule：添加模块，可以在原有的 module 构建规则之外，添加自定义模块
- compilation.emitAsset：直译是“提交资产”，功能可以理解将内容写入到特定路径
- ...

apply 函数运行时会得到参数 compiler ，以此为起点可以调用 hook 对象注册各种钩子回调，例如：compiler.hooks.make.tapAsync ，这里面 make 是钩子名称，tapAsync 定义了钩子的调用方式，webpack 的插件架构基于这种模式构建而成，插件开发者可以使用这种模式在钩子回调中，插入特定代码。webpack 各种内置对象都带有 hooks 属性，比如 compilation 对象：

```js
class SomePlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('SomePlugin', (compilation) => {
            compilation.hooks.optimizeChunkAssets.tapAsync('SomePlugin', ()=>{});
        })
    }
}
```

> Compiler 对象包含了 Webpack 环境所有的的配置信息，包含 options，loaders，plugins 这些信息，这个对象在 Webpack 启动时候被实例化，它是全局唯一的，可以简单地把它理解为 Webpack 实例；  
> Compilation 对象包含了当前的模块资源、编译生成资源、变化的文件等。当 Webpack 以开发模式运行时，每当检测到一个文件变化，一次新的 Compilation 将被创建。Compilation 对象也提供了很多事件回调供插件做扩展。通过 Compilation 也能读取到 Compiler 对象。  
> —— 摘自「深入浅出 Webpack」

### 常用基础插件

- [clean-webpack-plugin](https://github.com/johnagan/clean-webpack-plugin)，每次打包前先清空上一轮的打包，防止有缓存干扰。
- [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)
- [speed-measure-webpack-plugin](https://github.com/stephencookdev/speed-measure-webpack-plugin) 量化构建速度
- [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin) 压缩 JavaScript
- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) `require('webpack-bundle-analyzer').BundleAnalyzerPlugin` 打包分析工具
- [mini-css-extract-plugin]() 抽离 css
- [optimize-css-assets-webpack-plugin]() 压缩 css
- [SplitChunksPlugin](https://webpack.docschina.org/plugins/split-chunks-plugin) 代码分割
- [page-skeleton-webpack-plugin](https://github.com/ElemeFE/page-skeleton-webpack-plugin) 饿了么开源的自身生成骨架屏的 webpack 插件
- ... 见官网吧~

## 参考

- [webpack/tapable](https://github.com/webpack/tapable)
- [Webpack 的插件机制 - Tapable](https://mp.weixin.qq.com/s/qWq46-7EJb0Byo1H3SDHCg)
- [Tapable 源码实现](https://juejin.cn/post/7040982789650382855#heading-24)
- [手把手入门 webpack 插件](https://mp.weixin.qq.com/s/sbrTQb5BCtStsu54WZlPbQ)
