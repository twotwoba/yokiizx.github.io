---
title: 'React基础原理2 - Fiber'
date: 2022-11-11T16:16:15+08:00
tags: [React]
---

## Fiber

三大件之一的 Reconciler 在 React16 之后是需要依靠 Fiber 这个数据结构去实现的。

首先 Fiber 自身就是一种数据结构，每个 ReactElement 都对应着一个 Fiber 节点；让 Reconciler 支持任务的不同`优先级`，可中断与恢复，并且恢复后可以复用之前的 `中间状态`。  
相比 ReactElement，Fiber 存储了对应的组件类型和 DOM 节点等信息，以及本次更新中该组件`要改变的状态`和`要更新的动作`。

那么来看看 Fiber 的真实面容：

```JavaScript
function FiberNode(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode,
) {
  /* 作为静态数据结构的属性 */
  this.tag = tag;           // 标记 Fiber 类型 FunctionComponent/ClassComponent/HostRoot...共25种(17.0.2)
  this.key = key;           // ReactElement 里的 key
  this.elementType = null;  // ReactElement.type，也就是我们调用 createElement 的第一个参数
  this.type = null;         // 对于 FunctionComponent，指函数本身，对于ClassComponent，指class，对于HostComponent，指DOM节点tagName
  this.stateNode = null;    // 跟当前Fiber相关的本地状态（比如浏览器环境就是DOM节点）

  /* Fiber 树 */
  this.return = null;       // 指向它在 Fiber 树中的 parent，用来在处理完这个节点之后向上返回
  this.child = null;        // 指向自己的第一个子节点，单链表结构
  this.sibling = null;      // 指向自己的兄弟结构，兄弟节点的return指向同一个父节点
  this.index = 0;           // 在多节点 diff 时会用到, 记录fiber在同级中的索引位置

  this.ref = null;          // ref 属性

  /* 保存本次更新造成的状态改变相关信息  */
  this.pendingProps = pendingProps;   // 新的变动带来的新的props
  this.memoizedProps = null;          // 上一次渲染时的 props
  this.updateQueue = null;            // 该Fiber对应的组件产生的Update会存放在这个队列里面
  this.memoizedState = null;          // 上一次渲染时的 state
  this.dependencies = null;

  this.mode = mode;

  /* 保存本次更新会造成的DOM操作 */
  this.flags = NoFlags;
  this.nextEffect = null;

  this.firstEffect = null;
  this.lastEffect = null;

  /* 调度优先级 */
  this.lanes = NoLanes;        // 2020.05 expirationTime的优先级模型被lanes取代
  this.childLanes = NoLanes;

  this.alternate = null;       // 对应关系： currentFiber <==> workInProgressFiber 在渲染完成之后他们会交换位置
}
```

## Fiber 架构原理

React 中最多存在两条 Fiber 树：

- currentFiber 树，当前在屏幕上内容对应的 Fiber 树
- workInProgressFiber 树，正在内存中构建的 Fiber 树。

```JavaScript
// 两棵树通过 alternate 连接
currentFiber.alternate === workInProgressFiber;
workInProgressFiber.alternate === currentFiber;
```

这两棵树都有各自的 rootFiber，React 应用根节点 FiberRoot 通过 curret 指针在这两个树的 rootFiber 上切换。  
其实就是 ”我长大后，就成了你“，workInProgressFiber 树的最终归属是交给 renderer 拿去渲染后呈现给用户，这个时候就 ”成长“ 为了 currentFiber 树了，而原先的 currentFiber 退居幕后变成了 workInPorgressFiber，等待着下一次”成长“。

## mount/update 流程

```JSX
function App() {
  const [num,setNum] = useState(0)

  return (
    <p onClick={() => setNum(num + 1)}>{num}</p>
  )
}
```

在 ReactDome.render 的时候最终会：

1. 调用 `createFiberRoot`，`new FiberRootNode` 去创建一个根节点，这个根节点暂且称为 `FiberRoot`
2. `createFiberRoot` 内部创建了 `FiberRoot` 后，调用 `createHostRootFiber`，创建 `RootFiber`，并加入初始化更新队列去

   ```JavaScript
   export function createFiberRoot(
    containerInfo: any,
    tag: RootTag,
    ...
    ): FiberRoot {
      const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
      if (enableSuspenseCallback) {
        root.hydrationCallbacks = hydrationCallbacks;
      }

      // 创建未初始化的 rootFiber 并且将 fiberRoot 和 rootFiber 联系起来
      const uninitializedFiber = createHostRootFiber(tag);
      root.current = uninitializedFiber;    // 修改 FiberRoot 指向 RootFiber
      uninitializedFiber.stateNode = root;  // RootFiber 的 stateNode 指向 FiberRoot, stateNode is any.

      // 把未初始化的RootFiber加入初始化更新队列
      initializeUpdateQueue(uninitializedFiber);
      return root;
   }

   // ReactUpdateQueue.old.js
   export function initializeUpdateQueue<State>(fiber: Fiber): void {
    const queue: UpdateQueue<State> = {
      baseState: fiber.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: {
        pending: null,
      },
      effects: null,
    };
    fiber.updateQueue = queue;
   }
   ```

> `fiberRootNode` `是整个应用的根节点，rootFiber` 是 <App/> 所在组件树的根节点。

##### mount

从源码中可以看到，在首屏渲染时，创建了 <mark>fiberRoot</mark> 和 <mark>rootFiber</mark>，此时的页面中还没有挂载任何 DOM，所以 rootFiber 还没有任何子 Fiber 节点。

进入 render 阶段时，根据组件返回的 JSX 在内存中依次创建 Fiber 节点并连接在一起构建 Fiber 树，这就是 workInProgressFiber 树。**每次构建 workInProgressFiber 树时，都会尝试复用 currentFiber 树已有 Fiber 节点的数据，决定是否复用的过程就是 Diff 算法**。

进入 commit 阶段，把 workInProgressFiber 树渲染到页面上，fiberRoot 的 current 指向 workInProgressFiber 树，workInProgressFiber 树变成了 currentFiber 树。
![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202211130020382.png)

##### update

更新时，与 mount 阶段几乎一样，只不过此时的 currentFiber 的 rootFiber 已经有了子节点了，workInProgressFiber 会尽量复用 currentFiber 节点的数据。
![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/202211130020090.png)

## 参考

- [React 源码](https://github.com/facebook/react)
- [卡颂大佬的 React 技术揭秘](https://react.iamkasong.com/)
