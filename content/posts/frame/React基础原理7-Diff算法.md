---
title: 'React基础原理7 - Diff算法'
date: 2022-11-22T17:15:07+08:00
tags: [React]
---

在 render 阶段的 beginWork 如果是 update 最终走入 `reconcileChildFibers`，这个方法就是通过 diff 算法创建新 Fiber 并加上 flags，并尝试复用 currentFiber。

本文学习一下 React 的 diff 算法。  
diff 算法的本质是：JSX 对象和 current Fiber 对比，生成 workInProgress Fiber。

##### 三个限制

首先，两棵树完全对比的时间复杂度是 O(n^3)，是相当消耗性能的，为此，React 的 diff 算法预设了 3 个限制：

- 只对同级元素进行 diff。如果 DOM 节点前后两次更新跨越了层级，不会复用它。
- 不同类型的元素产生不同的树。如果 DOM 节点前后两次更新类型发生了变，会直接销毁它及子节点，并重新建树。
- 可以通过 key 标识哪些子元素在不同的渲染中可能是不变的。

##### reconcileChildFibers

```JavaScript
function reconcileChildFibers(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any,
  lanes: Lanes
): Fiber | null {
  // 获取 newChild 类型 (JSX对象)
  const isObject = typeof newChild === 'object' && newChild !== null

  if (isObject) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE:
        return placeSingleChild(
          reconcileSingleElement(returnFiber, currentFirstChild, newChild, lanes)
        )
      case REACT_PORTAL_TYPE:
        return placeSingleChild(
          reconcileSinglePortal(returnFiber, currentFirstChild, newChild, lanes)
        )
      case REACT_LAZY_TYPE:
        if (enableLazyElements) {
          const payload = newChild._payload
          const init = newChild._init
          // todo: This function is supposed to be non-recursive.
          return reconcileChildFibers(returnFiber, currentFirstChild, init(payload), lanes)
        }
    }
  }
  // 调用 reconcileSingleTextNode 处理单节点
  if (typeof newChild === 'string' || typeof newChild === 'number') {
    return placeSingleChild(
      reconcileSingleTextNode(returnFiber, currentFirstChild, '' + newChild, lanes)
    )
  }
  // 调用 reconcileChildrenArray 处理多节点
  if (isArray(newChild)) {
    return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, lanes)
  }

  // ... 其它 case 省略

  // 以上case都没有命中,就删除节点
  return deleteRemainingChildren(returnFiber, currentFirstChild)
}
```

根据 newChild 的类型进行了不同的处理：

- 类型为 object，或 number，string，代表同级只有一个节点
- 类型为 array，代表同级有多个节点

##### 同级只有一个节点

单个节点，关注一下 `reconcileSingleElement` 这个方法：

```JavaScript
function reconcileSingleElement(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: ReactElement,
  lanes: Lanes
): Fiber {
  const key = element.key
  let child = currentFirstChild

  // 上次更新时的 fiber 是否存在对应的 DOM 节点
  // 1. 存在,进入判断是否可以复用
  while (child !== null) {
    // 先判断key是否相同
    if (child.key === key) {
      // 再根据 fiber 的tag类型做处理
      switch (child.tag) {
        case Fragment: {
          /** ... */
        }
        case Block: {
          /** ... */
        }
        default: {
          // elementType 相同 表示可以复用
          if (child.elementType === element.type) {
            deleteRemainingChildren(returnFiber, child.sibling)
            const existing = useFiber(child, element.props)
            existing.ref = coerceRef(returnFiber, child, element)
            existing.return = returnFiber
            return existing
          }
          break
        }
      }
      // 代码执行到这里代表：key相同但是type不同
      // 将该fiber及其兄弟fiber标记为删除
      deleteRemainingChildren(returnFiber, child)
      break
    } else {
      //  key不同，将该 fiber 标记为删除
      deleteChild(returnFiber, child)
    }
    child = child.sibling
  }

  // 2. 不存在 DOM 节点,直接创建新的 Fiber 并返回
  if (element.type === REACT_FRAGMENT_TYPE) {
    const created = createFiberFromFragment(
      element.props.children,
      returnFiber.mode,
      lanes,
      element.key
    )
    created.return = returnFiber
    return created
  } else {
    const created = createFiberFromElement(element, returnFiber.mode, lanes)
    created.ref = coerceRef(returnFiber, currentFirstChild, element)
    created.return = returnFiber
    return created
  }
}
```

注意：

