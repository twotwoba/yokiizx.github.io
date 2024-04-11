---
title: 'Webpack之琐碎知识点'
date: 2023-01-30T10:54:44+08:00
tags: [tool]
series: [wp]
draft: true
---

## HMR

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202301301743084.png)

webpack-dev-server 启动服务后，当文件发生了变动，会触发重新构建，让我们专注于 coding，但是如果不做任何配置，它会刷新页面导致丢失掉应用状态，为此，webpack 提供了 hot module replacement 即 HMR 热更新。

1. 当文件发生变化后，`webpack` 会重新打包，打包完成后，发布 `done` 事件。
2. done`回调函数执行，通过服务端与客户端建立的长连接发送`hash` 值到客户端。
3. 客户端收到 `hash` 值之后，确认是否要更新。如果更新，则会通过 `Ajax` 去请求 `manifest.json` 文件，该文件记录了所有发生变动的模块。
4. 通过 `manifest.json` 文件，客户端使用 `jsonp` 方式去拉取每一个变动模块的最新代码。
5. 客户端更新模块，加入了 3 个属性：`parents、children、hot`。
6. 通过模块 `id` 找到父模块中所有依赖该模块的回调函数并执行。
7. 页面自动更新，热替换完成

> [manifest](https://webpack.docschina.org/concepts/manifest/#manifest)  
> [模块热替换(hot module replacement)](https://webpack.docschina.org/concepts/hot-module-replacement/)

## split chunk

讲代码分割的方式之前，先回顾一下 chunk 形成的途径，一共有三种：

- entry 配置，一个入口文件链路对应一个 chunk
- 动态引入 `import()`
- optimization.splitChunks

我们平时说的代码分割优化指的就是第三种 `optimization.splitChunks`，一般配置长这样：

```js
module.exports = {
  optimization:{
    splitChunks:{
      cacheGroups:{
        vendors:{
            chunks:'initial',//指定分割的类型，默认3种选项 all async initial
            name:'vendors',//给分割出去的代码块起一个名字叫vendors
            test:/node_modules/,//如果模块ID匹配这个正则的话，就会添加一vendors代码块
            priority:-10 //优先级
        },
        commons:{
            chunks:'initial',
            name:'commons',
            minSize:0,//如果模块的大小大于多少的话才需要提取
            minChunks:2,//最少最几个chunk引用才需要提取
            priority:-20
        }
      }
    }
  }
}
```

> 详细配置见官网[split-chunks-plugin](https://webpack.docschina.org/plugins/split-chunks-plugin)

## tree shaking

tree shaking 基于 ESM，因为 CJS 是动态的，无法在代码执行前确认代码是否使用到，而 ESM 则是完全静态的，可以判断到底加载了那些模块，判断哪些模块和变量未被使用或引用，进而删除对应的代码。大致有两种优化方式：

1. 在 `package.json` 中 添加 `sideEffects: false | [modules...]` 告知 webpack 的 compiler 此模块的代码无副作用，可以安全删除未用到的 export。
2. `optimization.usedExports` 和 TerserWebpackPlugin 结合：
   ```js
   module.exports = {
     // ...
     optimization: {
       usedExports: true, // 标识出未使用的export
       minimize: true // 开启代码压缩, 会删除掉未使用代码
     }
   }
   ```

> 注意：生产模式是默认开启 tree shaking 的，不用做上面的配置。  
> 关于 sideEffects 配置和 usedExports 见官网介绍[Tree shaking](https://webpack.docschina.org/guides/tree-shaking/)

## externals

抽离框架、库之类的依赖到 CDN，相比抽离成 dll 文件，CDN 更加优秀。

## source map

通过 devtool 属性来控制的，注意 v4 和 v5 版本的字段略有差别。

开发环境下推荐 `eval-cheap-module-source-map` 即可；
生产环境下根据业务来做选择~

## 参考

- [HMR 机制](https://mp.weixin.qq.com/s/GlwGJ4cEe-1FgWW4EVpG_w)
- [split chunk 分包机制](https://mp.weixin.qq.com/s/YjzcmwjI-6D8gyIkZF0tVw)
- [tree shaking 原理](https://mp.weixin.qq.com/s/XVBFZ9fHBmcfNN6kgSLshw)
- [source map 原理](https://mp.weixin.qq.com/s/pOBKras7skY2efsY0tRB0A)
- [webpack 优化](https://github.com/jantimon/html-webpack-plugin)
- [webpack 优化](https://mp.weixin.qq.com/s/Rv1O4oFvj6rVpijUXtfyCA)
- [深入理解 webpack 的 require.context](https://mp.weixin.qq.com/s/wEAXLtIpE9AN7ZyCjnfBEg)
- [读懂这些题，你就是 webpack 配置工程师](https://juejin.cn/post/6844903890429673480)
