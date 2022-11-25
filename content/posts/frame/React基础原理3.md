---
title: 'React基础原理3 - Update'
date: 2022-11-13T10:09:22+08:00
tags: [React]
---

React 工作的整个流程：

```txt
触发状态更新 ---> 创建 Update 对象 ---> 
```

在 JSX 拥有了 ReactElement，ReactElement 进化为 Fiber 后（render 阶段），就要被渲染进入视野了（commit 阶段）。render 阶段是协调器 Reconciler 发挥作用，commit 阶段是渲染器 Renderer 发挥作用。

但是在 render 阶段之前，我们需要一个阶段，去创建 update 对象。

## updateContainer

在 `render --> legacyRenderSubtreeIntoContainer` 方法中，创建完 fiberRoot 后，就会调用 `updateContainer` 方法，创建 Update 对象，并把 update 加入更新队列，最后调度更新。

```JavaScript
export function updateContainer(
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?React$Component<any, any>,
  callback: ?Function
): Lane {
  // 以下代码与创建 update 逻辑无关
  // const current = container.current
  // const eventTime = requestEventTime()
  // const lane = requestUpdateLane(current)
  // if (enableSchedulingProfiler) {
  //   markRenderScheduled(lane)
  // }
  // const context = getContextForSubtree(parentComponent)
  // if (container.context === null) {
  //   container.context = context
  // } else {
  //   container.pendingContext = context
  // }


  const update = createUpdate(eventTime, lane)        // 创建 update
  update.payload = { element }                        // update.payload为需要挂载在根节点的组件

  callback = callback === undefined ? null : callback // callback为ReactDOM.render的第三个参数 —— 回调函数
  if (callback !== null) {
    update.callback = callback
  }

  enqueueUpdate(current, update)                     // 将生成的update加入updateQueue
  scheduleUpdateOnFiber(current, lane, eventTime)    // 调度更新

  return lane
}
```

接下来重点看看这个 update 对象吧。

## update 对象

首先在 React 中，有如下方法可以触发状态更新（排除 SSR 相关）：

- ReactDOM.render —— HostRoot
- this.setState —— ClassComponent
- this.forceUpdate —— ClassComponent
- useState —— FunctionComponent
- useReducer —— FunctionComponent

以上方法的使用场景不同，但是殊途同归，最终都计入同一套更新机制 -- **每次状态更新都会创建一个保存*更新状态*相关内容的对象 -> Update 对象**，在 render 阶段的 beginWork 中会根据 Update 计算新的 state。

上方一共有三种组件，HostRoot 和 ClassComponent 共用一套 Update 数据结构，FunctionComponent 使用另一种 Update 数据结构。

```JavaScript
export function createUpdate(eventTime: number, lane: Lane): Update<*> {
  const update: Update<*> = {
    eventTime,        // 任务时间，通过performance.now()获取的毫秒数
    lane,             // 优先级相关字段

    tag: UpdateState, // 更新的类型 创建时设置为UpdateState UpdateState | ReplaceState | ForceUpdate | CaptureUpdate  ==> 0|1|2|3
    payload: null,    // 更新挂载的数据，不同类型组件挂载的数据不同。对于ClassComponent，payload为this.setState的第一个传参。对于HostRoot，payload为ReactDOM.render的第一个传参。
    callback: null,   // 更新的回调函数，commit阶段layout子阶段的回调函数,比如setState的第二个参数

    next: null,      // 与其他Update连接形成链表
  };
  return update;
}
```

> 注意 Update 的 next 属性是连接这个节点的其他 Update 形成链表，最终保存在对应 Fiber 的 updateQueue 属性上（Fiber 见前一篇文章）。为什么一个节点会有多个 Update 对象呢？很简单，比如多次 setState 就好了呀。

## UpdateQueue 对象

再来看看 UpdateQueue 对象：

