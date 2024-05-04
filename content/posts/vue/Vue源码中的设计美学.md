---
title: 'Vue2 源码中的设计美学'
date: 2022-04-30
series: []
categories: [Vue]
weight:
---

## 为什么能通过 this.xxx 就能访问到对应的 methods 和 data

methods 能通过 this 访问比较简单，就是在初始化的时候，通过 bind 修正 this 指向 vue 的实例。

```js
class Person {
    constructor(name) {
        this.name = name
    }
}

/**
 * 源码中实现 this.methodXxx 的主要部分
 */
function initMethods(vm, methods) {
    for (const key in methods) {
        vm[key] = typeof methods[key] === 'function' ? methods[key].bind(vm) : () => {}
    }
}

const person = new Person('zhang san')
const methods = {
    a: () => {
        console.log('a')
    },
    b: () => {
        console.log('b')
    }
}
initMethods(person, methods)
person.a() // a
person.b() // b
```

data 中的数据能通过 this.xxx 访问则需要数据拦截了。

```js
/**
 * 模拟实现 initData， 源码里 data 是从 this.$options.data 获取的
 */
function initData(vm, data) {
    var data = (vm._data = typeof data === 'function' ? getData(data, vm) : data || {})
    // 代理拦截
    Object.keys(data).forEach(key => proxy(vm, '_data', key))
    // 监听数据
    // observe(data, true /** asRootData */)
}
function getData(data, vm) {
    return data.call(vm, vm)
}

var sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: function () {},
    set: function () {}
}
function proxy(vm, sourcekey, key) {
    sharedPropertyDefinition.get = function getter() {
        return this[sourcekey][key]
    }
    sharedPropertyDefinition.set = function setter(val) {
        this[sourcekey][key] = val
    }
    Object.defineProperty(vm, key, sharedPropertyDefinition)
}

const data = () => {
    return {
        abc: 'hello world'
    }
}
initData(person, data)
console.log(person)
```

## 参考

-   [为什么 Vue2 this 能够直接获取到 data 和 methods](https://juejin.cn/post/7112255428452417549)