- 当 key 不相同时，仅把当前 fiber 标记为删除。因为兄弟节点还有可能匹配。
- 当 key 相同，但是 type 不同时，把当前 filber 和兄弟 fiber 都标记为删除。因为 key 确定了就是这个元素，它都没机会，其它的兄弟节点也可以直接干掉了。

例子：

```txt
ul -> li * 3
     ↓
ul -> p  (变成了单个节点)
```

如果 p 没有 key，p 与第一个 li key 不同，还会与后面的两个 li 去比较；  
如果有 key 且和第一个 li 的 key 相同，继续去判断类型，当类型都不一样的时候，直接 li 和后面的两个 li 都标记删除。

##### 同级有多个节点

多个节点的比较，分为三种情况：

1. 节点更新(属性和类型改变)
2. 节点新增/减少
3. 节点位置变化

```JavaScript
function reconcileChildrenArray(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: Array<*>,
  lanes: Lanes
): Fiber | null {
  // This algorithm can't optimize by searching from both ends since we
  // don't have backpointers on fibers. I'm trying to see how far we can get
  // with that model. If it ends up not being worth the tradeoffs, we can
  // add it later.
  let resultingFirstChild: Fiber | null = null // 最终返回,其实就是workInProgress Fiber
  let previousNewFiber: Fiber | null = null    // 链表操作指针,穿针引线用于把一个个新的fiber串联起来

  let oldFiber = currentFirstChild
  let lastPlacedIndex = 0           // 新fiber对应的DOM在页面中的位置,用来处理节点位置的变化
  let newIdx = 0
  let nextOldFiber = null
  // 第一次遍历, oldFiber单恋和newFiber数组进行比较
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    // 修正 oldFiber 的位置和 newFiber 对齐
    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber
      oldFiber = null
    } else {
      nextOldFiber = oldFiber.sibling
    }

    // 比较 oldFiber 和 newChildren[newIdx] 可以复用就返回existing, 不可复用返回null
    const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], lanes)
    if (newFiber === null) {
      if (oldFiber === null) {
        oldFiber = nextOldFiber
      }
      // updateSlot 中会判断key是否相同，如果不同直接返回null，进入这里直接退出循环
      break
    }

    // 如果key相同，会进入updateElement，再判断type是否相同，不同则需要把oldFiber标记删除Deletion
    if (shouldTrackSideEffects) {
      if (oldFiber && newFiber.alternate === null) {
        deleteChild(returnFiber, oldFiber)
      }
    }

    // 链表操作, 把fiber连接起来组成workInProgress Fiber
    if (previousNewFiber === null) {
      resultingFirstChild = newFiber
    } else {
      previousNewFiber.sibling = newFiber
    }
    previousNewFiber = newFiber
    oldFiber = nextOldFiber
  }

  /* ---------- 第一轮遍历结束后 ---------- */
  // 这种情况是 newChildren 遍历完了，把 剩余的oldFiber 都标记为 Deletion
  if (newIdx === newChildren.length) {
    // We've reached the end of the new children. We can delete the rest.
    deleteRemainingChildren(returnFiber, oldFiber)
    return resultingFirstChild
  }

  // oldFiber 遍历完了, 从newIndex的位置继续遍历剩下的 newChildren
  if (oldFiber === null) {
    // If we don't have any more existing children we can choose a fast path
    // since the rest will all be insertions.
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx], lanes)
      if (newFiber === null) {
        continue
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber
      } else {
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
    }
    return resultingFirstChild
  }

  // 剩下的情况是 oldFiber和newChildren都没有遍历完,需要进行位置交换的情况了
  // 所以使用了一个 map ,以 key 为键, 以 Fiber 为值，为了 O(1) 的查找
  // Add all children to a key map for quick lookups.
  const existingChildren = mapRemainingChildren(returnFiber, oldFiber)
  // Keep scanning and use the map to restore deleted items as moves.
  for (; newIdx < newChildren.length; newIdx++) {
    const newFiber = updateFromMap(
      existingChildren,
      returnFiber,
      newIdx,
      newChildren[newIdx],
      lanes
    )
    if (newFiber !== null) {
      if (shouldTrackSideEffects) {
        // newFiber是workInProgress Fiber, 如果复用了 oldFiber, 其alternate不为null
        if (newFiber.alternate !== null) {
          // 复用了 oldFiber 后, 需要将它从 map 中删除
          existingChildren.delete(newFiber.key === null ? newIdx : newFiber.key)
        }
      }
      // 插入
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)

      // 指针操作
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber
      } else {
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
    }
  }

  if (shouldTrackSideEffects) {
    // map 遍历, 如果在上方删除后还有剩余说明这些都不会被用到了,需要被标记为删除
    existingChildren.forEach((child) => deleteChild(returnFiber, child))
  }

  return resultingFirstChild
}
```

