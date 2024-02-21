---
title: 'JS类常见一般算法题'
date: 2022-09-23T14:32:40+08:00
---

记录一下非力扣，但是是 JS 常见的一般类算法题，比较简单。

### tree/扁平化互换

题目：

```js
// 扁平数组
const arr = [
    { id: 1, name: '1', pid: 0 },
    { id: 2, name: '2', pid: 1 },
    { id: 3, name: '3', pid: 1 },
    { id: 4, name: '4', pid: 3 },
    { id: 5, name: '5', pid: 3 }
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

```js
// tree扁平化 就是个树的遍历而已
function treeToArr(tree) {
    const res = []
    const getChildren = tree => {
        for (const node of tree) {
            const { id, name, pid } = node
            res.push({ id, name, pid })
            if (node.children) getChildren(node.children)
        }
    }
    getChildren(tree)
    return res
}

const transToArr = arr => {
    const res = []
    const getChildren = arr => {
        arr.forEach(item => {
            const obj = {
                id: item.id,
                pid: item.pid,
                name: item.name
            }
            res.push(obj)
            if (item.children.length) getChildren(item.children)
        })
    }
    getChildren(arr)
    return res
}
```

---

扁平化转树，往往有些人写不出来，是因为对于递归不够熟悉。如果能够联想到使用 pid 去寻找子集，那么我觉得还是比较容易的吧。

```js
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

/**
 * 2024.02.15 重新写了一版，应该更简单
 */
const transToTree = (arr, pid) => {
    if (!arr.length) return
    const rootItems = arr.filter(item => item.pid === pid)
    for (let i = 0; i < rootItems.length; ++i) {
        const item = rootItems[i]
        item.children = arr.filter(_item => _item.pid === item.id)
        transToTree(arr, item.id)
    }
    return rootItems
}
```

上方是写出来了，但是呢，这个复杂度有点高，怎么优化呢？往往需要借助数据结构 Map：

```js
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

---

### 斐波那契数列

核心就是滚动数组的思想。

```js
function fib(n) {
    if (n <= 1) return n
    let p = 0,
        q = 0,
        r = 1
    for (let i = 2; i <= n; ++i) {
        p = q
        q = r
        r = p + q
    }
    return r
}
```

---

### 大数相加

JS 的数值是有范围的，超过范围后就会损失精度，大数相加往往是通过字符串来实现的。

在相加的过程中考虑进位即可。

```js
function bigSum(a, b) {
    // 先补齐长度
    const maxLength = Math.max(a.length, b.length)
    a = a.padStart(maxLength, 0)
    b = b.padStart(maxLength, 0)

    // 再从末尾开始相加
    let c = 0 // 进位
    let sum = ''
    for (let i = maxLength - 1; i >= 0; --i) {
        let t = parseInt(a[i]) + parseInt(b[i]) + c
        c = Math.floor(t / 10)
        sum = (t % 10) + sum
    }
    if (c == 1) sum = c + sum // 注意不要遗漏最后的进位
    return sum
}

console.log(bigSum('9007199254740991', '1234567899999999999'))
```

### 给数字每三位加逗号

可以通过一个 counter 变量计数，也可以每次从末尾截取 3 个。

```js
const num = 20230102 // expect: 20,230,102

function toThousand(num) {
    let counter = 0
    let temp = num.toString()
    let res = ''
    for (let i = temp.length - 1; i >= 0; --i) {
        counter++
        res = temp[i] + res
        if (counter % 3 === 0 && i !== 0) {
            res = ',' + res
        }
    }
    return res
}

function toThousand2(num) {
    let temp = num.toString()
    let res = ''
    while (temp.length) {
        res = ',' + temp.slice(-3) + res
        temp = temp.slice(0, -3)
    }
    return res.slice(1)
}
```

### faltten 多种实现

```js
// 1. api
arr.flat(Infinity)
// 2. 递归
const arr = [1, 2, 3, [4, [5, 6], [7, [8, [9]]]], 10]
const flatten = arr => {
    const res = []
    // 定义递归遍历 入参为数组 过程中加入 res
    const traverse = arr => {
        for (let i = 0; i < arr.length; ++i) {
            if (Array.isArray(arr[i])) {
                traverse(arr[i])
            } else {
                res.push(arr[i])
            }
        }
    }
    traverse(arr)
    return res
}
// 3. reduce
const flatten = arr =>
    arr.reduce((t, v) => (Array.isArray(v) ? t.push(...flatten(v)) : t.push(v), t), [])
```
