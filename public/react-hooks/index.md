# React -- Hooks


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

### Update

重点之一是 Update，这个在之前学习过：HostRoot 和 ClassComponent 共用一套 Update 数据结构，回顾一下：

```js
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

```js
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

### UpdateQueue 存储位置

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

### 进入 render 阶段

`dispatchAction` 最终会去调用 `scheduleUpdateOnFiber` 进入调度更新阶段。在 `beginWork` 时，对 `FunctionComponent` 调用 `updateFunctionComponent` 函数，最终调用 `renderWithHooks` 这个方法。

```js
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

### dispatcher

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

### useState 和 useReducer

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

### useEffect

先看一下 Effect 这个数据结构：

```TS
export type Effect = {|
  tag: HookFlags,
  create: () => (() => void) | void, // 返回的函数就是清理函数
  destroy: (() => void) | void,
  deps: Array<mixed> | null,
  next: Effect,
|};
```

当初一开始学 React，有人说可以类比 class 组件的生命周期，现在看来，这么理解实际上是不好的，不能帮我们认清真正的 React hook 逻辑。

回顾之前的源码学习，`useEffect` 是在 `commit` 阶段执行相关逻辑的：

- `beforeMutation` 阶段内 `调度useEffect`；遍历并执行上一轮 render 的清理函数
  - 执行 `flushPassiveEffects`，该方法设置优先级，并执行 `flushPassiveEffectsImpl`
  - `flushPassiveEffectsImpl` 方法内从全局变量 `rootWithPendingPassiveEffects` 获取 `effectList`
- `mutation` 阶段内 `调度useEffect的清理函数`
- `layout` 阶段之后 执行之前的调度后的回调函数和清理函数

对比 `useLayoutEffect`：

- `mutation` 阶段的 update 操作内执行上一轮更新的清理函数
- `layout` 后执行回调函数

**useEffect 清理函数和回调函数的执行：**  
`useEffect|useLayoutEffect` 的执行需要保证所有组件 `useEffect` 的*清理函数必须都执行完后*才能执行任意一个组件的 `useEffect` 的回调函数 --- 否则其他组件可能会产生影响，比如多个组件间可能共用同一个 `ref`。如果不按照 `全销毁再--->全执行` 的顺序，假如某个清理函数内修改了 `ref.current`，会影响到其它组件中 `useEffect` 回调函数中相同 ref 的 current 属性。

- 清理函数的执行

```js
// pendingPassiveHookEffectsUnmount 中保存了所有需要执行销毁的 useEffect
const unmountEffects = pendingPassiveHookEffectsUnmount;
  pendingPassiveHookEffectsUnmount = [];
  for (let i = 0; i < unmountEffects.length; i += 2) {
    const effect = ((unmountEffects[i]: any): HookEffect); // 偶数存 effect
    const fiber = ((unmountEffects[i + 1]: any): Fiber);   // 奇数存 fiber
    const destroy = effect.destroy;
    effect.destroy = undefined;

    if (typeof destroy === 'function') {
      try {
        startPassiveEffectTimer();
        //销毁上一轮 render 的 effect
        destroy();
      } finally {
        recordPassiveEffectDuration(fiber);
      }
    }
  }
