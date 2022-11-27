---
title: 'React -- Hooks'
date: 2022-11-27T11:28:43+08:00
tags: [React]
---

> React 需要为共享状态逻辑提供更好的原生途径。**Hook 使你在无需修改组件结构的情况下复用状态逻辑** --- React 官网

> 你可以从 React 的 LOGO 中看到这些围绕着核心的电子飞行轨道，Hooks 可能一直就在其中。 --- Dan

## hook 工作原理

从 `useState` 入手：

```JSX
const [demo, setDemo] = useState({name: 'yokiizx', age: 18})

<div>
  {demo.name}
  <button onClick={() => setDemo({age: 35})}>
</div>
```

组件更新 `useState` 的工作主要分为两种：

- mount：调用 `ReactDOM.render`/`ReactDOM.createRoot().render()` 引起的更新，更新内容为 初始化值
- update：setXxx 引起的更新，更新内容为 setXxx 创建的 Update。

##### Update

重点之一是 Update，这个在之前学习过：HostRoot 和 ClassComponent 共用一套 Update 数据结构，回顾一下：

```JavaScript
export type Update<State> = {|
  eventTime: number,     // 任务时间，通过performance.now()获取的毫秒数
  lane: Lane,            // 优先级相关字段

  tag: 0 | 1 | 2 | 3,    // 四种更新类型 UpdateState | ReplaceState | ForceUpdate | CaptureUpdate
  payload: any,          // 更新挂载的数据:ClassComponent挂载的this.setState 的第一个参数;HostRoot挂载的ReactDOM.render的第一个参数
  callback: (() => mixed) | null,

  next: Update<State> | null,  // 与其他Update连接形成链表（比如连续setState了几下）
|};

type SharedQueue<State> = {|
  pending: Update<State> | null,  // Update 组成的环状链表
|};
// Update 最终被加入 UpdateQueue 对象中，而 fiber 保存的就是这个 updateQueue
export type UpdateQueue<State> = {|
  // 更新前状态，初始化为fiber.memoizedState
  baseState: State,
  firstBaseUpdate: Update<State> | null,
  lastBaseUpdate: Update<State> | null,
  // enqueueUpdate时把Update组装成单向环状链表
  shared: SharedQueue<State>,
  // 数组。保存update.callback !== null 的 Update, 在commit layout阶段执行
  effects: Array<Update<State>> | null,
|};
```

而 Hook 使用的是另一种 Update 数据结构：

```JavaScript
// ReactFiberHooks.old.js
type Update<S, A> = {|
  lane: Lane,
  action: A,   // 更新函数，如 () => setDemo({age: 35})
  eagerReducer: ((S, A) => S) | null,
  eagerState: S | null,
  next: Update<S, A>,
  priority?: ReactPriorityLevel,
|};

type UpdateQueue<S, A> = {|
  pending: Update<S, A> | null,  // 同样的,也是单向环状链表，dispatchAction 时把Update接入
  dispatch: (A => mixed) | null, // 保存 dispatchAction.bind() 的值
  lastRenderedReducer: ((S, A) => S) | null, // 上一次render时使用的reducer
  lastRenderedState: S | null,   // 上一次render时的state
|};
```

##### UpdateQueue 存储位置

更新产生的 Update 保存在 UpdateQueue 中，classComponent 的实例可以存储数据，它的 UpdateQueue 放在对应的 fiber.updateQueue；而 Hook 的 UpdateQueue 放在数据结构如下的 Hook 的 queue 中：

```ts
export type Hook = {|
  memoizedState: any, // 存储 hook 对应的数据
  baseState: any,
  baseQueue: Update<any, any> | null,
  queue: UpdateQueue<any, any> | null,
  next: Hook | null, // 连接 hook 组成单向链表
|};

/**
 * 不同 hook，Hook.memoizedState 保存的是不同类型数据
*                                                    memoizedState
 * const [state, setState] = useStaet(state)         存的是 state 的值
 * const [state, dispatch] = useReducer(recuder, {}) 存的是 state 的值
 * useRef(1)                                         存的是 {current: 1}
 * useMemo(callback, [depA])                         存的是 [callback(), depA]
 * useCallback(callback, [depA])                     存的是 [callback, depA]
 *
 * useMemo 和 useCallback 的区别显而易见：
 * 前者存的是 callback 执行后的结果；后者存的是 callback 函数本身
 *
 * useContext 没有 memoizedState
 * /
```

而 Hook 又存在 fiber.memoizedState：

```ts
const fiber = {
  // 注意 Fiber 保存的是该FunctionComponent对应的 Hooks 链表
  memoizedState: null,
  // 指向 App 函数
  stateNode: App
  // ... others
}
```

注意区分关系：

- Fiber 对应的是组件
- Hook 对应的是 hook 函数
- Update 是更新过程创建出的对象
  - ClassComponent 把 UpdateQueue 挂载到 Fiber.updateQueue；
  - FunctionComponent 把 UpdateQueue 挂在到 Hook.updateQueue；而 Hook 挂载在 Fiber.memoizedState。