进入方法，官方注释就告诉我们，fiber 是单链表没有反向指针，所以一个单链表的 currentFiber tree 和 JSX 对象组成的数组做对比是做不到数组常用的双指针从两端往中间遍历的。现象：** `newChildren[0]` 与 `fiber` 比较，`newChildren[1] `与 `fiber.sibling` 比较。**

进入函数体内，当未知长度 oldFiber 单链表和未知大小的 newChildren 数组比较的时候，会出现四种情况：

- oldFiber 单链表和 newChildren 数组同时遍历完了
- oldFiber 单链表遍历完了，newChildren 数组没有遍历完
- oldFiber 单链表没有遍历完，newChildren 数组遍历完了
- oldFiber 单链表和 newCildren 数组都没有遍历完

`reconcileChildrenArray` 巧妙的处理了上方的各种情况，大概说下流程：

1. 第一次进入 for 循环的时候，遍历比较 `oldFiber` 和 `newChildren[newIdx]` 查看是否可以复用，**优先处理的是更新操作**。

   - 可以复用就返回 `existing`。
   - 不可复用返回 null。
     - `updateSlot` 会先判断 key 是否相同，不相同直接返回 null，会 break 退出循环
     - 如果 key 相同会再进入 `updateElement`等，这里会判断 type 是否相同，如果 type 不相同，会将 oldFiber 标记为 DELETION，并继续遍历

2. 当 oldFiber 为 null 或 `newIdx === newChildren.length` 时(即 oldFiber 单链表遍历完/newChildren 遍历完/同时遍历完)，本轮循环结束，继续往下走~

3. 当从第一轮循环退出时，上方说的四种情况就出现了。

   - 都遍历完了，diff 结束

   - newChildren 遍历完， oldFiber 没有遍历完，把剩下的所有 oldFiber 标记为 `DELETION`
     ```JavaScript
     if (newIdx === newChildren.length) {
        // We've reached the end of the new children. We can delete the rest.
        deleteRemainingChildren(returnFiber, oldFiber);
        return resultingFirstChild;
     }
     ```
   - oldFiber 遍历完，newChildren 没有遍历完，剩下的 newChildren 可以全部为插入
     ```JavaScript
     // oldFiber 遍历完了, 从newIndex的位置继续遍历剩下的 newChildren，
     // 剩下的全部是可以直接 PLACEMENT 的
     if (oldFiber === null) {
        // for 循环，接着第一轮退出来时的 newIdx 位置开始，
        return resultingFirstChild
     }
     ```
   - 都未遍历完，找到移动的节点，并插入正确的位置，就是

     ```JavaScript
     // 能走到这里，说明单链和数组都没有遍历完，那么一定是发生了位置的变换
     const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
     ```

     为了复用仅仅是移动了位置的 fiber，`mapRemainingChildren` 用 key 作为 map 的 key，用 fiber 作为 value，返回了 `existingChildren` 这个 map 对象，这样查询的时候，就能做到 O(1)的时间复杂度了。  
     接着对 newChildren 进行遍历， 通过`updateFromMap`找到位置变动但是可以复用的 fiber，若存在，同时从 `existingChildren` 中删除对应的 k-v 映射。

     找到可复用节点之后要插入正确的位置，是通过比较 `lastPlacedIndex` 和 `oldIndex`。

     ```JavaScript
     // placeChild 主要逻辑
     newFiber.index = newIndex;          // 把新的位置给newFiber
     const current = newFiber.alternate;
     if (current !== null) {
      const oldIndex = current.index;    // 找到旧的索引
      if (oldIndex < lastPlacedIndex) {  // 旧的索引和最后一个可复用节点的位置进行比较
        // This is a move.
        newFiber.flags = Placement;      // 需要移动到后面
        return lastPlacedIndex;
      } else {
        // This item can stay in place.
        return oldIndex;                 // 无需移动, 同时返回oldIndex
      }
     } else {
      // This is an insertion.
      newFiber.flags = Placement;
      return lastPlacedIndex;
     }
     ```

     最后，如果 `existingChildren` 不为空，说明剩下的 oldFiber 也都无用，需要被标记为 DELETION：

     ```JavaScript
     existingChildren.forEach((child) => deleteChild(returnFiber, child))
     ```

