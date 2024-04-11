---
title: 'Webpack核心流程'
date: 2023-01-04T17:15:44+08:00
tags: [tool]
series: [wp]
draft: true
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

`debugger.js`:

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

`webpack.config.js`:

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

这是最最最基础的配置，主要关注核心流程，后续会根据需求逐步完善，Let‘s go🔥

## 核心流程

### 初始化阶段

`const complier = webpack(config)`，[./lib/webpack.js](https://github.com/webpack/webpack/blob/main/lib/webpack.js#L102)：

```js
// 部分代码省略
const webpack = (options, callback) => {
  const create = () => {
    let compiler;
    // 当callback为函数 且 watch为true 时 compiler.watch(watchOptions, callback);
    // cli 配置为 webpack --watch，作用就是检测到文件变更就会重新执行编译
    let watch = false;
    let watchOptions;
    /* MultiCompiler 部分省略，只关注核心主流程 */
    const webpackOptions = options;
    compiler = createCompiler(webpackOptions);
    watch = webpackOptions.watch;
    watchOptions = webpackOptions.watchOptions || {};
    return { compiler, watch, watchOptions };
  }
  const { compiler, watch } = create()
  return compiler;
}


const createCompiler = rawOptions => {
  const options = getNormalizedWebpackOptions(rawOptions); // 初始化基础配置,默认格式,防止后续报错
  applyWebpackOptionsBaseDefaults(options);                // 给 options 添加 context --> process.cwd()
  const compiler = new Compiler(options.context, options); // 创建 compiler
  /**
   * NodeEnvironmentPlugin 插件：主要是把 node 的文件系统 fs 做了增强并挂载到 compiler 实例上
   * 绑定 compiler.hooks.beforeRun.tap("NodeEnvironmentPlugin") 钩子执行 inputFileSystem.purge()
   */
  new NodeEnvironmentPlugin({
    infrastructureLogging: options.infrastructureLogging
  }).apply(compiler);
  /** 加载自定义配置的插件 注意这就是为什么插件都有apply方法 */
  if (Array.isArray(options.plugins)) {
    for (const plugin of options.plugins) {
      if (typeof plugin === "function") {
        plugin.call(compiler, compiler);
      } else {
        plugin.apply(compiler);
      }
    }
  }

  applyWebpackOptionsDefaults(options);   // 添加各种默认配置到options上
  compiler.hooks.environment.call();      // 触发这两个钩子，绑定的回调函数执行
  compiler.hooks.afterEnvironment.call(); // watchFileSystem 插件在这个时机添加到compiler上

  /**
   * 这里做的事情非常多：./lib/WebpackOptionsApply.js
   * 主要用于 挂载内置插件 和 注册对应时机的钩子
   */
  new WebpackOptionsApply().process(options, compiler);
  compiler.hooks.initialize.call();
  return compiler;
};
```

简单小结：初始化阶段比较简单，就是整合配置参数，创建出 `compiler` 实例，并挂载插件，注册一系列的钩子回调等。

### 构建(make)阶段

`compiler.run()`，[./lib/Compiler](https://github.com/webpack/webpack/blob/main/lib/Compiler.js)

```js
class Compiler {
  constructor(context, options = {}) {
    this.hooks = Object.freeze({
      initialize: new SyncHook([]),
      beforeRun: new AsyncSeriesHook(["compiler"]),
      run: new AsyncSeriesHook(["compiler"]),
      emit: new AsyncSeriesHook(["compilation"]),
      /*  other hooks ... */
    })
    this.webpack = webpack;
    this.root = this;
    this.options = options;
    this.context = context;
    this.idle = false;
    this.cache = new Cache();
    /*  other props ... */
  }
  run(callback) {
    if (this.running) return callback(new ConcurrentCompilationError());

    // 最终的回调，内部处理一些逻辑，如果callback存在，则会执行它并透传err和stats
    const finalCallback = (err, stats) => { /** ... */}

    const startTime = Date.now();
    this.running = true;

    // this.compile 的回调函数
    const onCompiled = () => { /** todo */ }

    const run = () => {
      this.hooks.beforeRun.callAsync(this, err => {
        if (err) return finalCallback(err);

        this.hooks.run.callAsync(this, err => {
          if (err) return finalCallback(err);

          this.readRecords(err => {
            if (err) return finalCallback(err);
            /** 调用 compile 并且把 onCompiled 作为回调函数 */
            this.compile(onCompiled);
          });
        });
      });
    };

    if (this.idle) {
      this.cache.endIdle(err => {
        if (err) return finalCallback(err);

        this.idle = false;
        run();
      });
    } else {
      run();
    }
  }
  /** 省略了错误处理和部分代码简化... */
  compile(callback) {
    // 工厂函数给后续创建module使用
    const params = {
        normalModuleFactory: this.createNormalModuleFactory(),
        contextModuleFactory: this.createContextModuleFactory()
    }
    this.hooks.beforeCompile.callAsync(params, err => {
      this.hooks.compile.call(params);
      // 创建 compilation 最终调用的是 Compilation 构造器
      const compilation = this.newCompilation(params);
      /** -------进入构建(make)阶段 ------ */
      // 触发 make 钩子 并且传入 compilation
      this.hooks.make.callAsync(compilation, err => {
        // 触发 finishMake 钩子
        this.hooks.finishMake.callAsync(compilation, err => {
          process.nextTick(() => {
            // 执行 compilation 实例上的finish方法
            compilation.finish(err => {
              // 执行 compilation 实例上的seal方法
              compilation.seal(err => {
                // 触发afterCompile函数钩子执行绑定的回调函，传入compilation实例 回调函数
                this.hooks.afterCompile.callAsync(compilation, err => {
                  // 执行传入的onCompiled回调函数，并且传入compilation实例，返回执行结果
                  return callback(null, compilation);
                });
              });
            });
          });
        });
      });
    });
  }
  /*  other funtions ... */
}
```

目前知道：`compiler.run()` 触发了 `this.compile(onCompiled)`，在 `compile` 内先获取了两个围绕 `module` 的工厂函数存为 params 变量，接着创建了单次构建的 `compilation` 实例：`new Compilation(this, params)`，然后触发 make 钩子，把 `compilation` 实例传递下去。

这部分到现在还没有看到我们的入口在哪...不得不说，webpack 把回调函数真的是玩的炉火纯青，同时注册了大量的 hooks 钩子，关于 hooks 钩子的原理稍后详细记录一下。

从 VsCode 的调用栈来看，之后进入到了 `EntryPlugin`，在这里注册了 make 钩子的回调，这个是在初始化阶段 `webpack(config)` 内 `new WebpackOptionsApply().process(options, compiler)` 时就已经注册好的，当 make 钩子被触发时进入：

```js
compiler.hooks.make.tapAsync("EntryPlugin", (compilation, callback) => {
  compilation.addEntry(context, dep, options, err => {
    callback(err);
  });
});
```

来看看 `addEntry`，[./lib/Compilation.js](https://github.com/webpack/webpack/blob/main/lib/Compilation.js)

```js
class Compilation {
  constructor(compiler, params) {
    this.hooks = Object.freeze({
      addEntry: new SyncHook(["entry", "options"]),
      seal: new SyncHook([]),
      /** other hooks ... */
    })
		this.compiler = compiler;
		this.params = params;

		const options = compiler.options;
		this.options = options;

		this.moduleGraph = new ModuleGraph(); // 存储各个module之间的关系，对于后面生成chunkGraph也要用到
		this.chunkGraph = undefined;          // 用于储存 module、chunk、chunkGroup 三者之间的关系
		this.chunkGroups = [];

		this.modules = new Set();  // module 集合, module 是由 handleModuleCreation 生成的对象，对应的是各个文件
		this.chunks = new Set();   // chunk 集合，chunk 是由一个或者多个 module 组成
    /** other props ... */
  }
  // 省略...
  // 这里的 entry 是通过 EntryPlugin.createDependency 转为的 dep
  addEntry(context, entry, optionsOrName, callback) {
    // TODO webpack 6 remove
    const options =
      typeof optionsOrName === "object"
        ? optionsOrName
        : { name: optionsOrName };

    this._addEntryItem(context, entry, "dependencies", options, callback);
  }
  /**
   * 进入 addEntry 后之后的流程大致如下：
   * compilation.addEntry => compilation._addEntryItem => compilation.addModuleTree
   * => compilation.handleModuleCreation => compilation.factorizeModule => compilation._factorizeModule
   * => NormalModuleFactory.create => compilation.addModule => compilation._addModule
   * => compilation.buildModule => compilation._buildModule
   * => normalModule.build => normalModule.doBuild => runLoaders(normalModule中的执行) => this.parser.parse(normalModule中的执行)
   */
}
```

进入 addEntry 后的流水线代码就不贴了，建议调试源码自己跑一遍才印象深刻。

简单小结：`compiler.run() `开始编译，创建 `compilation` 实例，触发 `compiler.make` 钩子让 `compilation` 开始工作；`compilation.addEntry` 将在初始化阶段通过 `EntryPlugin.createDependency` 生成的 dep 对象转成 dependencies 属性值，然后调用 `handleModuleCreation` 创建 `module`，接着 `addModule`、`buildModule`，`buildModule` 内调用 `module.build` 方法，此方法内先调用 `_doBuild` 选用合适的 loader，通过 `runLoaders` 运行相关 loader，最后执行 `this.parser.parse` 源码进行 AST 的转换，继续执行到 `this.processModuleDependencies(module, callback)` 对 module 递归进行依赖收集，循环执行 `handleModuleCreation`。

至此，make 核心就差不多了，可以看见，构建阶段主要就是围绕 module 来做一系列处理的，最终得到 `compilation.modules` 等信息。

### 生成(seal)阶段

构建阶段结束，我们可以得到 `compilation.modules` 了，接下来对这些 `modules` 进行组装变成 `chunks`，然后输出资源。

`compilation.seal` 是先封闭模块，再生成资源，这些资源保存在 `compilation.chunks` 和 `compilation.assets`。[./lib/Compilation.js](https://github.com/webpack/webpack/blob/main/lib/Compilation.js#L2780)。  
这部分代码比较长也是相当复杂的，感兴趣的去 dubug 以下最好，此处只记录重点。以下参考[compilation.seal(callback)](https://juejin.cn/post/6948950633814687758#heading-9)

```js
  // lib/compilation.js --- seal 简化代码
  class Compilation {
    seal (callback) {
      // 创建 ChunkGraph 实例
      const chunkGraph = new ChunkGraph(this.moduleGraph);
      // 触发 compilation.hooks.seal 钩子
      this.hooks.seal.call();
      // ...
      // 遍历 this.entries 入口文件创建 chunks
      for (const [name, { dependencies, includeDependencies, options }] of this.entries) {/** ... */}
      // 创建 chunkGraph moduleGraph
      buildChunkGraph(this, chunkGraphInit);
      // 触发优化钩子
      this.hooks.optimize.call();

      // 执行各种优化modules钩子
      while (this.hooks.optimizeModules.call(this.modules)) {
        /* empty */
      }
      // 执行各种优化chunks钩子
      while (this.hooks.optimizeChunks.call(this.chunks, this.chunkGroups)) {
        // 触发几个比较重要的钩子
        // 触发压缩 chunks  MinChunkSizePlugin 插件
        compilation.hooks.optimizeChunks.tap( { name: "MinChunkSizePlugin", stage: STAGE_ADVANCED }, chunks => {})
        // 触发根据 split 切割 chunks 插件
        compilation.hooks.optimizeChunks.tap( { name: "SplitChunksPlugin", stage: STAGE_ADVANCED }, chunks => {})
        /* empty */
      }
      // ...省略代码

      // 优化modules树状结构
      this.hooks.optimizeTree.callAsync(this.chunks, this.modules, err => {
        this.hooks.optimizeChunkModules.callAsync(this.chunks, this.modules, err => {
          // 各种优化钩子

          // 生成module的hash 分为 hash、contentHash、chunkHash
          this.createModuleHashes();
          // 调用codeGeneration方法用于生成编译好的代码
          this.codeGeneration(err => {
            // 生成chunk的Hash
            const codeGenerationJobs = this.createHash();

            // 执行生成代码方法
            this._runCodeGenerationJobs(codeGenerationJobs, err => {
              // 执行 (NormalModule)module.codeGeneration 生成源码
              // 这个其中又会涉及到 大致5模板用于生成代码
              // Template.js
              // MainTemplate.js
              // ModuleTemplate.js
              // RuntimeTemplate
              // ChunkTemplate.js
              this._codeGenerationModule(module, runtime, runtimes, hash, dependencyTemplates, chunkGraph, moduleGraph, runtimeTemplate, errors, results, callback)

              // 清除资源
              this.clearAssets();

              // 创建module资源
              this.createModuleAssets() {
                compilation.hooks.moduleAsset.call(module, fileName);
              };

              // 创建chunk资源
              this.createChunkAssets(callback) {
                // 开始输出资源
                this.emitAsset(file, source, assetInfo);
              }
            })
          })
        })
      })
    }
  }
```

在执行完成 `compilation.emitAsset` 后会回到 `compiler` 文件中执行代码如下：

```js
// lib/compiler.js
class Compiler {
  /** 最终执行这个方法 */
  emitAssets () {
    let outputPath;
    // 输出打包结果文件的方法
    const emitFiles = err => {
      // ...
    };
    // 触发compiler.hooks.emit钩子
    // 触发CleanPlugin中绑定的函数
    // 触发LibManifestPlugin中绑定的函数 生成lib包
    this.hooks.emit.callAsync(compilation, err => {
      if (err) return callback(err);
      // 获取输出路径
      outputPath = compilation.getPath(this.outputPath, {});
      // 递归创建输出目录，并输出资源
      mkdirp(this.outputFileSystem, outputPath, emitFiles);
    });
  }
  compile(callback) {
    // 省略代码
    // 执行完成seal 代码封装，就要输出封装好的文件
    compilation.seal(err => {
      // 触发钩子
      this.hooks.afterCompile.callAsync(compilation, err => {
        // 执行run函数中传入的onCompiled
        return callback(null, compilation);
      });
    });
  }
  run (callback) {
    // 省略代码
    // emit入口
    const onCompiled = (err, compilation) => {
      process.nextTick(() => {
        // 执行shouldEmit钩子上的方法，若返回false则不输出构建资源
        if (this.hooks.shouldEmit.call(compilation) === false) {
          // stats包含了本次构建过程中的一些数据信息
          const stats = new Stats(compilation);
          stats.startTime = startTime;
          stats.endTime = Date.now();
          // 执行done钩子上的方法，并传入stats
          this.hooks.done.callAsync(stats, err => {
            if (err) return finalCallback(err);
            return finalCallback(null, stats);
          });
          return;
        }
        // 执行 Compiler.emitAssets 输出资源
        this.emitAssets(compilation, err => {
          // 执行shouldEmit钩子上的方法，若返回false则不输出构建资源
          if (compilation.hooks.needAdditionalPass.call()) {
            // compilation上添加属性
            compilation.needAdditionalPass = true;
            compilation.startTime = startTime;
            compilation.endTime = Date.now();
            // 实例化Stats类
            const stats = new Stats(compilation);
            // 触发compiler.hooks.done钩子
            this.hooks.done.callAsync(stats, err => {
              this.hooks.additionalPass.callAsync(err => {
                this.compile(onCompiled);
              });
            });
          }
          // 输出构建记录
          this.emitRecords(err => {
            const stats = new Stats(compilation);
            // 执行compiler.hooks.done钩子
            this.hooks.done.callAsync(stats, err => {
              if (err) return finalCallback(err);
              this.cache.storeBuildDependencies(
                compilation.buildDependencies,
                err => {
                  if (err) return finalCallback(err);
                  return finalCallback(null, stats);
                }
              );
            });
          });
        });
      });
    };
    // 运行compiler.run
    const run = () => {
      this.compile(onCompiled);
    }
  }
}
```

---

## 总结

三个阶段：

1. 初始化阶段

   - `webpack(config)` 接收配置参数(来自配置文件或 shell 传参，用 yargs 解析并合并) 来创建 `compiler` 实例
   - 挂载 NodeEnvironmentPlugin 插件，fs 文件系统到 `compiler` 实例上
   - 挂载 options 中的 **自定义配置** 的插件到 `compiler` 实例上
   - 挂载 webpack 的基础内置插件，同时注册一系列的钩子回调，比如在 `EntryPlugin` 中注册了 `make` 钩子。详细见`new WebpackOptionsApply().process(options, compiler);`

2. 构建(make)阶段

   - `compiler.run()` 进入模块编译阶段
   - 创建 `compilation` 实例，触发 `hooks.make` 钩子，`compilation` 开始工作，调用 `compilation.addEntry` 从入口文件依赖开始构建 module
   - 通过 `handleModuleCreation` 来创建的 `module`
   - 有了 `module` 后调用工厂函数的 `build` 方法，期间执行 `doBuild` 调用 loader 解析模块为 js 脚本，然后调用 `parser.parse` 转为 AST 并进行依赖收集
     - 在 `HarmonyExportDependencyParserPlugin` 插件监听 `exportImportSpecifier` 钩子(识别 require/import 语句)，解读 JS 文本对应的资源依赖
     - 调用 module 对象的 addDependency 方法将依赖对象加入到 module 依赖列表中
   - 继续执行到 `this.processModuleDependencies(module)` 看 module 是否还有其他的依赖，如果有，递归执行 `handleModuleCreation`

3. 生成(emit)阶段 - 围绕 chunk
   - `compilation.seal` 生成 chunk
     - 构建 `ChunkGraph` 对象
     - 遍历 `compilation.modules` 集合，记录 module 与 chunk 的关系，按照 `entry/动态引入` 的规则把 module 分配给不同的 chunk 对象
     - 调用 `createModuleAssets/createChunkAssets` 分别遍历 `module/chunk` 把 `assets` 信息记录到 `compilation.assets` 对象中
   - 触发 seal 回调后，调用`compilation.emitAsset`，根据配置路径和文件名，写入文件系统

---

附上两张网上的图，便于理解：

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202301031450002.png)

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202301171730205.png)

用于总结 module 和 chunk

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202301021511242.png)

## 补充：易混淆知识点

1. module, chunk, bundle

   - module：构建阶段，通过 `handleModuleCreation` 创建的，对应的是每个文件
   - chunk：打包阶段生成的对象，遍历 `compilation.modules` 后，每个 chunk 都被分配了相应的 module
   - bundle：最终输出的代码，是可以直接在浏览器中执行的
     ![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202301030941740.png)

     > 一般来讲，一个 chunk 产生一个 bundle，产生 chunk 的途径：
     >
     > 1. entry，注意数组的 entry 只会产生一个，以对象形式，一个入口文件链路一个 chunk
     > 2. 异步加载模块(动态加载)
     > 3. 代码分割
     >
     > Webpack 5 之后，如果 entry 配置中包含 runtime 值，则在 entry 之外再增加一个专门容纳 runtime 的 chunk 对象，此时可以称之为 runtime chunk。

2. filename, chunkFilename
   - output.filename：列在 entry 中，打包后输出的文件的名称，是根据 entry 配置推断出的
   - output.chunkFilename：未列在 entry 中，却又需要被打包出来的文件的名称，如果没有显示指定，默认为 chunk 的 id，往往需要配合魔法注释使用，如：  
     `import(/* webpackChunkName: "lodash" */ 'lodash')`
3. hash, chunkhash, contenthash
   这个可以顾名思义。首先 hash 是随机唯一的，它的作用是一般是用来结合 CDN 处理缓存的，当文件发生改变，hash 也就变化，触发 CDN 服务器去源服务器拉取数据，更新本地缓存。它们三个就是触发文件 hash 变化的条件不同：`[name].[hash].js` 计算的是整个项目的构建；chunkhash 计算的是 chunk；contenthash 计算的是内容。

## 补充: Tapable 见 [webpack 之 plugin](https://yokiizx.site/posts/tool/webpack%E4%B9%8Bplugin/)

## 参考

- [webpack 官网](https://webpack.js.org/)
- [webpack5 知识体系图谱](https://gitmind.cn/app/docs/m1foeg1o)
- [webpack 中容易混淆的 5 个知识点](https://mp.weixin.qq.com/s/kPGEyQO63NkpcJZGMD05jQ)
- [深度剖析 VS Code JavaScript Debugger 功能及实现原理](https://juejin.cn/post/7109006440039350303#heading-4)
- [yargs](https://github.com/yargs/yargs)
- [webpack 编译流程详解](https://juejin.cn/post/6948950633814687758)
- [webpack 总结](https://xie.infoq.cn/article/ddca4caa394241447fa0aa3c0)
