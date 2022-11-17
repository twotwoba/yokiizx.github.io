---
title: 'React基础原理6 - commit 阶段'
date: 2022-11-17T10:57:23+08:00
tags: [React]
---

render 通过 `commitRoot(root)` 进入此阶段。该阶段调用的主函数是 `commitRootImpl(root, renderPriorityLevel)`。

此时，`rootFiber.firstEffect` 上保存了一条需要执行副作用的 Fiber 节点的单向链表 effectList，这些 Fiber 节点的 updateQueue 上保存着变化了的 props。

这些副作用的 DOM 操作在 commit 阶段执行。

commit 阶段主要分为：before mutation，mutation，layout 这三个阶段。

开始三个阶段之前先看下 `commitRootImpl` 的主要内容：

```JavaScript
// 保存之前的优先级，以同步优先级执行，执行完毕后恢复之前优先级
const previousLanePriority = getCurrentUpdateLanePriority();
setCurrentUpdateLanePriority(SyncLanePriority);

// 将当前上下文标记为CommitContext，作为commit阶段的标志
const prevExecutionContext = executionContext;
executionContext |= CommitContext;

// 处理focus状态
focusedInstanceHandle = prepareForCommit(root.containerInfo);
shouldFireAfterActiveInstanceBlur = false;
```

## before muatation(执行 DOM 操作前)

主函数 `commitBeforeMutationEffects`：

```JavaScript
function commitBeforeMutationEffects() {
  while (nextEffect !== null) {
    const current = nextEffect.alternate

    if (!shouldFireAfterActiveInstanceBlur && focusedInstanceHandle !== null) {
      // ...focus blur相关
    }

    // flags(v16叫effectTag)
    const flags = nextEffect.flags

    // 调用 getSnapshotBeforeUpdate
    if ((flags & Snapshot) !== NoFlags) {
      commitBeforeMutationEffectOnFiber(current, nextEffect)
    }

    // 调度useEffect
    if ((flags & Passive) !== NoFlags) {
      // If there are passive effects, schedule a callback to flush at the earliest opportunity.
      if (!rootDoesHavePassiveEffects) {
        rootDoesHavePassiveEffects = true
        scheduleCallback(NormalSchedulerPriority, () => {
          // 触发 useEffect
          flushPassiveEffects()
          return null
        })
      }
    }
    nextEffect = nextEffect.nextEffect
  }
}
```

整体可以分为三部分：

- 处理 DOM 节点渲染/删除后的 autoFocus、blur 逻辑。
- 调用 `getSnapshotBeforeUpdate` 生命周期钩子。
- 调度 `useEffect`。

提一嘴生命周期，`getSnapshotBeforeUpdate` 是 React16 新增的 api，主要是因为 render 阶段可能被中断，然后再接着执行，而旧的 `componentWillXxx` 生命周期也是在 render 阶段执行，就可能会导致此类生命周期被触发执行多次。为此，React 提供了替代的生命周期钩子 `getSnapshotBeforeUpdate`，如上，它是在 commit 阶段 -- 确切说是 `commit before mutation` 也称为 `pre-commit` 阶段执行的，而 commit 是同步执行的，不会出现多次调用的问题。

TODO effect

## mutation(执行 DOM 操作)

## layout(执行 DOM 操作后)

## 参考

- [React 生命周期图](https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/)
