---
title: 'React基础原理 - setState'
date: 2022-11-23T09:30:25+08:00
tags: [React]
---

触发状态更新，前面说了五种：

- ReactDOM.render —— HostRoot
- this.setState —— ClassComponent
- this.forceUpdate —— ClassComponent
- useState —— FunctionComponent
- useReducer —— FunctionComponent

今天重点说一下 `setState`：

setState 最终调用的是 `this.updater.enqueueSetState(this, partialState, callback, 'setState')`。

首先要明确一点，针对 React 中的 state，不像 vue 那样，是没有做任何数据绑定的，当 state 发生变化时，是发生了一次重新渲染，**每一次渲染都能拿到独立的 state 状态，这个状态值是函数中的一个常量**。

```JavaScript
const classComponentUpdater = {
  isMounted,
  enqueueSetState(inst, payload, callback) {
    // 通过组件实例获取对应 fiber
    const fiber = getInstance(inst);
    const eventTime = requestEventTime();

    // 获取优先级
    const lane = requestUpdateLane(fiber);

    // 创建 update 对象 把 payload 和 callback 添加到 update 对象上
    const update = createUpdate(eventTime, lane);
    update.payload = payload;
    if (callback !== undefined && callback !== null) {
      update.callback = callback;
    }

    // 将 update 插入 updateQueue
    enqueueUpdate(fiber, update);

    //  ******* 调度 update *******
    scheduleUpdateOnFiber(fiber, lane, eventTime);

    if (enableSchedulingProfiler) {
      markStateUpdateScheduled(fiber, lane);
    }
  },
  enqueueReplaceState(inst, payload, callback) {
    // ...
  },
  // this.forceUpdate 使用这个方法，与enqueueSetState唯二的不同就是
  // 1. update.tag = ForceUpdate 2. 没有 payload
  // 所以，当某次更新含有tag为ForceUpdate的Update，那么当前ClassComponent不会受其他性能优化手段
  //（shouldComponentUpdate|PureComponent）影响，一定会更新。
  enqueueForceUpdate(inst, callback) {
    // ...
  },
};
```

## 关于 setState 的同步异步问题(v18 分割线)

首先明确一点：无论哪个版本，`setState` 这个函数自身始终是同步的。  
关于 `setState` 同步异步问题一般指的是由其引发的更新渲染是同步还是异步的，而今时今日（v18 已经发布），对于这个问题要分为 v18 之前 和 v18 之后去看待了。

### v18 之前

**结论：**

- `setTimeout`、`setInterval`、`DOM2级事件回调`、`Promise.then()的回调` 中，`setState` 触发的状态更新是同步的
- 其它直接处在 React 生命周期和 React 合成事件内的 `setState` 状态更新都是异步的

```JavaScript
// 老版的 批量更新
export function batchedUpdates<A, R>(fn: A => R, a: A): R {
  const prevExecutionContext = executionContext;
  // 当脱离了 React 的环境，就获取不到 BatchedContext 上下文
  executionContext |= BatchedContext;
  try {
    return fn(a);
  } finally {
    executionContext = prevExecutionContext;
    // 所以下面就会同步执行
    if (executionContext === NoContext) {
      // Flush the immediate callbacks that were scheduled during this batch
      resetRenderTimer();
      flushSyncCallbackQueue();
    }
  }
}
```

### v18 之后

**结论：**

- 默认所有的 `setState` 会自动进行批处理，表现都是异步渲染的。

```JavaScript
// 新版批量更新 依赖于 lane 模型：ensureRootIsScheduled 方法内
// Check if there's an existing task. We may be able to reuse it.
if (existingCallbackNode !== null) {
  const existingCallbackPriority = root.callbackPriority;
  if (existingCallbackPriority === newCallbackPriority) { // 相同级别的 setState 后续都给return掉了
    // The priority hasn't changed. We can reuse the existing task. Exit.
    return;
  }
  // The priority changed. Cancel the existing callback. We'll schedule a new
  // one below.
  cancelCallback(existingCallbackNode);
}
```

### 各种现象的原因

