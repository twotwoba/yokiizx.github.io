---
title: 'Webpack核心流程'
date: 2023-01-04T17:15:44+08:00
tags: [engineer]
---

**本文基于 webpack5，不说废话**

> [webpack 官网](https://webpack.js.org/)

## 调试

一般调试 npm 包，使用 `npm link` 创建软链的方式进行 debug。这里单纯调试 Node， 一般也有两种方式：

- Chrome devtools -- [Node 官网 debugger](https://nodejs.org/dist/latest-v14.x/docs/api/debugger.html#debugger_debugger)
  1. terminal 输入命令： `node inspect xxx.js`
  2. chrome 浏览器输入：`chrome://inspect`
  3. 点击 `Open dedicated DevTools for Node` 就能进行 node 的调试了
- VsCode debugger（推荐） -- [microsoft/vscode-js-debug](https://github.com/microsoft/vscode-js-debug)；[VsCode 官网 debugger](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)
  1. 禁用插件 `@builtin @id:ms-vscode.js-debug`
  2. 启用插件 `@id:ms-vscode.js-debug-nightly`
  3. `cmd + shift + p`：输入 `debug`，选择合适的 debug 策略即可

---

前期准备：

```sh
# 克隆 webpack 的 main 分支到本地，cloneb 是我配置的别名
g cloneb main https://github.com/webpack/webpack.git
# yarn 安装依赖
yarn
# ------ 创建调试目录并初始化 -----
cd webpack && mkdir debug_webpack1; cd $_ && npm init -y
# 进入文件夹创建测试文件和配置文件
touch index.js a.js b.js debugger.js webpack.config.js
```

其中 `index.js` 为入口文件，`a.js`，`b.js` 都是平时写的代码，主要用来进行测试打包过程的，可以随意发挥。
debugger.js:

```js
const webpack = require('../lib/webpack.js');
const config = require('./webpack.config,js');
// 创建一个complier对象
const complier = webpack(config);
// 执行compiler.run方法开始编译代码，回调方法用于反馈编译的状态
complier.run((err, stats) => {
  // 如果运行时报错输出报错
  if (err) {
    console.error(err);
  } else {
    // stats webpack内置的编译信息对象
    console.log(stats);
  }
});
```

webpack.config.js:

```js
const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  }
};
```

在 webpack 源码任意你想了解的地方打断点，就可以进入调试流程了，需要注意的是，最好 watch 以下三个对象：`compiler`,`compilation`,`options`，帮助定位触发钩子的回调函数。

这是最最最基础的配置，主要关注核心流程，后续会根据需求逐步完善，let‘s go🔥

## 核心流程

webpack 导出的一个函数：

```JavaScript

```

> 你可以在这里看到 webpack.js 的源码 -- [./lib/webpack.js](https://github.com/webpack/webpack/blob/main/lib/webpack.js#L102)

---

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202301031450002.png)

webpack 的主要目的是根据依赖图打包产出，有以下阶段：

1. 初始化阶段

   - 从配置文件或 shell 命令中读取配置参数并与默认配置合并，然后用来创建 `complier` 对象。
   - 遍历用户自定义配置的插件集合，执行插件的 `apply` 方法
   - `new WebpackOptionsApply().process`，加载内置插件，比如处理 entry 配置、devtool 配置的插件等
   - 至此创建完了 `coompiler` 对象，接着调用 `complier.compile` 来开始编译

2. 构建(make)阶段 - 围绕 module

   - 根据 entry 确定入口文件，调用 `complier.addEntry` 将入口文件转为 `dependence对象`，之后调用 `handleModuleCreate` 来创建 `module`
   - 使用相应的 `loader` 把刚创建的 `module` 进行转义成可以被 `acorn` 编译的 JavaScript 脚本(babel 用的那个)
   - 对转译后的 AST 进行遍历，触发各种钩子
     - 在 `HarmonyExportDependencyParserPlugin` 插件监听 `exportImportSpecifier` 钩子(识别 require/import 语句)，解读 JS 文本对应的资源依赖
     - 调用 module 对象的 addDependency 方法将依赖对象加入到 module 依赖列表中
   - 把经由 AST 遍历后新增的依赖调用 module 的`handleParseResult`函数， `handleModuleCreate` 回到了第一步，递归这个流程，直到所有依赖都被处理记过，构建出 `ModuleDependencyGraph`

3. 生成(emit)阶段 - 围绕 chunk
   - `compilation.seal` 生成 chunk
     - 构建 `ChunkGraph` 对象
     - 遍历 `compilation.modules` 集合，记录 module 与 chunk 的关系，按照 `entry/动态引入` 的规则把 module 分配给不同的 chunk 对象
     - 调用 `createModuleAssets/createChunkAssets` 分别遍历 `module/chunk` 把 `assets` 信息记录到 `compilation.assets` 对象中
   - 触发 seal 回调后，调用`compilation.emitAsset`，根据配置路径和文件名，写入文件系统
     ![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202301021511242.png)

将 moudle 组织成 chunk 的默认规则：

- entry 及 entry 触达到的模块，组合成一个 chunk
- 使用动态引入语句引入的模块，各自组合成一个 chunk

---

`webpack/lib/compiler.js`

```JavaScript
compile(callback) {
    const params = this.newCompilationParams();
    this.hooks.beforeCompile.callAsync(params, err => {
      // ...
      const compilation = this.newCompilation(params);
      this.hooks.make.callAsync(compilation, err => {
        // ...
        this.hooks.finishMake.callAsync(compilation, err => {
          // ...
          process.nextTick(() => {
            compilation.finish(err => {
              compilation.seal(err => {...});
            });
          });
        });
      });
    });
  }
```

> 此方法在 `compiler.run` 和 `compiler.watch` 内触发，分别对应 初始化 和 更新 阶段

## loader

打包非 JS 和 JSON 格式的文件，需要使用 `loader` 来转换一下，在构建阶段，所有 module 都会被对应的 loader 转成可以被 `acorn` 转译的 JS 脚本。

所以这也是为什么在配置时，loader 的配置是在 module 内的：

```JavaScript
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['loaderA', 'loaderB', 'loaderC']
      }
    ]
  }
}
```

一个小知识点，loader 总是从右往左调用的，但是，在实际执行之前，会先**从左到右**调用 loader 的 `pitch` 方法，如果某个 loader 在 pitch 方法中给出一个结果，那么这个过程会回过身来，并跳过剩下的 loader，详细见[Loader Interface](https://webpack.docschina.org/api/loaders/)。

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202301051444588.png)

## plugin

webpack 构建过程中，会在特定的时机广播对应的事件，插件监听这些事件，在特定时间点介入编译过程。

通常，webpack 插件是一个带有 `apply` 方法的类：

```JavaScript
class SomePlugin {
    apply(compiler) {
    }
}
```

apply 虽然是一个函数，但是从设计上就只有输入，webpack 不 care 输出，所以在插件中只能通过调用类型实体的各种方法来或者更改实体的配置信息，变更编译行为。例如：

- compilation.addModule ：添加模块，可以在原有的 module 构建规则之外，添加自定义模块
- compilation.emitAsset：直译是“提交资产”，功能可以理解将内容写入到特定路径
- ...

apply 函数运行时会得到参数 compiler ，以此为起点可以调用 hook 对象注册各种钩子回调，例如：compiler.hooks.make.tapAsync ，这里面 make 是钩子名称，tapAsync 定义了钩子的调用方式，webpack 的插件架构基于这种模式构建而成，插件开发者可以使用这种模式在钩子回调中，插入特定代码。webpack 各种内置对象都带有 hooks 属性，比如 compilation 对象：

```JavaScript
class SomePlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('SomePlugin', (compilation) => {
            compilation.hooks.optimizeChunkAssets.tapAsync('SomePlugin', ()=>{});
        })
    }
}
```

钩子的核心逻辑定义在 Tapable 仓库，内部定义了如下类型的钩子：

```JavaScript
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
 } = require("tapable");
```

## 易混淆知识点

1. module, chunk, bundle

   - module：构建阶段，通过 `handleModuleCreate` 创建的，简单点来说也可以认为是每个文件
   - chunk：打包阶段生成的对象，遍历 `compilation.modules` 后，每个 chunk 都被分配了相应的 module
   - bundle：最终输出的代码，是可以直接在浏览器中执行的
     ![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202301030941740.png)

     > 一般来讲，一个 chunk 产生一个 bundle，产生 chunk 的途径：
     >
     > 1. entry，注意数组的 entry 只会产生一个，以对象形式，一个入口文件链路一个 chunk
     > 2. 异步加载模块
     > 3. 代码分割
     >
     > Webpack 5 之后，如果 entry 配置中包含 runtime 值，则在 entry 之外再增加一个专门容纳 runtime 的 chunk 对象，此时可以称之为 runtime chunk。

2. filename, chunkFilename
   - output.filename：列在 entry 中，打包后输出的文件的名称，是根据 entry 配置推断出的
   - output.chunkFilename：未列在 entry 中，却又需要被打包出来的文件的名称，如果没有显示指定，默认为 chunk 的 id，往往需要配合魔法注释使用，如`import(/* webpackChunkName: "lodash" */ 'lodash')`
3. hash, chunkhash, contenthash
   这个可以顾名思义。首先 hash 是随机唯一的，它的作用是一般是用来结合 CDN 处理缓存的，当文件发生改变，hash 也就变化，触发 CDN 服务器去源服务器拉取数据，更新本地缓存。它们三个就是触发文件 hash 变化的条件不同：`[name].[hash].js` 计算的是整个项目的构建；chunkhash 计算的是 chunk；contenthash 计算的是内容。

## HMR

webpack-dev-server 启动服务后，当文件发生了变动，会触发重新构建，让我们专注于 coding，但是如果不做任何配置，它会刷新页面导致丢失掉应用状态，为此，webpack 提供了 hot module replacement 即 HMR 热更新。
![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202301031437536.png)

TODO

<!-- - webpack compiler： watch 打包文件，写入内存
- bundle server：启动本地服务，供浏览器使用
- HMR server：将热更新的文件输出给 HMR runtime
- HMR runtime：把生成的问加你注入到浏览器内存
- Bundle：构建输出文件 -->

> [模块热替换(hot module replacement)](https://webpack.docschina.org/concepts/hot-module-replacement/)

## 代码分割 split chunk

## tree shaking

## externals

抽离框架、库之类的依赖到 CDN，相比抽离成 dll 文件，CDN 更加优秀。

## 一套基本配置

TODO，想了想，好像没必要写这个...根据自己的业务去配，不清楚的官网或者 google，这没什么难度，就暂时不写了，有闲余时间再整理一下吧 👻

## 参考

- [webpack 官网](https://webpack.js.org/)
- [Tecvan webpack 专栏](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=Mzg3OTYwMjcxMA==&action=getalbum&album_id=1856066636768722949&scene=173&from_msgid=2247483744&from_itemidx=1&count=3&nolastread=1#wechat_redirect)
- [webpack5 知识体系图谱](https://gitmind.cn/app/docs/m1foeg1o)
- [webpack 中容易混淆的 5 个知识点](https://mp.weixin.qq.com/s/kPGEyQO63NkpcJZGMD05jQ)
- [HMR 机制](https://mp.weixin.qq.com/s/GlwGJ4cEe-1FgWW4EVpG_w)
- [split chunk 分包机制](https://mp.weixin.qq.com/s/YjzcmwjI-6D8gyIkZF0tVw)
- [手把手入门 webpack 插件](https://mp.weixin.qq.com/s/sbrTQb5BCtStsu54WZlPbQ)
- [深度剖析 VS Code JavaScript Debugger 功能及实现原理](https://juejin.cn/post/7109006440039350303#heading-4)
