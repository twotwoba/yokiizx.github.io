---
title: 'React基础原理5 - render阶段'
date: 2022-11-14T17:06:21+08:00
tags: [React]
---

从创建 FiberRoot，到创建 Update，再遍历到 FiberRoot，然后发起一个 task，进入到了 `performSyncWorkOnRoot`或`performConcurrentWorkOnRoot` 方法中，这便是 render 阶段的开端。

这两个方法又分别调用了 `renderRootSync` 和 `renderRootConcurrent`（这两个方法返回 `exitStatus` 供后续使用），其内部又分别调用了 `workLoopSync` 和 `workLoopConcurrent`：

```JavaScript
function workLoopSync() {
  // Already timed out, so perform work without checking if we need to yield.
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

可以看出这两唯一的区别就是多了一个 `shouldYield` 的判断，如果当前浏览器帧没有剩余时间，`shouldYield` 会中止循环，直到浏览器有空闲时间后再继续遍历。

源码中追踪到最后是 `throw new Error('This module must be shimmed by a specific build.')`，就是这个模块必须由特定的构建进行微调，下面是这个方法的模拟实现：

```JavaScript
export function shouldYieldToHost(): boolean {
  if (
    (expectedNumberOfYields !== -1 &&
      yieldedValues !== null &&
      yieldedValues.length >= expectedNumberOfYields) ||
    (shouldYieldForPaint && needsPaint)
  ) {
    // We yielded at least as many values as expected. Stop flushing.
    didStop = true;
    return true;
  }
  return false;
}
```

##### performUnitOfWork

`performUnitOfWork(unitOfWork: Fiber)`，入参即是 workInProgress Fiber,这是一个全局变量。

```JavaScript
function performUnitOfWork(unitOfWork: Fiber): void {
  // The current, flushed, state of this fiber is the alternate. Ideally
  // nothing should rely on this, but relying on it here means that we don't
  // need an additional field on the work in progress.
  const current = unitOfWork.alternate

  let next
  if (enableProfilerTimer && (unitOfWork.mode & ProfileMode) !== NoMode) {
    startProfilerTimer(unitOfWork)
    next = beginWork(current, unitOfWork, subtreeRenderLanes)
    stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true)
  } else {
    next = beginWork(current, unitOfWork, subtreeRenderLanes)
  }

  unitOfWork.memoizedProps = unitOfWork.pendingProps

  if (next === null) {
    // If this doesn't spawn new work, complete the current work.
    completeUnitOfWork(unitOfWork)
  } else {
    workInProgress = next
  }

  ReactCurrentOwner.current = null
}
```

结合上文，`performUnitOfWork` 是在 while 循环中执行的，performUnitOfWork，分别进入 `beginWork`, `completeUnitOfWork 中调用 --> completeWork`。

这是一个递归的过程，`beginWork` 递，`completeWork` 归。’递‘ 到没有叶节点的子节点后，检查是否有兄弟节点 sibling，有的话进入兄弟节点继续递，否则进入 ’归‘ 阶段，’归‘ 到 fiberRoot，render 阶段结束。

举个例子：

```JavaScript
function App() {
  return (
    <div>
      I am
      <span>yokiizx</span>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById("root"));

/**
 *  fiberRoot     beginWork
 *  App Fiber     beginWork
 *  div Fiber     beginWork
 *  'I am' Fiber  beginWork
 *  'I am' Fiber  completeWork
 *   span  Fiber  beginWork
 *   span  Fiber  completeWork
 *   div Fiber    completeWork
 *   App Fiber    completeWork
 *   fiberRoot    completeWork
 * /
```

> 之所以 'yokiizx' Fiber 没有进入 beginWork/completeWork，是因为针对**只有单一文本子节点的 Fiber**，React 进行了特殊的处理来进行性能优化。

##### beginWork

beginWork 源码比较长，这里简化一下主要逻辑：

```JavaScript
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {

  // current !== null，说明是 update，可以通过diff来获取可以复用的fiber
  if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;

    if (
      oldProps !== newProps ||
      hasLegacyContextChanged() ||
      (__DEV__ ? workInProgress.type !== current.type : false)
    ) {
      didReceiveUpdate = true;
      // includesSomeLane 这个方法在 Scheduler 时再细看，这里是优先级不够就进入下面代码
    } else if (!includesSomeLane(renderLanes, updateLanes)) {
      didReceiveUpdate = false;
      switch (workInProgress.tag) {
        // 省略处理
      }

      // 复用current，判断子树是否需要更新
      return bailoutOnAlreadyFinishedWork(
        current,
        workInProgress,
        renderLanes,
      );
    } else {
      didReceiveUpdate = false;
    }
  } else {
    didReceiveUpdate = false;
  }

  // 根据 fiber.tag 的不同，创建不同的子Fiber节点
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      // ...省略
    case LazyComponent:
      // ...省略
        case FunctionComponent: {
      const Component = workInProgress.type;
      const unresolvedProps = workInProgress.pendingProps;
      const resolvedProps =
        workInProgress.elementType === Component
          ? unresolvedProps
          : resolveDefaultProps(Component, unresolvedProps);
      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
    }
    case ClassComponent: {
      const Component = workInProgress.type;
      const unresolvedProps = workInProgress.pendingProps;
      const resolvedProps =
        workInProgress.elementType === Component
          ? unresolvedProps
          : resolveDefaultProps(Component, unresolvedProps);
      return updateClassComponent(
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
    }
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);
    case HostText:
      // ...省略
    // ...省略其他类型
  }
}
```

入参的 current 即 currentFiber，通过 workInProgress Fiber 的 alternate 属性获取到，前文说过，mount 时，current 为空，所以在 `beginWork` 中通过判断 `current ！== null` 来判断是 update 还是 mount 阶段 。  
在 update 阶段，可以调用 `bailoutOnAlreadyFinishedWork` 来复用 current 上的节点。  
在 mount 阶段，直接根据 tag 不同，创建不同的子 Fiber 节点。而根据 tag 不同来创建 Fiber 节点，对于常见的组件（FunctionComponent/ClassComponent/HostComponent）最终都会进入 `reconcileChildren` 这个方法：

```JavaScript
export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderLanes: Lanes,
) {
  if (current === null) {
    // If this is a fresh new component that hasn't been rendered yet, we
    // won't update its child set by applying minimal side-effects. Instead,
    // we will add them all to the child before it gets rendered. That means
    // we can optimize this reconciliation pass by not tracking side-effects.
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes,
    );
  } else {
    // If the current child is the same as the work in progress, it means that
    // we haven't yet started any work on these children. Therefore, we use
    // the clone algorithm to create a copy of all the current children.

    // If we had any progressed work already, that is invalid at this point so
    // let's throw it out.

    // 这里将使用 diff 算法 创建新Fiber 并加上 effectTag
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes,
    );
  }
}
```

这里与 beginWork 一样，也是根据 current 是否为 null 来判断是 mount 还是 update 阶段的，不论走哪个逻辑，最终他会生成新的子 Fiber 节点并赋值给 workInProgress.child，作为本次 beginWork 返回值，并作为下次 performUnitOfWork 执行时 workInProgress 的传参。

mountChildFibers 和 reconcileChildFibers 逻辑基本相同，唯一不同的是：reconcileChildFibers 会为生成的 Fiber 节点带上 `effectTag` 属性。

`ReactFiberFlags.js` 这个文件中存储着 effectTag 对应的操作：

```JavaScript
// DOM需要插入到页面中
export const Placement = /*                */ 0b00000000000010;
// DOM需要更新
export const Update = /*                   */ 0b00000000000100;
// DOM需要插入到页面中并更新
export const PlacementAndUpdate = /*       */ 0b00000000000110;
// DOM需要删除
export const Deletion = /*                 */ 0b00000000001000;

```

> 通过二进制表示 effectTag，可以方便的使用位操作为 fiber.effectTag 赋值多个 effect。

beginWork 的流程图：
![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202211152222775.png)

##### completeWork

从 "递" 出来后进入 "归"的 `completeWork`。

`completeWork` 的源码非常长，不过与 `beginWork` 一样，也是根据 fiber.tag 调用不同的处理逻辑，方法内就一个 `switch...case`，有些组件要处理的逻辑较多，下面只关注部分组件类型的主要逻辑。

```JavaScript
function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case IndeterminateComponent:
    case LazyComponent:
    case SimpleMemoComponent:
    case FunctionComponent:
    case ForwardRef:
    case Fragment:
    case Mode:
    case Profiler:
    case ContextConsumer:
    case MemoComponent:
      return null;
    case ClassComponent: {
      // ...省略
      return null;
    }
    case HostRoot: {
      // ...省略
      updateHostContainer(workInProgress);
      return null;
    }
    case HostComponent: {
      // ...省略
      return null;
    }
    // ...其它的 case 类型
  }
}
```

先重点关注页面渲染所必须的 `HostComponent`（即原生 DOM 组件对应的 Fiber 节点）:

```JavaScript
case HostComponent: {
  popHostContext(workInProgress)
  const rootContainerInstance = getRootHostContainer()
  const type = workInProgress.type
  if (current !== null && workInProgress.stateNode != null) {
    updateHostComponent(
      current,
      workInProgress,
      type,
      newProps,
      rootContainerInstance
    )

    if (current.ref !== workInProgress.ref) {
      markRef(workInProgress)
    }
  } else {
    if (!newProps) {
      // This can happen when we abort work.
      return null
    }

    const currentHostContext = getHostContext()
    // 创建 DOM 节点
    const instance = createInstance(
      type,
      newProps,
      rootContainerInstance,
      currentHostContext,
      workInProgress
    )
    // 将子孙DOM节点插入刚生成的DOM节点中
    appendAllChildren(instance, workInProgress, false, false)
    // DOM节点赋值给fiber.stateNode
    workInProgress.stateNode = instance

    // Certain renderers require commit-time effects for initial mount.
    // (eg DOM renderer supports auto-focus for certain elements).
    // Make sure such renderers get scheduled for later work.
    // 初始化 DOM 对象的事件监听器和属性
    if (
      finalizeInitialChildren(
        instance,
        type,
        newProps,
        rootContainerInstance,
        currentHostContext
      )
    ) {
      markUpdate(workInProgress)
    }

    if (workInProgress.ref !== null) {
      // If there is a ref on a host node we need to schedule a callback
      markRef(workInProgress)
    }
  }
  return null
}
```

也是根据 current 是否为 null 来判断是 mount 还是 update；同时根据 workInProgress.stateNode 是否已存在对应 DOM 节点来判断是否进入更新还是去新建。

- 如果进入 update，则会走入 `updateHostComponent` 方法，这个方法最终会生成 `updatePayload` 挂载到 `workInProgress.updateQueue` 上，最后在 `commit` 阶段渲染到页面上。
  ```JavaScript
  // updatePayload为数组形式，他的偶数索引的值为变化的prop key，奇数索引的值为变化的prop value
  workInProgress.updateQueue = (updatePayload: any);
  ```
- 如果进入 mount，主要干了这么几件事
  - 为 fiber 创建对应的 DOM 节点，并赋值给 fiber.stateNode
  - 把子孙 DOM 节点放入刚刚生成的 DOM 节点中（我们是”归“阶段所以能拿到所有子孙节点）
  - 初始化 DOM 对象的事件监听器和属性

当 `completeWork` 归到 rootFiber 时，在内存中就已经有了一个构建好的 DOM 树了。

继续归--继续退栈，依次 `completeUnitOfWork`,`performUnitOfWork`,`workLoopSync`,`renderRootSync`,`performSyncWorkOnRoot`，最后执行 `performSyncWorkOnRoot` 的代码：

```JavaScript
 commitRoot(root); // 进入 commit 阶段
