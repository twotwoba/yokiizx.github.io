---
title: 'Webpack之loader'
date: 2023-01-05T22:12:13+08:00
tags: [tool]
series: [wp]
---

Loader 就像一个翻译员，能将源文件经过转化后输出新的结果，并且一个文件还可以链式地经过多个翻译员翻译。

## 基础

打包非 JS 和 JSON 格式的文件，需要使用 `loader` 来转换一下，在构建阶段，所有 module 都会被对应的 loader 转成可以被 `acorn` 转译的 JS 脚本。

也就很好理解为什么 loader 的配置是在 module 内的：

```js
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

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202301051444588.png)

## 自定义 loader

开发一个 loader 的基本形式：

```js
module.exports = function (source ) {
  // 做你想做的~
  return source;
}
```

既然是一个 node.js 模块，那就有很大的发挥空间了，几乎想做什么就做什么，webpack 还有一些内置接口，见[Loader Interface](https://webpack.js.org/api/loaders/)

## 参考

- [手把手教你撸一个 Webpack Loader](https://juejin.cn/post/6844903555673882632#heading-8)
- [loader 配置详解](https://juejin.cn/post/6847902222873788430#heading-2)