- `setState` 传对象/函数差异的原因：
  传对象，在同一周期内会对多个 setState 进行批处理，效果类似于 Object.assign；而传入一个函数由于 setState 的调用是分批的，所以可以链式地进行更新，确保它们是一个建立在另一个之上的。
- 产生异步渲染现象的原因：  
  如上一条，是由于`setState` 的批处理，这么做是为了避免中间状态引发不必要的渲染，等所有 `setState` 完成后再渲染，从而提升性能。
- v18 表现和以前不同的原因：  
  使用了 `ReactDOM.createRoot` 创建应用后, 所有的更新都会自动进行批处理；`ReactDOM.render` 则保持着和以前一样的行为。

如果想要同步的更新行为，使用 `react-dom 的 flushSync`，把 `setState` 用 `flushSync` 的回调包裹一下。

```JavaScript
// 注意写法，在同一个 flushSync内是无效的
import { flushSync } from 'react-dom';

flushSync(() => {
  this.setState({count: 1})
})
console.log(this.state.count) // 1
flushSync(() => {
  this.setState({count: 2})
})
console.log(this.state.count) // 2
```

### 从源码看现象

从之前的文章中应该很清楚，状态更新都会走入 `scheduleUpdateOnFiber` 这个方法，此处我们关注这里：

```JavaScript
// scheduleUpdateOnFiber 部分代码:
// export const NoContext = 0b0000000; 是一个二进制常量
// let executionContext = NoContext; 也是 executionContext 的初始值
if (executionContext === NoContext) {
  // 把回调执行完，然后清空队列，见下方
  flushSyncCallbackQueue();
}

// flushSyncCallbackQueue 的核心:
runWithPriority(ImmediatePriority, () => {
  for (; i < queue.length; i++) {
    let callback = queue[i];
    do {
      callback = callback(isSync);
    } while (callback !== null);
  }
});
syncQueue = null;

// syncQueue 是什么? 存的是调用 scheduleSyncCallback(callback) 里的 callback
// 在源码中就是 ensureRootIsScheduled 内 performSyncWorkOnRoot方法，这就和之前串起来了
newCallbackNode = scheduleSyncCallback(
  performSyncWorkOnRoot.bind(null, root),
);
```

当 `executionContext` 值为 `NoContext` 时，表示非批量，会同步执行同步更新策略，否则为异步更新。

---

`setState` 的合并策略见 `getStateFromUpdate` 这个方法：

```JavaScript
function getStateFromUpdate( workInProgress: Fiber,
  queue: UpdateQueue<State>,
  update: Update<State>,
  prevState: State,
  nextProps: any,
  instance: any) {
  // 根据 update 的tag 分别处理
  switch(update.tag) {
    //...
     case UpdateState: {
      const payload = update.payload;
      let partialState;
      if (typeof payload === 'function') {
        // Updater function
        partialState = payload.call(instance, prevState, nextProps);
      } else {
        // Partial state object
        partialState = payload;
      }
      // Null and undefined are treated as no-ops.
      if (partialState === null || partialState === undefined) {
        return prevState;
      }
      // Merge the partial state and the previous state.
      return Object.assign({}, prevState, partialState);
    }
    //...
  }
}
```

### hook 中的 "setState"

它的更新流程最终也是要走入 `scheduleUpdateOnFiber`，所以与 `this.setState` 的区别不大。但是，hook 的 "setState" 不会做自动的合并。

```JavaScript
this.state = {
  name: 'yokiizx',
  age: 18
}
this.setState({age: 35}) // state = {name: 'yokiizx', age: 35}

const [demo, setDemo] = useState({name: 'yokiizx', age: 18})
setDemo({age: 35})      // state = {age: 35}
```

## 参考

- [官网 setState](https://zh-hans.reactjs.org/docs/react-component.html#setstate)
- [官网 setState 什么时候是异步的](https://zh-hans.reactjs.org/docs/faq-state.html#when-is-setstate-asynchronous)
- [Automatic batching for fewer renders in React 18 ](https://github.com/reactwg/react-18/discussions/21)