多节点举例巩固一下：

1. abcd --> acdb (字母表示 key)

```JavaScript
===第一轮遍历开始===
a（之后）vs a（之前）
key不变，可复用
此时 a 对应的oldFiber（之前的a）在之前的数组（abcd）中索引为0
所以 lastPlacedIndex = 0;

继续第一轮遍历...

c（之后）vs b（之前）
key改变，不能复用，跳出第一轮遍历
此时 lastPlacedIndex === 0;
===第一轮遍历结束===

===第二轮遍历开始===
newChildren === cdb，没用完，不需要执行删除旧节点
oldFiber === bcd，没用完，不需要执行插入新节点

将剩余oldFiber（bcd）保存为map

// 当前oldFiber：bcd
// 当前newChildren：cdb

继续遍历剩余newChildren

key === c 在 oldFiber中存在
const oldIndex = c（之前）.index;
此时 oldIndex === 2;  // 之前节点为 abcd，所以c.index === 2
比较 oldIndex 与 lastPlacedIndex;

如果 oldIndex >= lastPlacedIndex 代表该可复用节点不需要移动
并将 lastPlacedIndex = oldIndex;
如果 oldIndex < lastplacedIndex 该可复用节点之前插入的位置索引小于这次更新需要插入的位置索引，代表该节点需要向右移动

在例子中，oldIndex 2 > lastPlacedIndex 0，
则 lastPlacedIndex = 2;
c节点位置不变

继续遍历剩余newChildren

// 当前oldFiber：bd
// 当前newChildren：db

key === d 在 oldFiber中存在
const oldIndex = d（之前）.index;
oldIndex 3 > lastPlacedIndex 2 // 之前节点为 abcd，所以d.index === 3
则 lastPlacedIndex = 3;
d节点位置不变

继续遍历剩余newChildren

// 当前oldFiber：b
// 当前newChildren：b

key === b 在 oldFiber中存在
const oldIndex = b（之前）.index;
oldIndex 1 < lastPlacedIndex 3 // 之前节点为 abcd，所以b.index === 1
则 b节点需要向右移动
===第二轮遍历结束===


```

最终 acd 3 个节点都没有移动，b 节点被标记为移动

2. abcd --> dabc (字母表示 key)

```JavaScript
===第一轮遍历开始===
d（之后）vs a（之前）
key改变，不能复用，跳出遍历
===第一轮遍历结束===

===第二轮遍历开始===
newChildren === dabc，没用完，不需要执行删除旧节点
oldFiber === abcd，没用完，不需要执行插入新节点

将剩余oldFiber（abcd）保存为map

继续遍历剩余newChildren

// 当前oldFiber：abcd
// 当前newChildren dabc

key === d 在 oldFiber中存在
const oldIndex = d（之前）.index;
此时 oldIndex === 3; // 之前节点为 abcd，所以d.index === 3
比较 oldIndex 与 lastPlacedIndex;
oldIndex 3 > lastPlacedIndex 0
则 lastPlacedIndex = 3;
d节点位置不变

继续遍历剩余newChildren

// 当前oldFiber：abc
// 当前newChildren abc

key === a 在 oldFiber中存在
const oldIndex = a（之前）.index; // 之前节点为 abcd，所以a.index === 0
此时 oldIndex === 0;
比较 oldIndex 与 lastPlacedIndex;
oldIndex 0 < lastPlacedIndex 3
则 a节点需要向右移动

继续遍历剩余newChildren

// 当前oldFiber：bc
// 当前newChildren bc

key === b 在 oldFiber中存在
const oldIndex = b（之前）.index; // 之前节点为 abcd，所以b.index === 1
此时 oldIndex === 1;
比较 oldIndex 与 lastPlacedIndex;
oldIndex 1 < lastPlacedIndex 3
则 b节点需要向右移动

继续遍历剩余newChildren

// 当前oldFiber：c
// 当前newChildren c

key === c 在 oldFiber中存在
const oldIndex = c（之前）.index; // 之前节点为 abcd，所以c.index === 2
此时 oldIndex === 2;
比较 oldIndex 与 lastPlacedIndex;
oldIndex 2 < lastPlacedIndex 3
则 c节点需要向右移动

===第二轮遍历结束===
```

- TODO 和 vue 的 diff 比较