```JavaScript
// 在创建 fiberRoot 和 mount 阶段都会调用该方法
export function initializeUpdateQueue<State>(fiber: Fiber): void {
  const queue: UpdateQueue<State> = {
    // 该 Fiber 节点更新前的 state，Update基于该state计算更新后的state
    baseState: fiber.memoizedState,
    // 该 Fiber 节点更新前已保存的 Update，以链表形式存在，链表头为firstBaseUpdate，链表尾为lastBaseUpdate
    // 更新前就有Update 是因为上轮render阶段 低优先级的 Update 计算 state 时被忽略
    firstBaseUpdate: null,
    lastBaseUpdate: null,

    // 触发更新时，产生的Update会保存在shared.pending中形成单向环状链表。
    // 当由Update计算state时这个环会被剪开并连接在lastBaseUpdate后面。
    shared: {
      pending: null,
    },

    // 数组。保存update.callback !== null 的 Update
    effects: null,
  };
  fiber.updateQueue = queue;
}
```

对于 `shared.pending` 关注一下 enqueueUpdate：

```JavaScript
export function enqueueUpdate<State>(fiber: Fiber, update: Update<State>) {
  const updateQueue = fiber.updateQueue
  if (updateQueue === null) {
    // Only occurs if the fiber has been unmounted.
    return
  }

  const sharedQueue: SharedQueue<State> = (updateQueue: any).shared
  const pending = sharedQueue.pending

  /* 下面这段是初始时创建了单向环状链表，后续每次都将pending指向最新的 update */
  /* shared.pending -> updateN ->... -> update2 -> update1 -> updateN */
  if (pending === null) {
    // This is the first update. Create a circular list.
    update.next = update
  } else {
    update.next = pending.next
    pending.next = update  // 此时的pending是上一轮的update
  }

  sharedQueue.pending = update // 始终指向最新的 update
}
```

在进入 render 阶段后，`shared.pending` 会被剪开 接在 `lastBaseUpdate` 之后形成 `baseUpdate` 这个单链表。接下来遍历 · 这个单链表，`fiber.updateQueue.baseState` 为初始 state，依次与遍历到的每个 `Update` 计算并产生新的 `state`。这些步骤发生在 `processUpdateQueue` 里：

