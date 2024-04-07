# 数组-差(cha)分数组


> 前缀和数组 是应对数组区间被频繁访问求和查询  
> 差分数组 是为了应对区间内元素的频繁加减修改

## 概念

```js
const diff = [nums[0]]
for (let i = 1; i < arr.length; ++i) {
    diff[i] = nums[i] - nums[i - 1] // 构建差分数组
}
```

对区间 `[i..j]` 进行加减 val 操作只需要对差分数组 **`diff[i] += val`, `diff[j+1] -= val`** 进行更新，然后依据更新后的差分数组还原出最终数组即可：

```js
nums[0] = diff[0]
for (let i = 1; i < diff[i]; ++i) {
    nums[i] = diff[i] + nums[i - 1]
}
```

原理也很简单：

-   `diff[i] += val`，等于对 `[i...]` 之后的所有元素都加了 val
-   `diff[j+1] -=val`，等于对 `[j+1...]` 之后的所有元素都减了 val

这样就使用了常数级的时间对区间 `[i..j]` 内的元素进行了修改，最后一次性还原即可。

### lc.370 区间加法 vip

假设你有一个长度为  n  的数组，初始情况下所有的数字均为  0，你将会被给出  k​​​​​​​ 个更新的操作。

其中，每个操作会被表示为一个三元组：[startIndex, endIndex, inc]，你需要将子数组  A[startIndex ... endIndex]（包括 startIndex 和 endIndex）增加  inc。

请你返回  k  次操作后的数组。

示例:

输入: length = 5, updates = [[1,3,2],[2,4,3],[0,2,-2]]
输出: [-2,0,3,5,3]

```js
/**
 * @param {number} length
 * @param {number[][]} updates
 * @return {number[]}
 */
var getModifiedArray = function (length, updates) {
    if (updates.length < 0) return []
    // 构建
    const diff = new Array(length).fill(0)
    for (let i = 0; i < updates.length; ++i) {
        const step = updates[i]
        const [start, end, num] = step
        diff[start] += num
        end + 1 < length && (diff[end + 1] -= num)
    }
    // 还原
    const res = []
    res[0] = diff[0]
    for (let i = 1; i < length; ++i) {
        res[i] = res[i - 1] + diff[i]
    }
    return res
}
```

### lc.1094 拼车

```js
/**
 * @param {number[][]} trips
 * @param {number} capacity
 * @return {boolean}
 */
var carPooling = function (trips, capacity) {
    // 1. 因为初始都为 0 所以差分数组也都为 0
    // 2. 初始化差分数组的容量时，根据题意来即可，不用遍历
    const diff = Array(1001).fill(0)
    for (const [people, from, to] of trips) {
        diff[from] += people
        diff[to] -= people // 根据题意，乘客在车上的区间是 [form..to - 1]，即需要变动的区间
    }

    if (diff[0] > capacity) return false
    let arr = [diff[0]]
    for (let i = 1; i < diff.length; ++i) {
        arr[i] = arr[i - 1] + diff[i]
        if (arr[i] > capacity) return false
    }
    return true
}
```

### lc.1109 航班预定统计

```js
/**
 * @param {number[][]} bookings
 * @param {number} n
 * @return {number[]}
 */
var corpFlightBookings = function (bookings, n) {
    // 1. 初始化预定记录都为 0，所以差分数组也都为 0
    // 2. 根据题意，需要变动的区间为 [first...last]
    const diff = Array(n + 1).fill(0)
    for (const [from, to, seat] of bookings) {
        diff[from] += seat
        if (to + 1 < diff.length) diff[to + 1] -= seat // 确保 diff 的容量大小 不要越界影响后续还原时的计算
    }
    const ans = [diff[0]]
    for (let i = 1; i < diff.length; ++i) {
        ans[i] = ans[i - 1] + diff[i]
    }
    return ans.slice(1)
}
```

