---
title: 'JS类常见一般算法题'
date: 2022-09-23T14:32:40+08:00
tags: [algorithm]
---

记录一下非力扣，但是是 JS 常见的一般类算法题，比较简单。

##### tree/扁平化互换

题目：

```JavaScript
// 扁平数组
const arr = [
 {id: 1, name: '1', pid: 0},
 {id: 2, name: '2', pid: 1},
 {id: 3, name: '3', pid: 1},
 {id: 4, name: '4', pid: 3},
 {id: 5, name: '5', pid: 3},
]
// tree
const tree = [
  {
    id: 1,
    name: '1',
    pid: 0,
    children: [
      {
        id: 2,
        name: '2',
        pid: 1,
        children: []
      },
      {
        id: 3,
        name: '3',
        pid: 1,
        children: [
          {
            id: 4,
            name: '4',
            pid: 3,
            children: []
          }
        ]
      }
    ]
  }
]
```

---

规律不要太明显，最容易想到的就是递归喽~

```JavaScript
// tree扁平化 就是个树的遍历而已
function treeToArr(tree) {
  const res = []
  const getChilden = tree => {
    for (const node of tree) {
      const { id, name, pid } = node
      res.push({ id, name, pid })
      if (node.children) getChilden(node.children)
    }
  }
  getChilden(tree)
  return res
}
```

---

扁平化转树，往往有些人写不出来，是因为对于递归不够熟悉。如果能够联想到使用 pid 去寻找子集，那么我觉得还是比较容易的吧。

```JavaScript
// 扁平化转tree
function arrToTree(arr) {
  const res = []
  // 递归: 根据pid寻找子节点塞入child
  const getChildren = (pid, child) => {
    for (const item of arr) {
      if (item.pid === pid) {
        const newItem = { ...item, children: [] }
        getChildren(newItem.id, newItem.children)
        child.push(newItem)
      }
    }
  }
  getChildren(0, res)
  return res
}
```

上方是写出来了，但是呢，这个复杂度有点高，怎么优化呢？往往需要借助数据结构 Map：

```JavaScript
function arrToTree(arr) {
  const res = []
  const map = new Map() // 便于查找

  for (const item of arr) {
    map.set(item.id, { ...item, children: [] })
  }

  for (const item of arr) {
    const newItem = map.get(item.id)
    if (item.pid === 0) {
      res.push(newItem)
    } else {
      if (map.has(item.pid)) {
        map.get(item.pid).children.push(newItem)
      }
    }
  }
  return res
}
```
