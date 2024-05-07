---
title: 'Rollup'
date: 2022-09-21T17:15:49+08:00
tags: [rollup]
---

## Rollup 的六种输出

- [官网例子](https://rollupjs.org/repl/)
- [说不清 rollup 能输出哪 6 种格式 😥 差点被鄙视](https://juejin.cn/post/7051236803344334862)

## 插件支持

- [Plugin Development](https://rollupjs.org/plugin-development/)

### 常用插件

> [官方推荐插件列表](https://github.com/rollup/awesome)

基础必要的插件：

- [@rollup/plugin-node-resolve](https://www.npmjs.com/package/@rollup/plugin-node-resolve)，node 解析算法，辅助模块引入
- [@rollup/plugin-commonjs](https://www.npmjs.com/package/@rollup/plugin-commonjs)，辅助 CJS 的模块引入
- [@rollup/plugin-babel](https://www.npmjs.com/package/@rollup/plugin-babel)，具体集成方式参见官网：[rollup - babel](https://rollupjs.org/tools/#babel)
- [@rollup/plugin-typescript](https://www.npmjs.com/package/@rollup/plugin-typescript)，按照残酷要求安装所有包后，`tsc --init` 初始化 ts 配置文件
- [@babel/preset-typescript](https://www.npmjs.com/package/@babel/preset-typescript)，
- [@rollup/plugin-terser](https://www.npmjs.com/package/@rollup/plugin-terser)

个人常用的的插件：

- [@rollup/plugin-alias](https://www.npmjs.com/package/@rollup/plugin-alias)
- [@rollup/plugin-run](https://www.npmjs.com/package/@rollup/plugin-run)
- [rollup-plugin-serve](https://www.npmjs.com/package/rollup-plugin-serve)

- [rollup-plugin-less](https://www.npmjs.com/package/rollup-plugin-less)
- [@rollup/plugin-json](https://www.npmjs.com/package/@rollup/plugin-json)
  question：即使装了插件，这么导入 `import pkg from './package.json'` 也会报错，需要按照下面方式导入：
  ```JS
  import { readFileSync } from 'fs'
  // now, read package.json like this:
  const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
  ```
- [@rollup/plugin-image](https://www.npmjs.com/package/@rollup/plugin-image)
- [@rollup/plugin-url](https://www.npmjs.com/package/@rollup/plugin-url)
- [@rollup/plugin-strip](https://www.npmjs.com/package/@rollup/plugin-strip)，移出 `debugger` 类的语句，如：`console.log()`

<details>
<summary>@rollup/plugin-run和rollup-plugin-serve和rollup-plugin-liveload</summary>

1. `@rollup/plugin-run `：用于在打包完成后自动运行生成的代码（包括命令行工具和服务等），可以帮助开发者快速地运行和测试项目。比如，你可以在 npm script 中使用这个插件来启动构建后的打包文件。
2. `rollup-plugin-serve` ：用于在开发过程中实时地提供一个 Web 服务器，可以使开发者在本地预览调试代码，具有文件监听、自动刷新等功能。
3. `rollup-plugin-liveload` ：也是用于实现实时预览和自动刷新的插件，但与 rollup-plugin-serve 不同的是，它并不包含 Web 服务器，而是会打开指定的 HTML 文件，并在其中注入一个 WebSocket 客户端来实现实时刷新的效果。

因此，这三个插件的主要区别在于它们的作用和使用方式。`@rollup/plugin-run` 是一个命令行工具，可以在打包后自动运行生成的代码，`rollup-plugin-serve` 和 `rollup-plugin-liveload` 则都是用于开发过程中的实时预览和自动刷新，但 `rollup-plugin-serve` 提供了一个 Web 服务器，而 `rollup-plugin-liveload` 则需要手动在 HTML 文件中添加 WebSocket 客户端代码。

举个例子：

```JS
const isProduction = process.env.NODE_ENV === 'production'
const pluginsWithEnv = isProduction ? [] : [serve({
  open: true,
  openPage: '/base/',
  port: 8888,
  contentBase: ['dist', 'examples']
}), livereload('dist/umd')]

// 最后可以把 pluginsWithEnv 解构到 plugins 中.
```

</details>

### 集成 esbuild （只支持转换成 es6 及以后）

- [rollup-plugin-esbuild](https://github.com/egoist/rollup-plugin-esbuild)，这个插件可以取代上面的: `@babel/preset-typescript` & `@rollup/plugin-terser`。

## 自定义 rollup 一般模板

准备了一个极简的 rollup 模板：

- [rollup-template](https://github.com/yokiizx/rollup-template)

> 注意：
>
> - 一般 esm 格式，为了支持按需引入，构建过程只编译，不打包；需要 `.d.ts` 文件；可以使用 ESB
> - umd 格式更多的被用在 cdn 加载，所以构建物不仅需要编译，还需要打包；无需 `.d.ts` 文件

## reference

- [打包工具 rollup.js 入门教程](https://www.ruanyifeng.com/blog/2022/05/rollup.html)
- [rollup 最佳实践！可调试、编译的小型开源项目思路](https://mp.weixin.qq.com/s/nnZFbNpLnrgfcsi1_y3rrA)
- [一文入门 rollup🪀！13 组 demo 带你轻松驾驭](https://juejin.cn/post/7069555431303020580)
- [How to fix "\_\_dirname is not defined in ES module scope"](https://flaviocopes.com/fix-dirname-not-defined-es-module-scope/)
