# 二分搜索


## 二分法适用条件

一开始，我简单地认为是数据需要具有**单调性**，才能应用二分；后来刷了一部分题之后，才晓得，`应用二分的本质是数据具有**二段性**`，即：一段满足某个性质，另外一段不满足某个性质，就可以用「二分」。

## 重点理解！！！

### 循环不变式

-   `while low <= high`

    1. 终止条件，一定是 `low + 1 == high`，也即 low > right
    2. 意味着，整个区间 `[low..high]` 里的每个元素都被遍历过了

-   `while low < high`

    1. 终止条件，一定是 `low == high`
    2. 意味着，整个区间 `[low..high]` 里当 low == high 时的元素可能会没有被遍历到，需要打个补丁
    3. 补充：如 lc.153，采用逼近策略寻找答案时，两指针最后指向相同位置，如过这个位置的元素不用拿出来做什么操作，只是找到它就行，那么就用 < 也是合适的。

### 可行解区间

对于二分搜索过程中的每一次循环，它的可行解区间都应当一致，结合对于循环不变式的理解：

-   `[low...high]`，左右都闭区间，一般根据 mid 就能判断下一个搜索区间是 `low = mid + 1` 还是 `high = mid - 1`
-   `[low...high)`，左闭右开区间，维持可行解区间，下一个搜索区间左边是 `low = mid + 1`，右边是 `high = mid`

因为数组的特性，常用的就是这两种区间。当然也有左右都开的区间 `(low...high)`，对应的循环不变式为 `while low + 1 < high`，不过比较少见。

> 另外请务必理解可行解区间到底是个啥！不是说定义了指针为 `low = 0, high = len - 1`，就代表着可行解区间为 `[low...high]`，而是需要看实际题意。比如，你能确定 low = 0 指针和 high = len - 1 指针的解一定不在我需要的结果之中，那么对应的可行解区间就是 `(low...high)`，相应的就可以使用 `while low + 1 < high` 的循环不变式

> 对于寻找左右边界的问题，也是根据可行解区间，去决定 low 或 high 的每一轮 update。搜索左侧边界：mid == x 时 r = mid; 搜索右侧边界： mid == x 时，l = mid + 1，需要注意，搜索右边界结束时 l = mid + 1，所以搜索数据的真实位置是 l - 1 。

## 练习

### lc.33 搜索旋转排序数组

```js
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function (nums, target) {
    let l = 0,
        r = nums.length - 1
    while (l <= r) {
        const mid = l + ((r - l) >> 1)
        if (nums[mid] === target) {
            return mid
        } else if (nums[mid] < nums[l]) {
            // 右半边有序的情况
            if (nums[mid] < target && target <= nums[r]) {
                l = mid + 1
            } else {
                r = mid - 1
            }
        } else {
            // 左半边有序的情况 target 在有序区间内
            if (nums[l] <= target && target < nums[mid]) {
                r = mid - 1
            } else {
                l = mid + 1
            }
        }
    }
    return -1
}

/**
 * 来看一下，如果用开闭右开区间的方式，怎么改写代码
 */
var search = function (nums, target) {
    let l = 0,
        r = nums.length
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        if (nums[mid] === target) {
            return mid
        } else if (nums[mid] > nums[l]) {
            // 左半边有序的情况 target 在有序区间内
            if (nums[l] <= target && target < nums[mid]) {
                r = mid
            } else {
                l = mid + 1
            }
        } else {
            // 右半边有序的情况
            /**
             * 这里需要格外注意!!!，因为右边界是开区间，所以比较的是 nums[r - 1]
             */
            if (nums[mid] < target && target <= nums[r - 1]) {
                l = mid + 1
            } else {
                r = mid
            }
        }
    }
    return -1
}
```

### lc.34 在排序数组中查找元素的第一个和最后一个位置

比上一题还简单~

```js
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var searchRange = function (nums, target) {
    // 就是寻找左右边界
    const res = []
    let l = 0,
        r = nums.length
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        if (nums[mid] < target) {
            l = mid + 1
        } else {
            r = mid
        }
    }
    if (nums[l] !== target) return [-1, -1] // 注意点，记得判断是否存在target
    res[0] = l
    l = 0
    r = nums.length
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        if (nums[mid] > target) {
            r = mid
        } else {
            l = mid + 1
        }
    }
    res[1] = r - 1 // 因为我使用的是左闭右开区间，最终取右边界 - 1 即可
    return res
}
/**
 * 对于求边界的二分，如果用左右都闭的形式，需要在 while 后判断一下 l、r 是否在区间内
 * 因为 l <= r 的结束条件是 l + 1 = r，有可能产生越界情况，
 * 这道题恰好是题目要求了，所以做了个判断
 */
```