```JavaScript
export function processUpdateQueue<State>(
  workInProgress: Fiber,
  props: any,
  instance: any,
  renderLanes: Lanes
): void {
  // This is always non-null on a ClassComponent or HostRoot
  const queue: UpdateQueue<State> = (workInProgress.updateQueue: any)

  hasForceUpdate = false

  let firstBaseUpdate = queue.firstBaseUpdate
  let lastBaseUpdate = queue.lastBaseUpdate

  // Check if there are pending updates. If so, transfer them to the base queue.
  let pendingQueue = queue.shared.pending
  if (pendingQueue !== null) {
    queue.shared.pending = null

    // The pending queue is circular. Disconnect the pointer between first
    // and last so that it's non-circular.
    const lastPendingUpdate = pendingQueue
    const firstPendingUpdate = lastPendingUpdate.next
    lastPendingUpdate.next = null
    // Append pending updates to base queue
    if (lastBaseUpdate === null) {
      firstBaseUpdate = firstPendingUpdate
    } else {
      lastBaseUpdate.next = firstPendingUpdate
    }
    lastBaseUpdate = lastPendingUpdate

    // If there's a current queue, and it's different from the base queue, then
    // we need to transfer the updates to that queue, too. Because the base
    // queue is a singly-linked list with no cycles, we can append to both
    // lists and take advantage of structural sharing.
    const current = workInProgress.alternate
    if (current !== null) {
      // This is always non-null on a ClassComponent or HostRoot
      const currentQueue: UpdateQueue<State> = (current.updateQueue: any)
      const currentLastBaseUpdate = currentQueue.lastBaseUpdate
      if (currentLastBaseUpdate !== lastBaseUpdate) {
        if (currentLastBaseUpdate === null) {
          currentQueue.firstBaseUpdate = firstPendingUpdate
        } else {
          currentLastBaseUpdate.next = firstPendingUpdate
        }
        currentQueue.lastBaseUpdate = lastPendingUpdate
      }
    }
  }

  // These values may change as we process the queue.
  if (firstBaseUpdate !== null) {
    // Iterate through the list of updates to compute the result.
    let newState = queue.baseState
    let newLanes = NoLanes

    let newBaseState = null
    let newFirstBaseUpdate = null
    let newLastBaseUpdate = null

    let update = firstBaseUpdate
    do {
      const updateLane = update.lane
      const updateEventTime = update.eventTime
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        // Priority is insufficient. Skip this update. If this is the first
        // skipped update, the previous update/state is the new base
        // update/state.
        const clone: Update<State> = {
          eventTime: updateEventTime,
          lane: updateLane,

          tag: update.tag,
          payload: update.payload,
          callback: update.callback,

          next: null
        }
        if (newLastBaseUpdate === null) {
          newFirstBaseUpdate = newLastBaseUpdate = clone
          newBaseState = newState
        } else {
          newLastBaseUpdate = newLastBaseUpdate.next = clone
        }
        // Update the remaining priority in the queue.
        newLanes = mergeLanes(newLanes, updateLane)
      } else {
        // This update does have sufficient priority.

        if (newLastBaseUpdate !== null) {
          const clone: Update<State> = {
            eventTime: updateEventTime,
            // This update is going to be committed so we never want uncommit
            // it. Using NoLane works because 0 is a subset of all bitmasks, so
            // this will never be skipped by the check above.
            lane: NoLane,

            tag: update.tag,
            payload: update.payload,
            callback: update.callback,

            next: null
          }
          newLastBaseUpdate = newLastBaseUpdate.next = clone
        }

        // Process this update.
        newState = getStateFromUpdate(workInProgress, queue, update, newState, props, instance)
        const callback = update.callback
        if (callback !== null) {
          workInProgress.flags |= Callback
          const effects = queue.effects
          if (effects === null) {
            queue.effects = [update]
          } else {
            effects.push(update)
          }
        }
      }
      update = update.next
      if (update === null) {
        pendingQueue = queue.shared.pending
        if (pendingQueue === null) {
          break
        } else {
          // An update was scheduled from inside a reducer. Add the new
          // pending updates to the end of the list and keep processing.
          const lastPendingUpdate = pendingQueue
          // Intentionally unsound. Pending updates form a circular list, but we
          // unravel them when transferring them to the base queue.
          const firstPendingUpdate = ((lastPendingUpdate.next: any): Update<State>)
          lastPendingUpdate.next = null
          update = firstPendingUpdate
          queue.lastBaseUpdate = lastPendingUpdate
          queue.shared.pending = null
        }
      }
    } while (true)

    if (newLastBaseUpdate === null) {
      newBaseState = newState
    }

    queue.baseState = ((newBaseState: any): State)
    queue.firstBaseUpdate = newFirstBaseUpdate
    queue.lastBaseUpdate = newLastBaseUpdate

    // Set the remaining expiration time to be whatever is remaining in the queue.
    // This should be fine because the only two other things that contribute to
    // expiration time are props and context. We're already in the middle of the
    // begin phase by the time we start processing the queue, so we've already
    // dealt with the props. Context in components that specify
    // shouldComponentUpdate is tricky; but we'll have to account for
    // that regardless.
    markSkippedUpdateLanes(newLanes)
    workInProgress.lanes = newLanes
    workInProgress.memoizedState = newState
  }
}
```

state 的变化在 render 阶段产生与上次更新不同的 JSX 对象，通过 Diff 算法产生 flags(16 叫 effectTag)，在 commit 阶段渲染在页面上。

## 参考

- [React 源码](https://github.com/facebook/react)
- [卡颂大佬的 React 技术揭秘](https://react.iamkasong.com/)
