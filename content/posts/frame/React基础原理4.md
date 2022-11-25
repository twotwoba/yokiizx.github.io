---
title: 'React基础原理4 - 获取fiberRoot&调度更新'
date: 2022-11-14T16:33:10+08:00
tags: [React]
---

上文的 5 种触发更新使得被触发更新的 Fiber 对象上已经记录下了所有需要变化的 Update，那么接下来就是要调用 `markUpdateLaneFromFiberToRoot` 这个方法。

##### markUpdateLaneFromFiberToRoot (获取到 fiberRoot)

```JavaScript
function markUpdateLaneFromFiberToRoot(sourceFiber: Fiber, lane: Lane): FiberRoot | null {
  // Update the source fiber's lanes
  sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane)
  let alternate = sourceFiber.alternate
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane)
  }

  // Walk the parent path to the root and update the child expiration time.
  let node = sourceFiber
  let parent = sourceFiber.return
  while (parent !== null) {
    parent.childLanes = mergeLanes(parent.childLanes, lane)
    alternate = parent.alternate
    if (alternate !== null) {
      alternate.childLanes = mergeLanes(alternate.childLanes, lane)
    }
    node = parent
    parent = parent.return
  }
  if (node.tag === HostRoot) {
    const root: FiberRoot = node.stateNode
    return root
  } else {
    return null
  }
}
```

可以看见这个方法，主要干了两件事：

1. 对 lane 进行了操作
2. 从触发更新的 Fiber 遍历到 FiberRoot，并返回 FiberRoot

接下来做的就是去触发调度更新了。

##### ensureRootIsScheduled (调度更新)

该方法的源码的注释比较清晰容易理解。

```JavaScript
// Use this function to schedule a task for a root. There's only one task per
// root; if a task was already scheduled, we'll check to make sure the priority
// of the existing task is the same as the priority of the next level that the
// root has work on. This function is called on every update, and right before
// exiting a task.
function ensureRootIsScheduled(root: FiberRoot, currentTime: number) {
  const existingCallbackNode = root.callbackNode;

  // Check if any lanes are being starved by other work. If so, mark them as
  // expired so we know to work on those next.
  markStarvedLanesAsExpired(root, currentTime);

  // Determine the next lanes to work on, and their priority.
  const nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes,
  );
  // This returns the priority level computed during the `getNextLanes` call.
  const newCallbackPriority = returnNextLanesPriority();

  if (nextLanes === NoLanes) {
    // Special case: There's nothing to work on.
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode);
      root.callbackNode = null;
      root.callbackPriority = NoLanePriority;
    }
    return;
  }

  // Check if there's an existing task. We may be able to reuse it.
  if (existingCallbackNode !== null) {
    const existingCallbackPriority = root.callbackPriority;
    if (existingCallbackPriority === newCallbackPriority) {
      // The priority hasn't changed. We can reuse the existing task. Exit.
      return;
    }
    // The priority changed. Cancel the existing callback. We'll schedule a new
    // one below.
    cancelCallback(existingCallbackNode);
  }

  // Schedule a new callback.
  let newCallbackNode;
  if (newCallbackPriority === SyncLanePriority) {
    // Special case: Sync React callbacks are scheduled on a special
    // internal queue
    newCallbackNode = scheduleSyncCallback(
      performSyncWorkOnRoot.bind(null, root),     // 同步工作
    );
  } else if (newCallbackPriority === SyncBatchedLanePriority) {
    newCallbackNode = scheduleCallback(
      ImmediateSchedulerPriority,                 // 优先级
      performSyncWorkOnRoot.bind(null, root),     // 同步工作
    );
  } else {
    const schedulerPriorityLevel = lanePriorityToSchedulerPriority(
      newCallbackPriority,
    );
    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,                       // 优先级
      performConcurrentWorkOnRoot.bind(null, root), // 并发
    );
  }

  root.callbackPriority = newCallbackPriority;
  root.callbackNode = newCallbackNode;
}
```

关注一下 `scheduleCallback`方法，它有两个参数，第一个是优先级，第二个是回调，有两种类型的回调函数即：`performSyncWorkOnRoot`和`performConcurrentWorkOnRoot`，这两个方法就是 render 阶段的入口函数，下文将学习 render 阶段。
