# 缓存淘汰算法 -- LRU


缓存淘汰算法

## LRU

LRU（Least recently used，最近最少使用）。

我个人感觉这个命名少了个动词，让人理解起来怪怪的，缓存淘汰算法嘛，**淘汰最近最少使用**。

它的核心时：如果数据最近被访问过，那么将来被访问的几率也更高。

### 简单实现

LRU 一般使用双向链表+哈希表实现，在 JavaScript 中我使用 **Map** 数据结构来实现缓存，因为 Map 可以保证加入缓存的**先后顺序**，

不同的是，这里是把 Map cache 的尾当头，头当尾。

```js
class LRU {
    constructor(size) {
        this.cache = new Map()
        this.size = size
    }
    // 新增时，先检测是否已经存在
    put(key, value) {
        if (this.cache.has(key)) this.cache.delete(key)
        this.cache.set(key, value)
        // 检查是否超出容量
        if (this.cache.size > this.size) {
            this.cache.delete(this.cache.keys().next().value) // 删除Map cache 的第一个数据
        }
    }
    // 访问时，附件重新进入缓存池的动作
    get(key) {
        if (!this.cache.has(key)) return -1
        const temp = this.cache.get(key)
        this.cache.delete(key)
        this.cache.set(key, temp)
        return temp
    }
}
```

分析：

1. cache 中的元素必须有时序, 便于后面删除需要淘汰的那个
2. 在 cache 中快速找到某个 key,判断是否存在并且得到对应的 val O(1)
3. 访问到的 key 需要被提到前面, 也就是说得能实现快速插入和删除 O(1)

### lc.146 LRU 缓存

```js
/**
 * @param {number} capacity
 */
var LRUCache = function (capacity) {
    this.cache = new Map()
    this.capacity = capacity
}

/**
 * @param {number} key
 * @return {number}
 */
LRUCache.prototype.get = function (key) {
    if (!this.cache.has(key)) return -1
    const val = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, val)
    return val
}

/**
 * @param {number} key
 * @param {number} value
 * @return {void}
 */
LRUCache.prototype.put = function (key, value) {
    if (this.cache.has(key)) this.cache.delete(key)
    this.cache.set(key, value)
    if (this.cache.size > this.capacity) {
        this.cache.delete(this.cache.keys().next().value)
    }
}

/**
 * Your LRUCache object will be instantiated and called as such:
 * var obj = new LRUCache(capacity)
 * var param_1 = obj.get(key)
 * obj.put(key,value)
 */
```

---

### 双向链表版本

```js
class ListNode {
    constructor(key = 0, value = 0) {
        this.key = key
        this.value = value
        this.prev = null
        this.next = null
    }
}

/**
 * @param {number} capacity
 */
var LRUCache = function (capacity) {
    this.capacity = capacity
    this.cache = new Map()
    this.head = new ListNode()
    this.tail = new ListNode()
    this.head.next = this.tail
    this.tail.prev = this.head
}

/**
 * @param {number} key
 * @return {number}
 */
LRUCache.prototype.get = function (key) {
    const node = this.cache.get(key)

    if (node) {
        node.prev.next = node.next
        node.next.prev = node.prev

        node.next = this.head.next
        node.prev = this.head.next.prev
        this.head.next.prev = node
        this.head.next = node
    }

    return node ? node.value : -1
}

/**
 * @param {number} key
 * @param {number} value
 * @return {void}
 */
LRUCache.prototype.put = function (key, value) {
    let node = null
    if (this.cache.has(key)) {
        node = this.cache.get(key)
        node.value = value
        node.prev.next = node.next
        node.next.prev = node.prev
    } else {
        node = new ListNode(key, value)
    }

    node.next = this.head.next
    node.prev = this.head.next.prev
    this.head.next.prev = node
    this.head.next = node

    if (!this.cache.has(key) && this.cache.size === this.capacity) {
        // remove
        this.cache.delete(this.tail.prev.key)
        this.tail.prev = this.tail.prev.prev
        this.tail.prev.next = this.tail
    }

    this.cache.set(key, node)
}

/**
 * Your LRUCache object will be instantiated and called as such:
 * var obj = new LRUCache(capacity)
 * var param_1 = obj.get(key)
 * obj.put(key,value)
 */
```

小心指针的变换就好了。

<!-- TODO 双向链表版本的 LRU 后续有空了补充

双向链表：

```js
/** 双向链表实现 */
function Node(key, value) {
    this.key = key
    this.value = value
    this.next = null
    this.prev = null
}
class DoubleList {
    constructor() {
        // 虚拟头尾节点
        this.head = new Node(0, 0)
        this.tail = new Node(0, 0)
        this.head.next = this.tail
        this.tail.prev = this.head
        this.size = 0
    }
    addLast(node) {
        // 注意这里不是直接指向head而是指向的尾部的前一个
        node.prev = this.tail.prev
        node.next = this.tail
        this.size++
        this.tail.prev.next = node
        this.tail.prev = node
    }
    // 删除node并且返回删除的key,需要去处理map
    remove(node) {
        node.prev.next = node.next
        node.next.prev = node.prev
        this.size--
        return node.key
    }
    removeFirst() {
        if (this.head.next === this.tail) return null
        return this.remove(this.head.next)
    }
}
``` -->

<!--

## LFU

LFU（Least Frequently Used，最少频繁使用）。
也就是使用最不频繁的将被淘汰，这个我目前就是先了解一下，后续需要深入的时候再回过头来看看。😂

核心思想：删除使用频次最低的键值对。如果最低的键值对有多个，则删除其中最旧的那个。

1. 需要一个 key, value 映射
2. 需要一个 key, freq 映射
3. 这个需求应该是 LFU 算法的核心，所以我们分开说。
    - 首先，肯定是需要 freq 到 key 的映射，用来找到 freq 最小的 key。
    - 将 freq 最小的 key 删除，那你就得快速得到当前所有 key 最小的 freq 是多少。想要时间复杂度 O(1) 的话，肯定不能遍历一遍去找，那就用一个变量 minFreq 来记录当前最小的 freq 吧。
    - 可能有多个 key 拥有相同的 freq，所以 freq 对 key 是一对多的关系，即一个 freq 对应一个 key 的列表。
    - 希望 freq 对应的 key 的列表是存在时序的，便于快速查找并删除最旧的 key。
    - 希望能够快速删除 key 列表中的任何一个 key，因为如果频次为 freq 的某个 key 被访问，那么它的频次就会变成 freq+1，就应该从 freq 对应的 key 列表中删除，加到 freq+1 对应的 key 的列表中。

> 小提示：LinkedHashSet
> 这篇文章不错：https://halfrost.com/lru_lfu_interview/


// 关于 LRU 还没有嚼透，后续强化
-->

