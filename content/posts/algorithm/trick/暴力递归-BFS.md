---
title: '暴力递归-BFS'
date: 2022-10-09T20:49:13+08:00
lastmod: 2024-03-27
series: [trick]
categories: [algorithm]
---

## 概念

在学习二叉树的时候，层序遍历就是用 BFS 实现的。

从二叉树拓展到多叉树到图，从一个点开始，向四周开始扩散。一般来说，写 BFS 算法都是用「队列」这种数据结构，每次将一个节点周围的所有节点加入队列。

BFS 一大常见用途，就是找 start 到 target 的最近距离，要能把实际问题往这方面转。

```js
// 二叉树中 start 就是 root
function bfs(start, target) {
    const queue = [start]
    const visited = new Set()
    visited.add(start)

    let step = 0
    while (queue.length > 0) {
        const size = queue.length
        for (let i = 0; i < size; ++i) {
            const el = queue.shift()
            if (el === target) return step // '需要的信息'
            const adjs = el.adj() // 泛指获取到 el 的所有相邻元素
            for (let j = 0; j < adjs.length; ++j) {
                if (!visited.has(adjs[j])) {
                    queue.push(adjs[j])
                    visited.push(adjs[j])
                }
            }
        }
        step++
    }
}
```

## 练习

### lc.111 二叉树的最小深度 easy

```js
/**
 * 忍不住上来先来了个 dfs，但不是今天的主角哈😂 ps: 此处用了回溯的思想，也可以用转为子问题的思想
 * @param {TreeNode} root
 * @return {number}
 */
var minDepth = function (root) {
    if (root === null) return 0
    let min = Infinity
    const dfs = (root, deep) => {
        if (root == null) return
        if (root.left == null && root.right == null) {
            min = Math.min(min, deep)
            return
        }
        deep++
        dfs(root.left, deep)
        deep--
        deep++
        dfs(root.right, deep)
        deep--
    }
    dfs(root, 1)
    return min
}
```

```js
/** BFS 版本 */
/**
 * @param {TreeNode} root
 * @return {number}
 */
var minDepth = function (root) {
    // 这里求的就是 root 到 最近叶子结点（target）的距离，明确了这个，剩下的交给手吧~
    if (root === null) return 0
    const queue = [root]
    let deep = 0
    while (queue.length) {
        const size = queue.length
        deep++
        for (let i = 0; i < size; ++i) {
            const el = queue.shift()
            if (el.left === null && el.right === null) return deep
            if (el.left) queue.push(el.left)
            if (el.right) queue.push(el.right)
        }
    }
    return deep
}
```

不得不说，easy 面前还是有点底气的，😄。

### lc.752 打开转盘锁

这道题是中等题，but，真的有点难度，需要好好分析。

首先毫无疑问，是一个穷举题目，其次，题目一个重点是：**每次旋转都只能旋转一个拨轮的一位数字**，这样我们就能抽象出每个节点的相邻节点了， '0000', '1000','9000','0100','0900'......如是题目就转变成了从 '0000' 到 target 的最短路径问题了。

```js
/**
 * @param {string[]} deadends
 * @param {string} target
 * @return {number}
 */
var openLock = function (deadends, target) {
    const queue = ['0000']
    let step = 0
    const visited = new Set()
    visited.add('0000')
    while (queue.length) {
        const size = queue.length
        for (let i = 0; i < size; ++i) {
            const el = queue.shift()
            if (deadends.includes(el)) continue
            if (el === target) return step
            // 把相邻元素加入 queue
            for (let j = 0; j < 4; j++) {
                const up = plusOne(el, j)
                const down = minusOne(el, j)
                !visited.has(up) && queue.push(up), visited.add(up)
                !visited.has(down) && queue.push(down), visited.add(down)
            }
        }
        step++
    }
    return -1
}
// 首先定义 每个转盘 +1，-1 操作
function plusOne(str, i) {
    const arr = str.split('')
    if (arr[i] == '9') {
        arr[i] = '0'
    } else {
        arr[i]++
    }
    return arr.join('')
}
function minusOne(str, i) {
    const arr = str.split('')
    if (arr[i] == '0') {
        arr[i] = '9'
    } else {
        arr[i]--
    }
    return arr.join('')
}
```

> 提一下 「双向 BFS 优化」：传统的 BFS 框架就是从起点开始向四周扩散，遇到终点时停止；而双向 BFS 则是从起点和终点同时开始扩散，当两边有交集的时候停止。[labuladong](https://labuladong.online/algo/essential-technique/bfs-framework-2/#%E5%9B%9B%E3%80%81%E5%8F%8C%E5%90%91-bfs-%E4%BC%98%E5%8C%96)

### lc.773 滑动谜题

又是一个小时候玩过的经典小游戏。

这道题的难点是，初学者是真的想不到怎么做，知道用什么方法的也在把实际问题转为 BFS 问题上犯了难。一点点分析，1. 每次都是空位置 0 做选择，移动相邻的上下左右的元素到 0 位置。

<!-- ```js

``` -->