##### 进入 render 阶段

`dispatchAction` 最终会去调用 `scheduleUpdateOnFiber` 进入调度更新阶段。在 `beginWork` 时，对 `FunctionComponent` 调用 `updateFunctionComponent` 函数，最终调用 `renderWithHooks` 这个方法。

```JavaScript
export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
    // ... 省略其他代码
    // 设置全局变量 ReactCurrentDispatcher
    ReactCurrentDispatcher.current =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;
    // ...
}
```

##### dispatcher

从上方可知：**Hook 在 mount 和 update 阶段调用的完全不同的函数**：

```TS
const HooksDispatcherOnMount: Dispatcher = {
  useCallback: mountCallback,
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: mountImperativeHandle,
  useLayoutEffect: mountLayoutEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
  // ...
};

const HooksDispatcherOnUpdate: Dispatcher = {
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState,
  // ...
};
```

可以看见，在 `FunctionComponent` 渲染之前，根据 mount/update 先指定了 `dispatcher` 给 `ReactCurrentDispatcher.current`，等到渲染的时候，就从当前的 dispatcher 中寻找需要的 hook。

> dispatcher 不仅仅只有上方两种，比如 useEffect 就会把 `ReactCurrentDispatcher.current` 指向 `ContextOnlyDispatcher`，而 `ContextOnlyDispatcher` 的 hook 都会调用 `throwInvalidHookError` 抛错。这就是为什么不能在 `useEffect` 内调用其他 hook 的原因。

## 各个 Hook

##### useState 和 useReducer

如上，这两个 hook 调用的时候也分 mount 和 update 阶段。

1. mount

```TS
function mountReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  // 1. 创建并返回当前 hook
  const hook = mountWorkInProgressHook();
  // 2. 初始化 state
  let initialState;
  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = ((initialArg: any): S);
  }
  hook.memoizedState = hook.baseState = initialState;
  // 3. 创建 queue
  const queue = (hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: (initialState: any),
  });
  // 4. 创建 dispatch ==> dispatchAction.bind() 的结果
  const dispatch: Dispatch<A> = (queue.dispatch = (dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));
  return [hook.memoizedState, dispatch];
}
function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  // 1. 创建当前 hook
  const hook = mountWorkInProgressHook();
  // 2. 初始化 state
  if (typeof initialState === 'function') {
    // $FlowFixMe: Flow doesn't like mixed types
    initialState = initialState();
  }
  hook.memoizedState = hook.baseState = initialState;
  // 3. 创建 queue
  const queue = (hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: (initialState: any),
  });
  // 4. 创建 dispatcher
  const dispatch: Dispatch<BasicStateAction<S>> = (queue.dispatch = (dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));
  return [hook.memoizedState, dispatch];
}
```

可见，`useState` 和 `useReducer` 基本是相同，只是两者 `queue` 的 `lastRenderedReducer` 不同。

- useReducer 使用的是传入的 reducer
- useState 使用的是 `basicStateReducer`
  ```TS
  function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
    // $FlowFixMe: Flow doesn't like mixed types
    return typeof action === 'function' ? action(state) : action;
  }
  ```

2. update

```TS
function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  // 获取当前hook
  const hook = updateWorkInProgressHook(); // 该方法防止循环更新
  const queue = hook.queue;

  queue.lastRenderedReducer = reducer;

  // ...同update与updateQueue类似的更新逻辑

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}
function updateState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  return updateReducer(basicStateReducer, (initialState: any));
}
```

一句话：找到对应 hook，根据 update 计算该 hook 新的 state 并返回。

注意：初始化阶段也是有可能调用 `setXxx` 引起更新的，那么就会引起新的更新，从而产生无限循环更新，为了防止这种情况，React 使用 `didScheduleRenderPhaseUpdate` 判断是否是 `render阶段` 触发的更新。

调用时，回去触发 `dispatchAction`：

```TS
function dispatchAction(fiber, queue, action) {

  // ...创建update
  var update = {
    eventTime: eventTime,
    lane: lane,
    suspenseConfig: suspenseConfig,
    action: action,
    eagerReducer: null,
    eagerState: null,
    next: null
  };

  // ...将update加入queue.pending

  var alternate = fiber.alternate;

  // currentlyRenderingFiber 即 workInProgress fiber
  if (fiber === currentlyRenderingFiber$1 || alternate !== null && alternate === currentlyRenderingFiber$1) {
    // render阶段触发的更新
    didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
  } else {
    if (fiber.lanes === NoLanes && (alternate === null || alternate.lanes === NoLanes)) {
      // ...fiber的updateQueue为空，优化路径
    }

    scheduleUpdateOnFiber(fiber, lane, eventTime);
  }
}
```

一句话：创建 Update，并把它加入 queue.pending 中，然后开启调度更新。

##### useEffect

TODO

## 参考

- [React 官网](https://zh-hans.reactjs.org/docs/hooks-intro.html)