```

这里 `pendingPassiveHookEffectsUnmount` 是在 commit layout 阶段通过 `commitLayoutEffectOnFiber` 即 `commitLifeCycles` 中的`schedulePassiveEffects` 方法向其内 push 数据：

```TS
function schedulePassiveEffects(finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      const {next, tag} = effect;
      if (
        (tag & HookPassive) !== NoHookEffect &&
        (tag & HookHasEffect) !== NoHookEffect
      ) {
        // 向`pendingPassiveHookEffectsUnmount`数组内`push`要销毁的effect
        enqueuePendingPassiveHookEffectUnmount(finishedWork, effect);
        // 向`pendingPassiveHookEffectsMount`数组内`push`要执行回调的effect
        enqueuePendingPassiveHookEffectMount(finishedWork, effect);
      }
      effect = next;
    } while (effect !== firstEffect);
  }
}
```

- 回调函数的执行

```js
const mountEffects = pendingPassiveHookEffectsMount;
pendingPassiveHookEffectsMount = [];
for (let i = 0; i < mountEffects.length; i += 2) {
  const effect = ((mountEffects[i]: any): HookEffect);
  const fiber = ((mountEffects[i + 1]: any): Fiber);
  try {
    const create = effect.create;
    if (
      enableProfilerTimer &&
      enableProfilerCommitHooks &&
      fiber.mode & ProfileMode
    ) {
      try {
        startPassiveEffectTimer();
        effect.destroy = create(); // 执行回调函数并 创建 新的清理函数
      } finally {
        recordPassiveEffectDuration(fiber);
      }
    } else {
      effect.destroy = create();
    }
  } catch (error) {
    captureCommitPhaseError(fiber, error);
  }
}
```

### useRef

`ref` 是 `reference`(引用) 的缩写，在 Vue 和 React 中都有它的一席之地，最初的习惯是用它来保存 DOM，进而进行一些 DOM 操作。实际上，任何需要被引用的数据都可以保存到 `ref` 中。

`useRef(state)` 对应 hook 的 `memoizedState` 保存的就是 `{current: state}`。

```js
function mountRef<T>(initialValue: T): {|current: T|} {
  // 获取当前useRef hook
  const hook = mountWorkInProgressHook();
  // 创建ref
  const ref = {current: initialValue};
  hook.memoizedState = ref;
  return ref;
}

function updateRef<T>(initialValue: T): {|current: T|} {
  // 获取当前useRef hook
  const hook = updateWorkInProgressHook();
  // 返回保存的数据
  return hook.memoizedState;
}
```

可见，useRef 就是返回一个形如 `{current: state}` 这么个对象。

**Ref 的工作流程**

- render 阶段给 fiber 添加 Ref flags

```js
// beginWork
function markRef(current: Fiber | null, workInProgress: Fiber) {
  const ref = workInProgress.ref;
  if (
    (current === null && ref !== null) ||
    (current !== null && current.ref !== ref)
  ) {
    // Schedule a Ref effect
    workInProgress.flags |= Ref;
  }
}
// completeWork
function markRef(workInProgress: Fiber) {
  workInProgress.flags |= Ref;
}
```

- commit 阶段对具有 Ref flags 的 fiber 执行对应的操作

```js
// commit mutation 阶段对于ref属性改变的情况会先移除之前的 ref
function commitDetachRef(current: Fiber) {
  const currentRef = current.ref;
  if (currentRef !== null) {
    if (typeof currentRef === 'function') {
      // function类型ref，调用他，传参为null
      currentRef(null);
    } else {
      // 对象类型ref，current赋值为null
      currentRef.current = null;
    }
  }
}
// commit layout阶段 会进行 ref 赋值
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    // 获取ref属性对应的Component实例
    const instance = finishedWork.stateNode;
    let instanceToUse;
    switch (finishedWork.tag) {
      case HostComponent:
        instanceToUse = getPublicInstance(instance);
        break;
      default:
        instanceToUse = instance;
    }

    // 赋值ref
    if (typeof ref === 'function') {
      ref(instanceToUse);
    } else {
      ref.current = instanceToUse;
    }
  }
}
```

### useMemo 和 useCallback

这两 hook，最大的区别从 hook.memoizedState 存储值就能看出区别：

- useMemo：将回调函数的结果作为 value 保存
- useCallback：将回调函数作为 value 保存

```TS
// mount
function mountMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  // 创建并返回当前hook
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  // 计算value
  const nextValue = nextCreate();
  // 将value与deps保存在hook.memoizedState
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
function mountCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  // 创建并返回当前hook
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  // 将value与deps保存在hook.memoizedState
  hook.memoizedState = [callback, nextDeps];
  return callback;
}
// update
function updateMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  // 返回当前hook
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;

  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1];
      // 判断update前后value是否变化
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 未变化
        return prevState[0];
      }
    }
  }
  // 变化，重新计算value
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
function updateCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  // 返回当前hook
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;

  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1];
      // 判断update前后value是否变化
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 未变化
        return prevState[0];
      }
    }
  }

  // 变化，将新的callback作为value
  hook.memoizedState = [callback, nextDeps];
  return callback;
}
```

## 参考

- [React 官网](https://zh-hans.reactjs.org/docs/hooks-intro.html)
- [React 博客](https://zh-hans.reactjs.org/blog/2020/08/10/react-v17-rc.html#effect-cleanup-timing)
- [Dan blog - A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)

