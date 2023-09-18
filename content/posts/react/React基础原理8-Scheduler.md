---
title: 'React基础原理8 - Scheduler'
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

### 时间切片

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

### 优先级调度

`Scheduler` 是独立于 React 的包，**它的优先级也是独立于 React 的优先级**。

```JavaScript
// SchedulerPriorities.js
export const NoPriority = 0;
export const ImmediatePriority = 1;
export const UserBlockingPriority = 2;
export const NormalPriority = 3;
export const LowPriority = 4;
export const IdlePriority = 5;

function unstable_runWithPriority(priorityLevel, eventHandler) {
  switch (priorityLevel) {
    case ImmediatePriority:      // 最高优先级会立即执行
    case UserBlockingPriority:
    case NormalPriority:
    case LowPriority:
    case IdlePriority:
      break;
    default:
      priorityLevel = NormalPriority;
  }

  var previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;

  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}
```

可见，`Scheduler` 有 5 种优先级，默认是 `NormalPriority`，`ImmediatePriority` 是最高优先级，会立即执行。

```JavaScript
function commitRoot(root) {
   // 返回 scheduler 中的 currentPriorityLevel
  const renderPriorityLevel = getCurrentPriorityLevel();
  // 发起一个立即执行的任务,并指定这个任务的优先级
  runWithPriority(
    ImmediateSchedulerPriority,
    commitRootImpl.bind(null, root, renderPriorityLevel),
  );
  return null;
}
```

优先级的意义 --- 赋予不同优先级不同的过期时间~

看一下 `scheduler` 的这个方法 `unstable_scheduleCallback`，对外抛出一般是 `schedulerCallback`，直译过来就是安排回调，也就可以理解为是调度任务：

```JavaScript
// Times out immediately
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

function unstable_scheduleCallback(priorityLevel, callback, options) {
  var currentTime = getCurrentTime();

  var startTime;
  if (typeof options === 'object' && options !== null) {
    var delay = options.delay;
    if (typeof delay === 'number' && delay > 0) {
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }

  var timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT;
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT;
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }

  // 过期时间
  var expirationTime = startTime + timeout;

  var newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };
  if (enableProfiling) {
    newTask.isQueued = false;
  }

  if (startTime > currentTime) {
    // This is a delayed task.
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      // All tasks are delayed, and this is the task with the earliest delay.
      if (isHostTimeoutScheduled) {
        // Cancel an existing timeout.
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      // Schedule a timeout.
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);
    if (enableProfiling) {
      markTaskStart(newTask, currentTime);
      newTask.isQueued = true;
    }
    // Schedule a host callback, if needed. If we're already performing work,
    // wait until the next time we yield.
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
  }

  return newTask;
}
```

首先，根据任务优先级得到了不同的任务过期时间，放到 `newTask` 中；`options` 可以设置 `delay` 时间，当设置了 `delay` 在下面入队列的时候就会进入 `timerQueue` 队列 `push(timerQueue, newTask);`，否则进入的是 `taskQueue` 队列。

上方的 push、peek 都是 scheculer 实现的优先队列的方法，之所以自己实现了一个小顶堆优先队列，是为了`O(1)`复杂度找到上方 `timerQueue` 和 `taskQueue` 中时间最早的那个任务。

继续往下走，任务的重启就在 `requestHostCallback` 这个方法，这个方法根据是否支持 `MessageChannel` 也有两种实现，暂且不关注，主要关注它后面的流程，`requestHostCallback` 调用了 `flushWork`，再调用 `workLoop`：

```JavaScript
function workLoop(hasTimeRemaining, initialTime) {
  let currentTime = initialTime;
  advanceTimers(currentTime);
  currentTask = peek(taskQueue);
  while (
    currentTask !== null &&
    !(enableSchedulerDebugging && isSchedulerPaused)
  ) {
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost())
    ) {
      // This currentTask hasn't expired, and we've reached the deadline.
      break;
    }
    const callback = currentTask.callback; // 注册任务的回调函数
    if (typeof callback === 'function') {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      if (enableProfiling) {
        markTaskRun(currentTask, currentTime);
      }
      /* ---------- 关注这里 ---------- */
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
        if (enableProfiling) {
          markTaskYield(currentTask, currentTime);
        }
      } else {
        if (enableProfiling) {
          markTaskCompleted(currentTask, currentTime);
          currentTask.isQueued = false;
        }
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
      }
      advanceTimers(currentTime);
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
  // Return whether there's additional work
  if (currentTask !== null) {
    return true;
  } else {
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}
```

重点是：如果 `continuationCallback` 即调度注册的回调函数，它的返回值为 `function` 时，会把 `continuationCallback` 作为当前任务的回调函数，否则 `pop(taskQueue);` 把当前执行的任务清除 `taskQueue`，而在 `render` 阶段 `performConcurrentWorkOnRoot` 函数的末尾有这么段代码：

```JavaScript
if (root.callbackNode === originalCallbackNode) {
  // The task node scheduled for this root is the same one that's
  // currently executed. Need to return a continuation.
  return performConcurrentWorkOnRoot.bind(null, root);
}
```

这里就是返回了一个函数 `continuation`。

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

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202211291457300.png)
