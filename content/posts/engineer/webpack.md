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

极简流程：创建依赖图 ---> 根据依赖图打包 bundle 产出。

TODO

## loader

打包非 JS 和 JSON 格式的文件，需要使用 loader 来转换一下。

## plugin

## 参考

- [webpack 官网](https://webpack.js.org/)
- [webpack 核心原理](https://mp.weixin.qq.com/s/_Hyn_sb8mki6aYTXwVZe6g)
