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

## Scheduler

主要两个功能：

- 时间切片
- 优先级调度

##### 时间切片

先回顾一下，浏览器的事件循环机制(简约版)：

```txt
MacroTask --> MicroTask--> requestAnimationFrame--> 浏览器重排 / 重绘--> requestIdleCallback
```

> 时间切片的本质：就是模拟实现：`requestIdleCallback`，在当前帧还有空余时间时，执行回调。

时间切片选择使用 `MessageChannel` 实现，它的执行时机比 `setTimeout` 更靠前。

```JavaScript
// Scheduler 将需要被执行的回调函数作为 MessageChannel 的回调执行
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

requestHostCallback = function(callback) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    port.postMessage(null);
  }
};

// 如果不支持 MessageChannel 会降级成 setTimeout
const _flushCallback = function() {
  if (_callback !== null) {
    try {
      const currentTime = getCurrentTime();
      const hasRemainingTime = true;
      _callback(hasRemainingTime, currentTime);
      _callback = null;
    } catch (e) {
      setTimeout(_flushCallback, 0);
      throw e;
    }
  }
};
requestHostCallback = function(cb) {
  if (_callback !== null) {
    // Protect against re-entrancy.
    setTimeout(requestHostCallback, 0, cb);
  } else {
    _callback = cb;
    setTimeout(_flushCallback, 0);
  }
};
```

之前学习过 `workLoopSync`，是时候看看 `workLoopConcurrent`了：

```JavaScript
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

唯一的不同就是多了个 `shouldYield` 是否暂停的判断，这个方法是从 `shceduler` 内部抛出来的。

```JavaScript
shouldYieldToHost = function() {
  const currentTime = getCurrentTime();
  // deadline = currentTime + yieldInterval;
  // yieldInterval 初始化为 5ms
  if (currentTime >= deadline) {
    // There's no time left. We may want to yield control of the main
    // thread, so the browser can perform high priority tasks. The main ones
    // are painting and user input. If there's a pending paint or a pending
    // input, then we should yield. But if there's neither, then we can
    // yield less often while remaining responsive. We'll eventually yield
    // regardless, since there could be a pending paint that wasn't
    // accompanied by a call to `requestPaint`, or other main thread tasks
    // like network events.
    if (needsPaint || scheduling.isInputPending()) {
      // There is either a pending paint or a pending input.
      return true;
    }
    // There's no pending input. Only yield if we've reached the max
    // yield interval.
    return currentTime >= maxYieldInterval;
  } else {
    // There's still time left in the frame.
    return false;
  }
};
```

> 注释写的很明白，主要就是看是否有剩余时间是否用完，在 Schdeduler 中，为任务分配的初始剩余时间为 5ms，随着应用的运行，根据 fps 动态调整可执行时间。

```JavaScript
forceFrameRate = function(fps) {
  if (fps < 0 || fps > 125) return
  if (fps > 0) {
    yieldInterval = Math.floor(1000 / fps);
  } else {
    // reset the framerate
    yieldInterval = 5;
  }
};
```

启用 Concurrent Mode 后每个任务的执行时间大体都是多于 5ms 的一小段时间 —— 每个时间切片被设定为 5ms，任务本身再执行一小段时间，所以整体时间是多于 5ms 的时间

OK，到这里，`performUnitOfWork` 是怎么暂停的已经清除，主要是由于分配的剩余时间来决定的，那么任务怎么重启呢，这个就要看优先级调度了。

##### 优先级调度

TODO

<!-- ```flow
st=>start: start
MacroTask=>operation: MacroTask
MicroTask=>operation: MicroTask
cond=>condition: 重绘?
css=>operation: 触发resize、scroll,建立媒体查询;建立css动画
raf=>operation: requestAnimationFrame回调
IO=>operation: IntersectionObserver回调
render=>operation: 更新渲染屏幕
ifIdle=>condition: 是否空闲?
next=>operation: Next MacroTask
ric=>operation: requestIdleCallback 回调执行,直到队列清空或者当前帧没有空闲时间

st->MacroTask->MicroTask->cond
cond(yes)->css->raf->IO->render->ifIdle
cond(no)->MacroTask
ifIdle(yes)->ric
``` -->

## 参考

- [React 技术揭密](https://react.iamkasong.com/)
- [为什么 Scheduler 不使用 generator](https://github.com/facebook/react/issues/7942#issuecomment-254987818)
- [React Scheduler 为什么使用 MessageChannel 实现](https://juejin.cn/post/6953804914715803678)
- [window.requestAnimationFrame](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame)
- [IntersectionObserver API 使用教程](https://www.ruanyifeng.com/blog/2016/11/intersectionobserver_api.html)

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202211291457300.png)
