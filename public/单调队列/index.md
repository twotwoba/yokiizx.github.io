# 单调队列


### 概念

栈有单调栈，队列自然也有单调队列，性质也是一样的，保持队列内的元素有序，单调递增或递减。

其实动态求极值首先可以联想到的应该是 「优先队列」，但是，优先队列无法满足**「先进先出」**的时间顺序，所以单调队列应运而生。

```js
// 关键点, 保持单调性，其拍平效果与单调栈一致
while (q.length && num (<= | >=) q[q.length - 1]) {
    q.pop()
}
q.push(num)
```

## 场景

给你一个数组 window，已知其最值为 A，如果给 window 中添加一个数 B，那么比较一下 A 和 B 就可以立即算出新的最值；但如果要从 window 数组中减少一个数，就不能直接得到最值了，因为如果减少的这个数恰好是 A，就需要遍历 window 中的所有元素重新寻找新的最值。

## 练一练

### lc239. 滑动窗口最大值 hard

动态计算极值，直接命中单调队列的使用条件。

```js
/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
var maxSlidingWindow = function (nums, k) {
    let res = []
    const monoQueue = []
    for (let i = 0; i < nums.length; ++i) {
        while (monoQueue.length && nums[i] >= nums[monoQueue[monoQueue.length - 1]]) {
            monoQueue.pop()
        }
        /** 一个重点是存储索引，便于判断窗口的大小 */
        monoQueue.push(i)
        if (i - monoQueue[0] + 1 > k) monoQueue.shift()

        // r - l + 1 == k 所以 l = r - k + 1 保证有意义
        if (i - k + 1 >= 0) res.push(nums[monoQueue[0]])
    }
    return res
}
```

### lc.862 和至少为 K 的最短子数组 hard

看题目就知道，离不开前缀和。想到单调队列，是有难度的，起码我一开始想不到 😭

<!-- TODO copy了答案，后续再细看 -->

```js
var shortestSubarray = function (nums, k) {
    const n = nums.length
    const preSumArr = new Array(n + 1).fill(0)
    for (let i = 0; i < n; i++) {
        preSumArr[i + 1] = preSumArr[i] + nums[i]
    }
    let res = n + 1
    const queue = []
    for (let i = 0; i <= n; i++) {
        const curSum = preSumArr[i]
        while (queue.length != 0 && curSum - preSumArr[queue[0]] >= k) {
            res = Math.min(res, i - queue.shift())
        }
        while (queue.length != 0 && preSumArr[queue[queue.length - 1]] >= curSum) {
            queue.pop()
        }
        queue.push(i)
    }
    return res < n + 1 ? res : -1
}
```

### lc.918 环形子数组的最大和（单调队列）

这道题在前缀和的时候遇到过，再来复习一次吧 😁

```js
/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubarraySumCircular = function (nums) {
    // 这道题是比较综合的一道题，用到了前缀和，循环数组技巧，滑动窗口和单调队列技巧
    let max = -Infinity
    const monoQueue = [[0, nums[0]]] // 单调队列存储 【index,preSum】的数据结构
    const n = nums.length
    let preSum = nums[0]
    for (let i = 1; i < 2 * n; ++i) {
        preSum += nums[i % n]
        max = Math.max(max, preSum - monoQueue[0][1]) // 子数组和越大，减去的就应该越小
        while (monoQueue.length && preSum <= monoQueue[monoQueue.length - 1][1]) {
            monoQueue.pop()
        }
        monoQueue.push([i, preSum])
        // 根据索引控制 窗口大小
        while (monoQueue.length && i - monoQueue[0][0] + 1 > n) {
            monoQueue.shift()
        }
    }
    return max
}
```

<!-- lc.1425 带限制的子序列和 hard; lc.1696 跳跃游戏 VI  有时间再做做吧-->