> 在判断 nums[mid] 和 target 的大小来进行决策的时候，我的习惯是看 target 在 mid 的左边还是右边，这样就更直观一些。比如： nums[mid] > target，直观理解应该是 mid 在 target 的右边，这时候可能一下子有点懵，是去收缩左边还是收缩右边（可能我比较菜）😂 如果转换为 target 在 mid 的左边，脑补一下就能想得到要去左边寻找，所以要收缩右边界。

### lc.35 搜索插入位置 easy

```js
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var searchInsert = function (nums, target) {
    let l = 0,
        r = nums.length
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        if (nums[mid] === target) {
            return mid
        } else if (nums[mid] > target) {
            r = mid
        } else {
            l = mid + 1
        }
    }
    return l
}
```

比较普通的一题，我看了官解和评论后，有人问找到 target 后为什么不直接返回（官解是没有返回的），仔细看了下题目，因为题目中规定了 nums 中不会有重复的元素，所以，按道理说是可以直接返回的，官解是考虑到了有重复元素的情况，变成了寻找左边界去了。

---

<!-- ### lc.704 二分查找 easy 太简单就不做了，初学者可以看看 -->

### lc.74 搜索二维矩阵

```js
/**
 * @param {number[][]} matrix
 * @param {number} target
 * @return {boolean}
 */
var searchMatrix = function (matrix, target) {
    let l = 0,
        r = matrix.length
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        if (matrix[mid][0] === target) {
            return true
        } else if (matrix[mid][0] > target) {
            r = mid
        } else {
            l = mid + 1
        }
    }
    // 因为寻找的是 第一个 >= target 的，即寻找第一列的右边界
    if (r - 1 < 0) return false

    const row = matrix[l - 1]
    let i = 0,
        j = row.length
    while (i < j) {
        const mid = i + ((j - i) >> 1)
        if (row[mid] === target) {
            return true
        } else if (row[mid] > target) {
            j = mid
        } else {
            i = mid + 1
        }
    }
    return false
}
```

### lc.81 搜索旋转排序数组 II

对比 lc.33 题只是多了重复的元素，问题是，如过旋转点恰好是重复的元素，就会使得数据丧失 「二段性」：

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202402232329422.png)

官解的做法是恢复二段性即可：`if(nums[l] == nums[mid] && nums[mid] == nums[r]) {l++, r--}`

偷懒点就只收缩一边也行的，左边或右边都行，比如我选择了当 `nums[l] === nums[mid]` 时，收缩左边界

```js
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {boolean}
 */
var search = function (nums, target) {
    let l = 0,
        r = nums.length
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        if (nums[mid] === target) {
            return true
        } else if (nums[mid] > nums[l]) {
            if (nums[l] <= target && target < nums[mid]) {
                r = mid
            } else {
                l = mid + 1
            }
        } else if (nums[mid] < nums[l]) {
            if (nums[mid] < target && target <= nums[r - 1]) {
                l = mid + 1
            } else {
                r = mid
            }
        } else {
            // nums[mid] === nums[l] 情况 收缩左边界目的是恢复 二段性
            l++
        }
    }
    return false
}

/** 再来看看收缩右边界的情况 */
var search = function (nums, target) {
    let l = 0,
        r = nums.length
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        if (nums[mid] === target) {
            return true
        } else if (nums[mid] < nums[r - 1]) {
            if (nums[mid] < target && target <= nums[r - 1]) {
                l = mid + 1
            } else {
                r = mid
            }
        } else if (nums[mid] > nums[r - 1]) {
            if (nums[l] <= target && target < nums[mid]) {
                r = mid
            } else {
                l = mid + 1
            }
        } else if (nums[mid] === nums[r - 1]) {
            r--
        }
    }
    return false
}

/** 两边同时收缩的看官解吧~ */
```

> 收缩左边界，就让 mid 和左侧比；收缩右边界，就让 mid 和右侧的比

### lc.153 寻找旋转排序数组中的最小值

说实话，这道题一开始困扰了我很久 😭，因为它有点与众不同~

当时我是这么分析的（以下的 mid 代表 nums[mid], l 代表 nums[l]）：

1. 如果，数组 n 次旋转后，单调有序，最小值就是最左边的
2. 如果，数组 n 次旋转后，无序，则最小值就在二分后无序的那半边了
    - 2.1 mid > l，右半边无序，选择右半边（坑）
    - 2.2 mid < l，左半边无序，选择左半边

