# 优先队列


JavaScript 中没有内置优先队列这个数据结构，需要自己来实现一下~👻

```javascript
class PriorityQueue {
    constructor(data, cmp) {
        this.data = data
        this.cmp = cmp
        for (let i = data.length >> 1; i >= 0; --i) {
            this.down(i)
        }
    }
    down(i) {
        let left = 2 * i + 1
        while (left < this.data.length) {
            let temp
            if (left + 1) {
                temp = this.cmp(this.data[left + 1], this.data[i]) ? left + 1 : i
            }
            temp = this.cmp(this.data[temp], this.data[left]) ? temp : left
            if (temp === i) {
                break
            }
            this.swap(this.data, temp, i)
            i = temp
            left = 2 * i + 1
        }
    }
    up(i) {
        while (i >= 0) {
            const parent = (i - 1) >> 1
            if (this.cmp(this.data[i], this.data[parent])) {
                this.swap(this.data, parent, i)
                i = parent
            } else {
                break
            }
        }
    }
    push(val) {
        this.up(this.data.push(val) - 1)
    }
    poll() {
        this.swap(this.data, 0, this.data.length - 1)
        const top = this.data.pop()
        this.down(0)
        return top
    }

    swap(data, i, j) {
        const temp = data[i]
        data[i] = data[j]
        data[j] = temp
    }
}
```

<!--
之前的版本 过于精炼，今天重新写个语义比较简单的
自己重新写的时候，差点就写成递归版本了，请记住，迭代一版是要使用 while 的，通过 while 条件来控制循环
第二点就是 比较器内，down i 在后，那么 up 里 i 就在前，一般互斥
-->

测试：

```js
const pq = new PriorityQueue([4, 2, 3, 5, 6, 1, 7, 8, 9], (a, b) => a - b > 0)
console.log('📌📌📌 ~ pq', pq)
console.log(pq.poll())
console.log(pq.poll())
console.log(pq.poll())
pq.push(10)
pq.push(20)
console.log(pq.poll())
console.log(pq.poll())
console.log(pq.poll())
console.log(pq.poll())
```

---

递归版本的 down，up，另外使用了堆顶守卫简化

-   精髓之一：**数组的第一个索引 0 空着不用**
-   精髓之二：插入或者删除元素的时候，需要元素自动排序

```js
class PriorityQueue {
    constructor(data, cmp) {
        // 使用堆顶守卫，更方便上浮时父节点的获取 p = i >> 1, 子节点本身就比较好获取倒是无所谓
        this.data = [null, ...data]
        this.cmp = cmp
        for (let i = this.data.length >> 1; i > 0; --i) this.down(i) // 对除最后一层的子节点进行堆化初始化
    }
    get size() {
        return this.data.length - 1
    }
    swap(i, j) {
        ;[this.data[i], this.data[j]] = [this.data[j], this.data[i]]
    }
    // 递归上浮和下沉
    down(i) {
        if (i === this.size) return
        const j = i
        const l = i << 1
        const r = l + 1
        if (l <= this.size && this.cmp(this.data[i], this.data[l])) i = l
        if (l <= this.size && this.cmp(this.data[i], this.data[r])) i = r
        if (i !== j) {
            this.swap(i, j)
            this.down(i)
        }
    }
    up(i) {
        if (i === 1) return
        const p = i >> 1
        if (this.cmp(this.data[p], this.data[i])) {
            this.swap(p, i)
            this.up(p)
        }
    }
    push(val) {
        this.up(this.data.push(val) - 1) // 加入队列后进行上浮处理
    }
    poll() {
        this.swap(1, this.size) // 先交换首尾，方便后面出队
        const top = this.data.pop()
        this.down(1)
        return top
    }
}
```

场景：

-   lc.23 合并 K 个有序链表
-   堆排序也有其中的思想

