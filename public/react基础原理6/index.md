# React基础原理6 - commit 阶段


render 通过 `commitRoot(root)` 进入此阶段。该阶段调用的主函数是 `commitRootImpl(root, renderPriorityLevel)`。

此时，`rootFiber.firstEffect` 上保存了一条需要执行副作用的 Fiber 节点的单向链表 effectList，这些 Fiber 节点的 updateQueue 上保存着变化了的 props。

这些副作用的 DOM 操作在 commit 阶段执行。

commit 阶段主要分为：before mutation，mutation，layout 这三个阶段。

开始三个阶段之前先看下 `commitRootImpl` 的主要内容：

```js
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

遍历 effectList，进入主函数 `commitBeforeMutationEffects`：

```js
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

整体可以分为三部分，遍历 effectList，依次执行：

- 处理 DOM 节点渲染/删除后的 autoFocus、blur 逻辑。
- 调用 `getSnapshotBeforeUpdate` 生命周期钩子。
- 调度 `useEffect`。

提一嘴生命周期，`getSnapshotBeforeUpdate` 是 React16 新增的 api，主要是因为 render 阶段可能被中断，然后再接着执行，而旧的 `componentWillXxx` 生命周期也是在 render 阶段执行，就可能会导致此类生命周期被触发执行多次。为此，React 提供了替代的生命周期钩子 `getSnapshotBeforeUpdate`，如上，它是在 commit 阶段 -- 确切说是 `commit before mutation` 也称为 `pre-commit` 阶段执行的，而 commit 是同步执行的，不会出现多次调用的问题。

[详细见关于 useEffect](./React-useEffect.md)。  
此处，只需要知道 `useEffect` 是异步调用的，为了防止阻塞浏览器渲染。  
`flushPassiveEffect` 根据优先级调用 `flushPassiveEffectsImpl`，然后在 `flushPassiveEffectsImpl` 内部遍历 `rootWithPendingPassiveEffects`。一开始 `rootWithPendingPassiveEffects` 为 `null`，它是在上一轮 layout 阶段之后把 `effectList` 赋给 `rootWithPendingPassiveEffects` 的。

## mutation(执行 DOM 操作)

现在到了执行 DOM 操作的阶段：

```js
// commitImpl
// 同样也是遍历 effectList, before mutation/mutation/layout 都类似
nextEffect = firstEffect;
do {
    try {
      commitMutationEffects(root, renderPriorityLevel);
    } catch (error) {
      invariant(nextEffect !== null, 'Should be working on an effect.');
      captureCommitPhaseError(nextEffect, error);
      nextEffect = nextEffect.nextEffect;
    }
} while (nextEffect !== null);
```

主函数 `commitMutationEffects`：

```js
function commitMutationEffects(root: FiberRoot, renderPriorityLevel: ReactPriorityLevel) {
  // 遍历 effectList
  while (nextEffect !== null) {
    setCurrentDebugFiberInDEV(nextEffect);

    const flags = nextEffect.flags;

    //  重置文字节点
    if (flags & ContentReset) {
      commitResetTextContent(nextEffect);
    }
    // 更新 ref
    if (flags & Ref) {
      const current = nextEffect.alternate;
      if (current !== null) {
        commitDetachRef(current);
      }
    }

    // The following switch statement is only concerned about placement,
    // updates, and deletions. To avoid needing to add a case for every possible
    // bitmap value, we remove the secondary effects from the effect tag and
    // switch on that value.
    const primaryFlags = flags & (Placement | Update | Deletion | Hydrating);
    switch (primaryFlags) {
      // 插入 DOM
      case Placement: {
        commitPlacement(nextEffect);
        nextEffect.flags &= ~Placement; // 与自身的`取反` 进行 `与`，变成了 NoFlags
        break;
      }
      // 插入 DOM
      case PlacementAndUpdate: {
        commitPlacement(nextEffect);
        nextEffect.flags &= ~Placement;

        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      // SSR 省略 ...

      // 更新 DOM
      case Update: {
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      // 删除 DOM
      case Deletion: {
        commitDeletion(root, nextEffect, renderPriorityLevel);
        break;
      }
    }
    nextEffect = nextEffect.nextEffect;
  }
}
```

