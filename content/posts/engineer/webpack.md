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

##### 初始化阶段

`const complier = webpack(config)`，[./lib/webpack.js](https://github.com/webpack/webpack/blob/main/lib/webpack.js#L102)：

```JavaScript
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
  /** 加载自定义配置的插件 */
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

简单小结：初始化阶段，就是整合配置参数，创建出 `compiler` 实例，并挂载插件，注册一系列的钩子回调等。

##### 构建阶段

`compiler.run()`，[./lib/Compiler](https://github.com/webpack/webpack/blob/main/lib/Compiler.js)

```JavaScript
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

```JavaScript
compiler.hooks.make.tapAsync("EntryPlugin", (compilation, callback) => {
  compilation.addEntry(context, dep, options, err => {
    callback(err);
  });
});
```

来看看 `addEntry`，[./lib/Compilation.js](https://github.com/webpack/webpack/blob/main/lib/Compilation.js)

```JavaScript
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

至此，make 核心就差不多了，可以看见，构建阶段主要就是围绕 module 来做一系列处理的，最终得到 modules，moduleGraph 等信息。

##### 生成阶段

构建阶段结束，我们可以得到 modules 了，接下来对这些 module 进行组装，然后输出。

`compilation.seal` 是先封闭模块，再生成资源，这些资源保存在 `compilation.assets`。[./lib/Compilation.js](https://github.com/webpack/webpack/blob/main/lib/Compilation.js#L2780)。这部分代码比较长也是相当复杂的，感兴趣的去 dubug 以下最好，此处只记录重点。

---

##### 总结

三个阶段：

1. 初始化阶段

   - `webpack(config)` 接收配置参数(来自配置文件或 shell 传参，用 yargs 解析并合并) 来创建 `compiler` 实例
   - 挂载 NodeEnvironmentPlugin 插件，fs 文件系统到 `compiler` 实例上
   - 挂载 options 中的 **自定义配置** 的插件到 `compiler` 实例上
   - 挂载 webpack 的基础内置插件，同时注册一系列的钩子回调，比如在 `EntryPlugin` 中注册了 `make` 钩子。详细见`new WebpackOptionsApply().process(options, compiler);`

[ ] Tapable 原理

2. 构建(make)阶段

   - `compiler.run()` 进入模块编译阶段
   - 创建 `compilation` 实例，触发 hooks.make 钩子，`compilation` 开始工作，调用 `compilation.addEntry` 从入口文件依赖开始构建 module
   - 通过 `handleModuleCreation` 来创建的 `module`
   - 有了 `module` 后调用工厂函数的 `build` 方法，期间会先后调用 `doBuild` 调用 `loader`，然后调用 `parser.parse` 转为 AST 并进行依赖收集
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

附上两张图，便于理解：

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202301031450002.png)

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202301171730205.png)

用于总结 module 和 chunk

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202301021511242.png)

这个图需要整理
![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202301181152629.png)

3. 生成(emit)阶段 - 围绕 chunk
   - `compilation.seal` 生成 chunk
     - 构建 `ChunkGraph` 对象
     - 遍历 `compilation.modules` 集合，记录 module 与 chunk 的关系，按照 `entry/动态引入` 的规则把 module 分配给不同的 chunk 对象
     - 调用 `createModuleAssets/createChunkAssets` 分别遍历 `module/chunk` 把 `assets` 信息记录到 `compilation.assets` 对象中
   - 触发 seal 回调后，调用`compilation.emitAsset`，根据配置路径和文件名，写入文件系统

将 moudle 组织成 chunk 的默认规则：

- entry 及 entry 触达到的模块，组合成一个 chunk
- 使用动态引入语句引入的模块，各自组合成一个 chunk

---

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

- compilation.addModule：添加模块，可以在原有的 module 构建规则之外，添加自定义模块
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

##### 基础常用插件

- [clean-webpack-plugin](https://github.com/johnagan/clean-webpack-plugin)，每次打包前先清空上一轮的打包，防止有缓存干扰。

## 易混淆知识点

1. module, chunk, bundle

   - module：构建阶段，通过 `handleModuleCreation` 创建的，对应的是每个文件
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

## 参考

- [webpack 官网](https://webpack.js.org/)
- [Tecvan webpack 总结](https://zhuanlan.zhihu.com/p/363928061)
- [webpack5 知识体系图谱](https://gitmind.cn/app/docs/m1foeg1o)
- [webpack 中容易混淆的 5 个知识点](https://mp.weixin.qq.com/s/kPGEyQO63NkpcJZGMD05jQ)
- [HMR 机制](https://mp.weixin.qq.com/s/GlwGJ4cEe-1FgWW4EVpG_w)
- [split chunk 分包机制](https://mp.weixin.qq.com/s/YjzcmwjI-6D8gyIkZF0tVw)
- [手把手入门 webpack 插件](https://mp.weixin.qq.com/s/sbrTQb5BCtStsu54WZlPbQ)
- [深度剖析 VS Code JavaScript Debugger 功能及实现原理](https://juejin.cn/post/7109006440039350303#heading-4)
- [yargs](https://github.com/yargs/yargs)
- [webpack 编译流程详解](https://juejin.cn/post/6948950633814687758)
