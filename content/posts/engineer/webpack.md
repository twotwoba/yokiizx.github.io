---
title: 'Webpack'
date: 2022-09-21T17:15:44+08:00
tags: [engineer]
---

**本文基于 webpack5**

## 前言

webpack - JS 静态模块打包工具。

痛点：难学~，因为它现在真的太庞大了 👻，知识点：模块打包、代码分割、按需加载、HMR、Tree-shaking、文件监听、sourcemap、Module Federation、devServer、DLL、多进程等等，学习成本比较高。

武林高手比的是内功而非招法，万变不离其宗，以无招胜有招，从 webpack 构建的核心流程、loader、plugin 三方面来重点学习一下。

开始之前，默认对 [webpack 基础概念](https://webpack.docschina.org/concepts/) 有一定的了解。

## 核心流程

webpack 的主要目的是根据依赖图打包 bundle 产出，主要分为以下阶段：

1. 初始化阶段

   - 从配置文件,shell 命令中读取配置参数与默认配置合并，然后用来创建 `complier` 对象。
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

```JavaScript
// webpack/lib/compiler.js
// 此方法由 compiler.run 和 compiler.watch 触发，分别对应初始化和更新阶段
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

## loader

打包非 JS 和 JSON 格式的文件，需要使用 loader 来转换一下，在构建阶段，所有 module 都会被对应的 loader 转成可以被 `acorn` 转译的 JS 脚本。

## plugin

webpack 插件通常是一个带有 `apply` 方法的类：

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

## 参考

- [webpack 官网](https://webpack.js.org/)
- [webpack 核心原理](https://mp.weixin.qq.com/s/_Hyn_sb8mki6aYTXwVZe6g)
- [webpack5 知识体系](https://gitmind.cn/app/docs/m1foeg1o)