从源码中可以看出，每个 Fiber 都要进行以下操作：

- 重置文本节点
- 更新 `ref`
- 根据对应的 `flag` 进行对应的操作：（Placement | Update | Deletion | Hydration(SSR 相关,暂不关注)）

以上 `flag` 都在 `ReactFiberFlags.js` 中定义，全部为二进制值，是为了方便进行转换计算。

### Placement

当 flag 标志为 Placement 时，意味着该 fiber 对应的 DOM 元素应该被插入到页面中。

`commitPlacement` 函数：

```js
function commitPlacement(finishedWork: Fiber): void {
  if (!supportsMutation) {
    return;
  }
  // Recursively insert all host nodes into the parent.
  const parentFiber = getHostParentFiber(finishedWork); // 获取父级 DOM 节点

  // Note: these two variables *must* always be updated together.
  let parent;
  let isContainer;
  const parentStateNode = parentFiber.stateNode; // 拿到父fiber节点对应的 DOM
  // 根据父级 fiber 的tag对上方两个变量进行不同的赋值
  switch (parentFiber.tag) {
    case HostComponent:
      parent = parentStateNode;
      isContainer = false;
      break;
    case HostRoot:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case HostPortal:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case FundamentalComponent:
      if (enableFundamentalAPI) {
        parent = parentStateNode.instance;
        isContainer = false;
      }
  }
  if (parentFiber.flags & ContentReset) {
    // Reset the text content of the parent before doing any insertions
    resetTextContent(parent);
    // Clear ContentReset from the effect tag
    parentFiber.flags &= ~ContentReset;
  }

  const before = getHostSibling(finishedWork); // 获取兄弟节点

  // 这里是根据是否为 rootFiber 来调用不同的方法
  // 每个方法内都会递归的查找子节点
  if (isContainer) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
  } else {
    insertOrAppendPlacementNode(finishedWork, before, parent);
  }
}
```

> getHostSibling（获取兄弟 DOM 节点）的执行很耗时，当在同一个父 Fiber 节点下依次执行多个插入操作，getHostSibling 算法的复杂度为指数级。  
> 这是由于 Fiber 节点不只包括 HostComponent，所以 Fiber 树和渲染的 DOM 树节点并不是一一对应的。要从 Fiber 节点找到 DOM 节点很可能跨层级遍历。

```txt
// Fiber树
          child      child      child
rootFiber -----> App -----> div -----> p
                                       | sibling       child
                                       | -------> Item -----> li
// DOM树
#root ---> div ---> p
             |
               ---> li

此时DOM节点 p的兄弟节点为 li，而Fiber节点 p对应的兄弟DOM节点为 fiberP.sibling.child
```

### Update

节点更新调用 `commitWork`，会根据 fiber 的 tag 分别处理，重点关注 FunctionComponent 和 HostComponent。

- tag 为 FunctionComponent，调用 `commitHookEffectListUnmount`，顾名思义就是遍历 effectList，执行所有 useLayoutEffect hook 的清理函数。

- tag 为 HostComponent，会调用 `commitUpdate`，最终会调用 `updateDOMProperties`：

```js
for (let i = 0; i < updatePayload.length; i += 2) {
  const propKey = updatePayload[i];
  const propValue = updatePayload[i + 1];
  if (propKey === STYLE) {
    setValueForStyles(domElement, propValue);
  } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
    setInnerHTML(domElement, propValue);
  } else if (propKey === CHILDREN) {
    setTextContent(domElement, propValue);
  } else {
    setValueForProperty(domElement, propKey, propValue, isCustomComponentTag);
  }
}
```

上方就是将 render 阶段 completeWork 中给 Fiber 节点赋值的 updateQueue 对应的内容渲染在页面上。