```

注意：commit 阶段需要找到所有具备 effectTag 的 fiber 节点，并依次执行对应的操作，为了不再 commit 阶段再遍历一次 fiberTree 来提高性能，React 在 fiber 中设置了类似 UpdateQueue 对象的 fisrt/lastBaseUpdate 属性，为 firstEffect 和 lastEffect，通过 nextEffect 将具有 effectTag 的 Fiber 连接起来，这部分操作发生在 `completeUnitOfWork` 执行完 `completeWork` 之后。

还是因为 在 "归" 阶段，最终就是会形成从 rootFiber 到最后一个 fiber 的 effectList：

```JavaScript
                       nextEffect         nextEffect
rootFiber.firstEffect -----------> fiber -----------> fiber
```

这样，在 commit 阶段只需要遍历 effectList 就能执行所有 effect 了。

`completeWork` 大致流程图：
![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202211170035027.png)

## 总结

至少大概要清楚 render 阶段都做了什么：

- beginWork
  - mount：根据 tag（组件类型） 生成了新的 fiber 节点
  - update：根据 props 和 type 判断是否可以复用：
    1. 可以复用再判断子树是否检查更新，需要返回 workInProgress.child，不需要返回 null；
    2. 不可复用则根据 tag 不同做不同操作，然后调用 `reconcileChildFibers` 通过 diff 算法生成 effectTag 的新 fiber 节点
- completeWork  
   根据 tag 不同进入不同的组件处理逻辑：

  - mount
    1. createInstance 创建 DOM 实例，赋值给 fiber.stateNode
    2. 将子孙节点插入新生成的 DOM 节点
    3. 初始化 DOM 对象的事件监听器和内部属性
  - update
    - updateHostComponent 主要是 diff props，返回需要更新的属性名和值的数组，形式如 `[key1,value1,key2,value2,...]`，并把这个数组赋值给 workInProgress.updateQueue。

- completeUnitOfWork 内 completeWork 执行之后
  最终把带有 effectTag 的 fiber 通过 nextEffect 连接形成单链表，挂载到父级 effectList 的末尾，并返回下一个 workInProgress fiber。

最后 `performSyncWorkOnRoot` 内调用 `commitRoot(root);` 进入 commit 阶段。