死活有那个几个用例过不了~ 看了题解，是跟右侧比较的 😭 why？？？跟左侧比有啥不一样嘛？后来仔细想了下，问题出在了 2.1 mid > l 右边无序，第一条就是最好的反例，此时最小值在最左边得选择左半边了，因此，**mid 与 l 比较是满足不了二段性**的，而与 r 比较就不一样了：

1. mid > r，则右侧无序，选择右侧，忽略左边
2. mid < r，则若左侧无序，选择左侧，忽略右边；若左侧有序，r 持续收缩逼近，也能得到结果，所以也可以选择左侧
    - 也可以这么想：mid < r，右侧有序，则结果一定在 `[l..mid]` 中

因此，**mid 与 r 比较能满足二段性**。(PS：mid 想要与 l 比较也是可以的，二分前先排除掉整个数据单调不就好了，此处就不拓展了)

再思考一下，如果求最大值呢？😁，那就应该是不断收缩 l 去逼近，就适合用 mid 和 l 做比较了。

---

接下来还有第二个坑 😭

最初初始化右侧边界用的 `r === nums.length`，我寻思就跟之前一样，用左闭右开区间得了，不料却有测试用例没有过去 --- `[4,5,1,2,3]`，这是为啥呢，带进去一看，原来是 mid 恰好为最小值时，r 更新为 mid，但是遍历却并没有停止，l 仍然是小于 r 的，然后就会走到错误的答案去了。

可是为什么之前这样写就没啥问题呢？我又思考了下，奥，之前都是给一个目标 target，会有判断 `nums[mid] === target` 的情况，命中直接 return；而这里是无目标的，只能让双指针不断逼近从而得到最后的结果。根据前面的分析 r 的 update 策略为 `r = mid`，麻烦就在这里了，再来看一下它的两层含义：

1. r == mid 的第一层含义，左侧无序，舍去右侧，但此时的 mid 有可能为可行解，所以 r 不能等于 mid -1
2. r == mid 的第二层含义，左侧有序，不断逼近，此时 r == mid， **每次逼近的值都有可能为可行解**，这就与 `[l..r)` 的可行解区间不符了

因此可行解区间设为 `[l..r]` 是符合要求的，所以初始化为 `r = nums.length - 1`。（我隐约觉得这背后一定是有某种数学逻辑，求大佬赐教）

```js
/** 错误解法 */
var findMin = function (nums) {
    let l = 0,
        r = nums.length // bug
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        if (nums[mid] > nums[r - 1]) {
            l = mid + 1
        } else {
            r = mid
        }
    }
    return nums[r]
}
/**
 * [2,1] 举例
 * 1. l == 0, r == 2, mid = 1, nums[1] > nums[1] : false --> r = 1
 * 2. l == 0, r == 1，mid = 0, nums[0] > nums[0] : false --> r = 0
 * 结束循环 l == r == 0
 *
 * 会发现，一旦数据巧合了后，就一直进入 nums[mid] 和 nums[mid] 自身比较的情况了
 */

/** 修改后 */
var findMin = function (nums) {
    let l = 0,
        r = nums.length - 1
    // 由此可见，用 < 还是 <= 完全取决于题意，它只是用来控制遍历的结束时机，
    // 在这里，当 l == r 时，就是解，所以 < 即可，（因为不需要对最后一个元素做什么操作）
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        // 右侧无序
        if (nums[mid] > nums[r]) {
            l = mid + 1
        } else {
            // 否则右侧有序 结果就肯定在 [l..mid] 中，所以 r = mid
            r = mid
        }
    }
    return nums[r]
}
/**
 * [2,1] 举例
 * 1. l == 0, r == 1, mid = 0, nums[0] > nums[1] : true --> l = mid + 1 === 1
 * 结束循环 l == r == 1
 */
```

那通过这道题能积累的经验是：

1. 务必要分析好题目的二段性，正确的去选择左右分区，同时注意可行解区间在每一轮中是否保持一致
2. 当无目标，根据双指针去探测极值的时候，使用 `[l..r]` 的闭区间较为稳妥
3. 再回过头来结合 l.81 题，旋转数组寻找极小值，就是选择无序区间，然后再无序区间内寻找到有序区间，在有序区间内（单调增），那肯定是从右往左收缩，所以和右侧比没毛病；假如是搜索极大值，那么就是和左侧比了。

### lc.154 寻找旋转排序数组中的最小值 III hard