### Deletion

递归的将 fiber 节点对应的 DOM 节点从页面中删除。

```js
function commitDeletion(
  finishedRoot: FiberRoot,
  current: Fiber,
  renderPriorityLevel: ReactPriorityLevel,
): void {
  if (supportsMutation) {
    // Recursively delete all host nodes from the parent.
    // Detach refs and call componentWillUnmount() on the whole subtree.
    unmountHostComponents(finishedRoot, current, renderPriorityLevel);
  } else {
    // Detach refs and call componentWillUnmount() on the whole subtree.
    commitNestedUnmounts(finishedRoot, current, renderPriorityLevel);
  }
  const alternate = current.alternate;
  detachFiberMutation(current);
  if (alternate !== null) {
    detachFiberMutation(alternate);
  }
}
```

- 递归调用 Fiber 节点及其子孙 Fiber 节点中 fiber.tag 为 ClassComponent 的 componentWillUnmount 生命周期钩子，从页面移除 Fiber 节点对应 DOM 节点
- 解绑 ref
- 调度 `useEffect` 的清理函数

## layout(执行 DOM 操作后)

这阶段在 DOM 渲染完成之后，所以该阶段触发的生命周期钩子和 hook 可以直接访问到已经改变后的 DOM。  
layout 阶段也是递归遍历 effectList。具体执行函数是 `commitLayoutEffects`。

```js
function commitLayoutEffects(root: FiberRoot, committedLanes: Lanes) {
  // ...
  while (nextEffect !== null) {
    const flags = nextEffect.flags;
    // 调度生命周期钩子和hook
    if (flags & (Update | Callback)) {
      const current = nextEffect.alternate;
      // 原名为 commitLifeCycles, 引入后改了别名
      commitLayoutEffectOnFiber(root, current, nextEffect, committedLanes);
    }
    // 更新 ref
    if (flags & Ref) {
      commitAttachRef(nextEffect);
    }
    nextEffect = nextEffect.nextEffect;
  }
  // ...
}
```

首先，`commitLifeCycles` 也是根据 fiber.tag 去分别处理：

- 对于 ClassComponent，他会通过 current === null?区分是 mount 还是 update，调用 componentDidMount 或 componentDidUpdate。`this.setState` 如果有第二个参数，也会在此时调用。
- 对于 FunctionComponent 及相关类型[^1]，他会调用 useLayoutEffect hook 的回调函数，调度 useEffect 的销毁与回调函数。
  > useEffect 是在 beforeMutation 阶段调度，其清理函数是在 mutation 调度，而他们的执行都是在 layout 阶段完成后才异步执行的。  
  > useLayoutEffect 则是在 mutation 阶段 update 操作内执行上一轮更新的清理函数，在 layout 阶段执行它的回调函数。相比之下没有调度这一步。
- 对于 HostRoot，即 rootFiber，如果赋值了第三个参数回调函数，也会在此时调用。
  ```JSX
  ReactDOM.render(<App />, document.querySelector("#root"), function() {
    console.log("i am mount~");
  })
  ```

`commitLayoutEffects` 做的第二件事就是 `commitAttachRef`: 获取 DOM 实例，更新 ref。  
layout 阶段结束。

注意点: fiberRootNode 的 current 指针切换时机 -- mutation 和 layout 之间：

```js
// 递归 mutation
root.current = finishedWork
// 递归 layout
```

> componentWillUnmount 在 mutation 阶段执行，此时 current Fiber 树还指向前一次更新的 Fiber 树，在生命周期钩子内获取的 DOM 还是更新前的；  
> componentDidMount 和 componentDidUpdate 在 layout 阶段执行，此时 current Fiber 树已经指向更新后的 Fiber 树，在生命周期钩子内获取的 DOM 就是更新后的。

## 参考

- [React 生命周期图](https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/)

[^1]: 相关类型指特殊处理后的 FunctionComponent，比如 ForwardRef、React.memo 包裹的 FunctionComponent

