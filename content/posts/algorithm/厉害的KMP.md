---
title: '厉害的KMP'
date: 2022-10-28T15:33:46+08:00
tags: [algorithm]
---

## 前言

很早之前刚刚开始刷题的时候，对 lc28 不屑一顾，这不就是个 indexOf 吗 🐻？看了答案后我懵逼了，因为我不会，甚至看不懂 😂。

so，那就搞懂它。

## KMP 的目的

字符串 txt，模式串 pat。

再 txt 中寻找 pat，KMP 算法目的就是永不回退在 txt 上移动的指针 i，不走回头路（不会重复扫描 txt），而是借助 dp 数组中储存的信息把 pat 移到正确的位置继续匹配，时间复杂度只需 O(N)，用空间换时间

## 基本概念

- "真前缀"指除了最后一个字符以外，一个字符串的全部头部组合；
- "真后缀"指除了第一个字符以外，一个字符串的全部尾部组合。

**对于长度为 m 的字符串 s，其前缀函数 `pi(i) (0≤i<m)` 表示 s 的子串 s[0..i] 的最长的相等的真前缀与真后缀的长度。**

当字符串与模式串匹配失败时：
`移动位数 = 已匹配的字符数 - 对应的部分匹配值(即 pi(i))`。

##### [28. 找出字符串中第一个匹配项的下标](https://leetcode.cn/problems/find-the-index-of-the-first-occurrence-in-a-string/)

```JavaScript
var strStr = function (haystack, needle) {
  // 虽然是简单题，但是使用的是并不简单的 KMP！
  // kmp简单点讲就是我的文本串指针 永不后退！！！ 牺牲空间换时间（存储模式串应该匹配的位置）
  const m = haystack.length
  const n = needle.length
  const pi = new Array(n).fill(0)
  // 对pat求前缀函数, 利用前缀函数的性质, 用j指针来处理前缀
  for (let j = 0, i = 1; i < n; ++i) {
    while (j > 0 && needle[j] !== needle[i]) {
      j = pi[j - 1]
    }
    if (needle[j] === needle[i]) j++
    pi[i] = j
  }
  console.log(pi)
  // i txt指针, j pat指针
  for (let i = 0, j = 0; i < m; ++i) {
    while (j > 0 && haystack[i] !== needle[j]) {
      j = pi[j - 1]
    }
    if (haystack[i] === needle[j]) j++
    if (j === n) {
      return i - n + 1 // 遍历完了patten, 起始索引位置为i - n +1
    }
  }
  return -1
}
```

此题主要使用前缀函数的性质，假想把 pat 和 txt 通过特殊符号#连接起来。然后求前缀函数，分别遍历 pat, txt.  
对 pat 保存前缀函数值, 对 txt 无需保存,当前缀值等于 pat 的长度时，就是匹配上了，返回索引为 `j - m + 1`

## 参考

- [前缀函数与 KMP 算法](https://oi-wiki.org/string/kmp/)
