---
title: 'Tab标签下多个tab调用多次接口'
date: 2022-09-20T15:44:17+08:00
tags: [exp]
---

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/20221009143455.png)

如上图：公司的组件库，开发时发现，这个 tab 有多少个，在初始化的时候，接口就会被调用多少次。

网上查了下，有的说加 `router-view` 去包裹动态组件，感觉不太靠谱。分析了一下，感觉应该因为 tab 下的组件每个都在被初始化，所有有多少个就经历了多少次，那么只要做到让切换到 tab 下时，再去初始化不就好了？

所以给 `component` 加上了 `v-if` 的判断，试了一下，完美解决，如图。

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/20221009144306.png)
