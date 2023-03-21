---
title: 'Rollup'
date: 2022-09-21T17:15:49+08:00
tags: [engineer]
---

## Rollup 的六种输出

- [官网例子](https://rollupjs.org/repl/)
- [说不清 rollup 能输出哪 6 种格式 😥 差点被鄙视](https://juejin.cn/post/7051236803344334862)

## 插件支持

- [Plugin Development](https://rollupjs.org/plugin-development/)

##### 常用插件

> [官方推荐插件列表](https://github.com/rollup/awesome)

一些必要的插件：

- [@rollup/plugin-commonjs](https://www.npmjs.com/package/@rollup/plugin-commonjs)，把 CJS 转为 ESM，es 模块可以直接导入 CJS 的导出
- [@rollup/plugin-node-resolve](https://www.npmjs.com/package/@rollup/plugin-node-resolve)，node 解析算法，使用 `node_modules` 中的外部模块。（集成 babel 时也需要的）
- [@rollup/plugin-babel](https://www.npmjs.com/package/@rollup/plugin-babel)，具体集成方式参见官网：[rollup - babel](https://rollupjs.org/tools/#babel)
- [@rollup/plugin-typescript](https://www.npmjs.com/package/@rollup/plugin-typescript)

个人常用的的插件：

- [@rollup/plugin-alias](https://www.npmjs.com/package/@rollup/plugin-alias)，目录别名
- [@rollup/plugin-url](https://www.npmjs.com/package/@rollup/plugin-url)，类似于 webpack 的 url-loader
- [@rollup/plugin-strip](https://www.npmjs.com/package/@rollup/plugin-strip)，移出 `debugger` 类的语句，如：`console.log()`

## 自定义 rollup 一般开发模板

TODO

## reference

- [打包工具 rollup.js 入门教程](https://www.ruanyifeng.com/blog/2022/05/rollup.html)
- [rollup 最佳实践！可调试、编译的小型开源项目思路](https://mp.weixin.qq.com/s/nnZFbNpLnrgfcsi1_y3rrA)
- [一文入门 rollup🪀！13 组 demo 带你轻松驾驭](https://juejin.cn/post/7069555431303020580)
- [How to fix "\_\_dirname is not defined in ES module scope"](https://flaviocopes.com/fix-dirname-not-defined-es-module-scope/)