相比 lc.153 就是多了重复元素，纸老虎罢了。

```js
var findMin = function (nums) {
    let l = 0,
        r = nums.length - 1
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        if (nums[mid] > nums[r]) {
            l = mid + 1
        } else if (nums[mid] < nums[r]) {
            r = mid
        } else {
            // nums[mid] === nums[r]
            r--
        }
    }
    return nums[r]
}
```

注意：在 lc.153 题里也有 nums[mid] === nums[r] 的判断，只是因为 153 题保证了数据不是重复的，从而直接把 r = mid 即可，当遇到有重复数据的时候，就不能这么做了，即再参考 lc.81 题，重复数据恰好在旋转点的时候，会**丧失二段性**，解法也是类似的。

### lc.162 寻找峰值

解法和 lc.153 简直如出一辙，只是从比较 mid 和 r 变为比较 mid 和 mid+1。

```js
/**
 * @param {number[]} nums
 * @return {number}
 */
var findPeakElement = function (nums) {
    let l = 0,
        r = nums.length - 1
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        /**
         * mid > mid + 1，所以 mid 可能为极大值 r = mid
         * 否则  mid <= mid + 1, mid < mid + 1 时， l = mid + 1, mid = mid + 1 时， l 也可以等于 mid + 1
         */
        if (nums[mid] > nums[mid + 1]) {
            r = mid
        } else {
            l = mid + 1
        }
    }
    return l
}

var findPeakElement = function (nums) {
    let l = 0,
        r = nums.length - 1
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        /**
         * mid < mid + 1 时， l = mid + 1
         * 否则 mid >= mid + 1 时，mid > mid + 1, r = mid; mid = mid + 1， r 也可以等于 mid
         */
        if (nums[mid] < nums[mid + 1]) {
            l = mid + 1
        } else {
            r = mid
        }
    }
    return l
}
```

与旋转数组不一样，这道题从左往右，从右往左都可以得到极大值，所以 mid 和左右比都 ok。

<!-- 所以求极小值，可以用 `mid > r` 来做抉择条件；求极大值，可以用 `mid < r` 来做抉择条件，这样子后续的逻辑就比较好想。当然了，实际上怎么做都可以，主要是自己得搞清楚逻辑即可。 -->

### lc.240 搜索二维矩阵 II

与 lc.74 不同的是，上一行的尾不再大于下一行的首了。最直观的做法就是对每一行做二分。

```js
/**
 * @param {number[][]} matrix
 * @param {number} target
 * @return {boolean}
 */
var searchMatrix = function (matrix, target) {
    for (let i = 0; i < matrix.length; i++) {
        const row = matrix[i]
        let l = 0,
            r = row.length
        while (l < r) {
            const mid = l + ((r - l) >> 1)
            if (row[mid] === target) {
                return true
            } else if (row[mid] < target) {
                l = mid + 1
            } else {
                r = mid
            }
        }
    }
    return false
}
```

