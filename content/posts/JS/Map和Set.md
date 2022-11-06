---
title: 'Map,WeakMap 和 Set,WeakSet'
date: 2022-09-25T23:24:07+08:00
tags: [JavaScript]
---

JS 中已经有了数组和对象两种数据结构，但是不足以应对实际情况，所以有新增了 Map 和 Set 数据结构。

##### Map

Map 和对象类似，也是键值对（key-value）的形式，只不过有自己独特的一套 CRUD api。

从特性上看，与对象的不同点是：

- 任何数据结构都可以作为 key，但是不会像对象一样会把 key 转为字符串。  
  比如 Map 使用引用类型做键，那么键是否相同也是根据内存地址也就是引用是否相同来判断的。这点在 [lc49.字母异位词](https://leetcode.cn/problems/group-anagrams/?favorite=2cktkvj) 中能体会到其中的不同了。
- Map 中的数据是具有顺序的，保持插入顺序，map.[keys,values,entries]()返回可迭代对象。  
  这点在用 JS 实现 [LRU 缓存](https://yokiizx.site/posts/algorithm/lru/)中可以感受到。

##### Set

Set 和数组相似，但是它仅仅是值的集合（没有键）。

Set 的特性除了没有键，就是值不重复，常被用来做去重处理：`[...new Set(array)]`

为了兼容 Map，Set 的迭代方法与 Map 一致，但是返回的都是值 😂。

##### WeakMap

弱映射特点：

- 只能使用对象作为键值，当没有其他对这个对象的引用 —— 该对象将会被从内存和 WeakMap 中自动清除。
- 不支持迭代。这是因为不知道作为键的对象什么时候被回收，这是由 JS 引擎决定的。

关于内存清除，JavaScript 引擎在值“可达”和可能被使用时会将其保持在内存中。见以下代码：

```JavaScript
let demo = {name: 'yokiizx'}
demo = null // 该对象将会被从内存中清除

/* ---------- Map ---------- */
let demo1 = { name: 'yokiizx' }
let map = new Map([[demo1, 'a handsome boy']])
demo1 = null

console.log(map) // Map(1) { { name: 'yokiizx' } => 'a handsome boy' }
// 说明当对象被引用了，即使这是为null，也不会从内存中清除它

/* ---------- WeakMap ---------- */
let demo2 = { name: 'yokiizx' }
let weakMap = new WeakMap([[demo2, 'a handsome boy']])
demo2 = null

console.log(weakMap) // WeakMap { <items unknown> }
// 说明 WeakMap的 键对象，当没有引用了，就会被从内存中清除
```

应用场景：

- 为其他对象提供额外的存储。当宿主对象消失时，WeakMap 给宿主对象添加的数据将自动清除。(比如 dom 元素上添加数据时可用 WeakMap,当该 DOM 元素被清除，对应的 WeakMap 记录就会自动被移除。)
- 实现私有属性（闭包 + WeakMap）  
  TS 中已经实现的 `private` 私有属性原理就是利用 WeakMap

私有属性应该是不能被外界访问到，不能被多个实例共享。闭包中的变量会在实例中共享

```JavaScript
const Demo = (function () {
  let priv = new WeakMap()
  return class {
    constructor(val) {
      priv.set(this, val)
    }
    getPriv() {
      return priv.get(this)
    }
  }
})()

const d1 = new Demo(1)
const d2 = new Demo(2)
console.log(d1.getPriv(), '--', d1.priv) // 1 -- undefined
console.log(d2.getPriv(), '--', d2.priv) // 2 -- undefined
```

##### WeakSet

弱集合，只能是对象的集合，也不能迭代，没有 size 属性。

> WeakMap/WeakSet 的主要工作 —— 为在其它地方存储/管理的对象数据提供“额外”存储

##### 补充：可迭代对象

可迭代对象(iterable object)是数组的泛化。这个概念是说任何对象都可以被定制为可在 `for..of`循环中使用的对象。

想要让一个普通对象成为可迭代对象：

- 必须具有 `Symbol.iterator` 方法, 该方法就是迭代器。(方法加到原型上)
- 迭代器是具有 `next()` 方法的对象，`next()` 方法返回 `{done:.., value :...}` 格式的迭代器对象

```JavaScript
const range = {
  from: 1,
  to: 5
};

// 1. for..of 调用首先会调用这个：
range[Symbol.iterator] = function() {

  // 返回迭代器：
  // 2. 接下来，for..of 仅与下面的迭代器一起工作，要求它提供下一个值
  return {
    current: this.from,
    last: this.to,

    // 3. next() 在 for..of 的每一轮循环迭代中被调用
    next() {
      // 4. 它将会返回 {done:.., value :...} 格式的对象
      if (this.current <= this.last) {
        return { done: false, value: this.current++ };
      } else {
        return { done: true };
      }
    }
  };
};

// 现在它可以运行了！
for (let num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}
```

##### 参考

- [Iterable object](https://zh.javascript.info/iterable#symboliterator)
