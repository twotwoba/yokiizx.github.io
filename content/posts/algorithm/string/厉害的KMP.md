---
title: '厉害的KMP'
date: 2022-10-28T15:33:46+08:00
---

## 前言

很早之前刚刚开始刷题的时候，对 `lc28` 不屑一顾，这不就是个 `indexOf` 吗 🐻？看了答案后我懵逼了，因为我不会，甚至看不懂 😂。

so，那就搞懂它。

## KMP 目的

字符串 txt，模式串 pat。

KMP 算法的核心思想是：利用模式串中的重复子串来进行匹配。在匹配过程中，如果遇到重复子串，就跳过它，只匹配后面的部分。这样可以避免在匹配过程中多次重复处理同一个子串，从而提高匹配效率。

现象就是：在 txt 中寻找 pat，永不回退在 txt 上移动的指针 i，不走回头路（不会重复扫描 txt），而是借是前缀函数 `π(i)` (网上很多也称为 `next 数组`)中储存的信息把 pat 移到正确的位置继续匹配，时间复杂度只需 `O(N)`，用空间换时间。

## 两种实现

- 一种是 AC 自动机的思路来求解 `π函数`，这部分实现后续了解
- 另一种就是利用前缀函数`π(i)`的性质来实现的，本文介绍这种

## 基本概念

[关于真前缀,真后缀的基本定义见这里](https://oi-wiki.org/string/kmp/#%E5%89%8D%E7%BC%80%E5%87%BD%E6%95%B0)

- `前缀函数`：**对于长度为 `n` 的字符串 `s`，其前缀函数 `π(i) (0≤i<n)` 表示 `s` 的子串 `s[0..i] `内真前缀与真后缀相等的最长长度。**

通过一个例子来简单说明一下：

```JS
const str = 'ababc'

// 真前缀
a
ab
aba
abab
// 真后缀
babc
abc
bc
c

// π(i) = [0,0,1,2,0]
// π(0) = 0 是特殊的，因为没有真前缀和真后缀
```

> **重点：就是求前缀函数 π(i)**
> 按照定义去求前缀函数时间复杂度将达到 `O(n^3)`，所以需要利用到性质。
>
> 1. π(0) = 0
> 2. π(i) 最大为 π(i-1) + 1，即每次最大只能 +1

解释：假设已知 `π(0...i-1)`，求 `π(i)`，定义指针 `j = π(i-1)`，`j` 指针含义———— **在 j 对应的字符前已经有 j 个元素 与 i 对应的字符的前 j 个元素相等**

- 如果 `s[i] === s[j]` ，那么 `π(i) = j + 1`;
- 如果 `s[i] !== s[j]`，那么挪动指针 `j` 到下一个最长的可能匹配的位置，即 j 指针的前一位 π 函数的位置 `j = π(j - 1)`（重难点！！！）

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202304141407906.svg)

### 试一试：[28. 找出字符串中第一个匹配项的下标](https://leetcode.cn/problems/find-the-index-of-the-first-occurrence-in-a-string/)

```JavaScript
var strStr = function (haystack, needle) {
  const m = haystack.length
  const n = needle.length
  const pi = new Array(n).fill(0)
  // 对pat求前缀函数
  for (let j = 0, i = 1; i < n; ++i) { // π(0) == 0; 求 π(1...n-1)
    // 不等, 找已匹配的字符中最长的前后缀长度,即 j 指针的前一位的长度，这部分带点动态规划的思想
    while (j > 0 && needle[j] !== needle[i]) j = pi[j - 1]
    if (needle[j] === needle[i]) j++ // 相等, j 指针和 i 指针同时往后移动一位
    pi[i] = j                        // 更新 pi[i] 的最长相等 「真前/后缀」长度
  }
  console.log(pi)
  // i txt指针, j pat指针
  for (let i = 0, j = 0; i < m; ++i) {
    while (j > 0 && haystack[i] !== needle[j]) j = pi[j - 1]
    if (haystack[i] === needle[j]) j++
    if (j === n) {
      return i - n + 1 // 遍历完了patten, 起始索引位置为i - n + 1
    }
  }
  return -1
}
```

假想把 pat 和 txt 通过特殊符号#连接起来。然后求前缀函数，当前缀值等于 pat 的长度时，就是匹配上了。闭区间 [x, i]，长度为 n, 求索引 x，不用我多说了吧？直接返回索引 x 为 `i - n + 1`

## 参考

- [前缀函数与 KMP 算法](https://oi-wiki.org/string/kmp/)
- [KMP 算法 next 数组推导详解](https://blog.csdn.net/weixin_50168558/article/details/121318627)
- [最浅显易懂的 KMP 算法讲解(视频)](https://www.bilibili.com/video/BV1AY4y157yL/?share_source=weixin_web&vd_source=55aa8441b3f5438f746a87f0ac946d08&wxfid=o7omF0bo1aj3AH8fOHTxGWdFxrdM&share_times=1)