这样做的时间复杂度是 O(mlogn)，管解给了更优的方案 [Z 字形查找](https://leetcode.cn/problems/search-a-2d-matrix-ii/solutions/1062538/sou-suo-er-wei-ju-zhen-ii-by-leetcode-so-9hcx/)，看了一下就是从右上角进行搜索，根据条件更新坐标 ++y 或 --x。

### lc.410 分割数组的最大值 hard

这道题的常规做法是动态规划，能用到二分我是属实没有想到。。。

> 这道题确实有难度，直接看官解吧，用的是 [二分+贪心](https://leetcode.cn/problems/split-array-largest-sum/solutions/345417/fen-ge-shu-zu-de-zui-da-zhi-by-leetcode-solution/)

### lc.658 找到 k 个最接近的元素

```js
var findClosestElements = function (arr, k, x) {
    // 先找到 x 的位置 i，再从 i 往左右两边拓展 [p..q] 直到 q - p + 1 === k
    let l = 0,
        r = arr.length
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        if (arr[mid] < x) {
            l = mid + 1
        } else {
            r = mid
        }
    }
    /**
     * 关键点，此时 l == r，且 [r..] 都 **大于等于** x; [..r-1] 都小于 x
     *
     * 如过没有 l = r - 1 这一步，那么 [...l] 也都是小于等于 x 的，就丧失了二段性，
     *          当 leftAbs === rightAbs 时，就分不清到底是该 l-- 还是 r++
     *
     * 有了 l == r - 1，则就能保证 [...l] 一定是小于 x 的，也就有了 (l..r] 的可行解区间，
     *          当 leftAbs === rightAbs 时，应该 l--
     */
    l = r - 1
    while (r - l <= k) {
        const leftAbs = x - arr[l]
        const rightAbs = arr[r] - x
        /** 同时需要考虑x不在数组索引内的情况 */
        if (l < 0) {
            r++
        } else if (r > arr.length - 1) {
            l--
        } else if (leftAbs <= rightAbs) {
            l--
        } else {
            r++
        }
    }
    return arr.slice(l + 1, r)
}
```

再一次加深可行解区间的理解 🐶

### lc.793 阶乘函数后 K 个零 hard

> 数学题，[不看答案是真不会啊~](https://leetcode.cn/problems/preimage-size-of-factorial-zeroes-function/solutions/1776603/jie-cheng-han-shu-hou-k-ge-ling-by-leetc-n6vj/)

### lc.852 山脉数组的峰顶索引

```js
/**
 * @param {number[]} arr
 * @return {number}
 */
var peakIndexInMountainArray = function (arr) {
    let l = 0,
        r = arr.length - 1
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        if (arr[mid] < arr[mid + 1]) {
            l = mid + 1
        } else {
            r = mid
        }
    }
    return l
}
```

就问你这和 lc.162 有啥区别吗。。。

### lc.875 爱吃香蕉的珂珂

```js
/**
 * @param {number[]} piles
 * @param {number} h
 * @return {number}
 */
var minEatingSpeed = function (piles, h) {
    // 寻找 k，根据题意 k 的最小值为 1， 最大值为 piles 里的最大值
    let max = 0
    for (const num of piles) {
        max = num > max ? num : max
    }
    let l = 1,
        r = max
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        if (getHourWhenSpeedIsMid(piles, mid) > h) {
            l = mid + 1
        } else {
            r = mid // 又去收缩右边界了~
        }
    }
    return l
}
function getHourWhenSpeedIsMid(piles, speed) {
    let hours = 0
    for (const num of piles) {
        hours += Math.ceil(num / speed)
    }
    return hours
}
```

### lc.1011 在 D 天内送达包裹的能力

与 lc.875 几乎一模一样

```js
var shipWithinDays = function (weights, days) {
    // 根据题意，最低运载能力的最小值为 weights 的最大值，最大运载能力为 weights 的和
    let l = Math.max(...weights),
        r = weights.reduce((a, b) => a + b)
    while (l < r) {
        const mid = l + ((r - l) >> 1)
        if (getDays(weights, mid) > days) {
            l = mid + 1
        } else {
            r = mid
        }
    }
    return l
}
function getDays(weights, mid) {
    let days = 1
    let count = 0
    for (const weight of weights) {
        count += weight
        if (count > mid) {
            days++
            count = weight
        }
    }
    return days
}
```

### lc.1201 丑数 III

这题也是没点数学知识是真的不会啊 😭 本题答案是我拷贝的，算是开了眼界了

1. [1..i] 中能被数字 a 整除的数字个数为 i / a
2. 容斥原理：[1..i]中能被 a 或 b 或 c 整除的数的个数 = i/a−i/b−i/c−i/ab−i/bc−i/ac+i/abc。其中 i/ab 代表能被 a 和 b 整除的数，其他同理。

```js
/**
 * @param {number} n
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @return {number}
 */
var nthUglyNumber = function (n, a, b, c) {
    const ab = lcm(a, b)
    const ac = lcm(a, c)
    const bc = lcm(b, c)
    const abc = lcm(ab, c)
    let left = Math.min(a, b, c)
    let right = n * left
    while (left < right) {
        const mid = Math.floor((left + right) / 2)
        const count =
            low(mid, a) +
            low(mid, b) +
            low(mid, c) -
            low(mid, ab) -
            low(mid, ac) -
            low(mid, bc) +
            low(mid, abc)
        if (count >= n) {
            right = mid
        } else {
            left = mid + 1
        }
    }
    return right
}
function low(mid, val) {
    return (mid / val) | 0
}
function lcm(a, b) {
    //最小公倍数
    return (a * b) / gcd(a, b)
}
function gcd(a, b) {
    //最大公约数
    return b === 0 ? a : gcd(b, a % b)
}
```

---

总结：一旦对循环不变量和可行解区间有了深刻的理解，二分法本身是没有什么难点的，上方的 hard 题，难在了二分与其他逻辑的揉和，比如贪心和数学，所以对于二分本身的东西要贼贼贼熟练的掌握，当成工具一样，在遇到快速查询且能用二分的情况下，能信手拈来，peace！

