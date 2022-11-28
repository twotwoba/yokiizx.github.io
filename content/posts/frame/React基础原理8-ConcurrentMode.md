---
title: 'React基础原理8 - ConcurrentMode'
date: 2022-11-28T23:23:21+08:00
tags: [React]
---

> Concurrent 模式是一组 React 的新功能，可帮助应用保持响应，并根据用户的设备性能和网速进行适当的调整。

- `Fiber`: 架构将单个组件作为 `工作单元`，使以组件为粒度的“异步可中断的更新”成为可能
- `Scheduler`: 配合 `时间切片`，为每个工作单元分配一个 `可运行时间`，实现“异步可中断的更新”
- `lane` 模型: 控制不同 `优先级` 之间的关系与行为。比如多个优先级之间如何互相打断？优先级能否升降？本次更新应该赋予什么优先级？

> 从源码层面讲，Concurrent Mode 是一套可控的“多优先级更新架构”。

TODO

## 参考

- [React 技术揭密](https://react.iamkasong.com/)
- [为什么 Scheduler 不使用 generator](https://github.com/facebook/react/issues/7942#issuecomment-254987818)
- [React Scheduler 为什么使用 MessageChannel 实现](https://juejin.cn/post/6953804914715803678)
