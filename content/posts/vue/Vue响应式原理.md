---
title: 'Vue2响应式原理'
date: 2022-10-26T09:58:34+08:00
series: []
categories: [Vue]
weight:
---

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202210261654753.png)

## 核心

VUE2 的响应式原理实现主要基于：

- [Object.defineProperty(obj, prop, descriptor)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- [观察者模式](https://yokiizx.site/posts/js/%E8%A7%82%E5%AF%9F%E8%80%85%E5%92%8C%E5%8F%91%E5%B8%83%E8%AE%A2%E9%98%85/)

### init - reactive 化

Vue 初始化实例时，通过 `Object.defineProperty` 为 `data` 中的所有数据添加 `setter/getter`。这个过程称为 reactive 化。

所以：

- vue 监听不到 data 中的对象属性的增加和删除，必须在初始化的时候就声明好对象的属性。  
  解决方案：或者使用 Vue 提供的 `$set` 方法；也可以用 `Object.assign({}, source, addObj)` 去创建一个新对象来触发更新。

- Vue 也监听不到数组索引和长度的变化，因为当数据是数组时，Vue 会直接停止对数据属性的监测。至于为什么这么做，尤大的解释是：解决性能问题。  
  解决方案：新增用 `$set`，删除用 splice，Vue 对数组的一些方法进行了重写来实现响应式。

看下 `defineReactive` 源码：

```js
// 以下所有代码为简化后的核心代码，详细的见vue2的gihub仓库哈
export function defineReactive(obj: object, key: string, val?: any, ...otehrs) {
  const dep = new Dep()
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      if (Dep.target) dep.depend()
      return value
    },
    set: function reactiveSetter(newVal) {
      const value = getter ? getter.call(obj) : val
      if (!hasChanged(value, newVal)) return
      val = newVal
      dep.notify()
    }
  })
  return dep
}
```

函数 `defineReactive` 在 `initProps`、`observer` 方法中都会被调用（initData 调用 observe），目的就是给数据添加 `getter/setter`。

再看下 `Dep` 源码：

```js
/**
 * 被观察者，依赖收集，收集的是使用到了这个数据的组件对应的 watcher
 */
export default class Dep {
  constructor() {
    this.subs = [] // 收集订阅者(观察者)
  }
  addSub(sub: DepTarget) {
    this.subs.push(sub)
  }
  removeSub(sub: DepTarget) {
    this.subs[this.subs.indexOf(sub)] = null
  }
  depend() {
    // Dep.target 是一个具有唯一id的 watcher 对象
    if (Dep.target) {
      // 收集watcher，建议结合下面的Wather一起看
      Dep.target.addDep(this)
    }
  }
  notify() {
    for (let i = 0, l = subs.length; i < l; i++) {
      const sub = subs[i]
      sub.update()
    }
  }
}
```

结合起来看：

- getter：当 getter 调用的时候，会 调用 wather 的方法，把 watcher 自身加入到 dep 的 subs 中
- setter：当 setter 调用的时候，去 通知执行刚刚注册的函数

### mount - watcher

先看下生命周期 `mountComponent` 函数：

```js
// Watcher 在此处被实例化
export function mountComponent(
    vm: Component,
    el: Element|null|undefined
  ): Component {

  vm.$el = el
  let updateComponent = () => {
    vm._update(vm._render(), /*...*/) // render 又触发 Dep 的 getter
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate
  // (e.g. inside child component's mounted hook),
  // which relies on vm._watcher being already defined
  new Watcher(vm, updateComponent, /* ... */)

  // ...

  return vm
}
```

再看看 `Watcher` 源码

```js
export default class Watcher implements DepTarget {
  constructor(vm: Component | null,expOrFn: string | (() => any), /* ... */) {
    this.getter = expOrFn
    this.value = this.get()
    // ...
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get() {
    // dep.ts 中 抛出的方法，用来设置 Dep.target
    pushTarget(this) // Dep.target = this 也就是这个Watcher的实例对象
    let value
    const vm = this.vm
    // 调用updateComponent重新render,触发依赖的重新收集
    value = this.getter.call(vm, vm)
    return value
  }

  addDep(dep: Dep) {
    // ...精简了
    dep.addSub(this)
  }
  // Watcher 的 update、run方法都会调用 get 来触发 getter 的执行，形成闭环
}
```

结合 `mountComponent` 和 `Watcher` 的源码不能看出：

- `mountComponent` 执行时创建了 `watcher` 对象，一个 vue component 对应一个 `watcher`。`new Watcher` 时，构造器中最终会调用 `updateComponent` 函数，这个函数会调用 `render` 函数重新渲染，再触发 dep 中的 getter，重新收集依赖
- `Watcher` 中实例 this 被设置成了 Dep 的 target，同时该 watcher 对应的组件，只要用到了 data 中的数据，渲染的时候就会把这个 watcher 加入到 dep 的 subs 中

由此，`watcher` 把 vue 组件和 dep 依赖连接了起来。

### update

当 data 中的数据发生改变时，就会触发 setter 函数的执行，进而触发 Dep 的 notify 函数。

```js
notify() {
  for (let i = 0, l = subs.length; i < l; i++) {
    const sub = subs[i]
    sub.update()
  }
}
```

subs 中收集的是每个 watcher，有多少个组件使用到了目标数据，这些个组件都会被重新渲染。

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202210270940977.png)

现在再看开头官网的图应该就很清晰了吧~👻

### 小结

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202302221241366.png)

简单小结一下： vue 中的数据会被 Object.defineProperty() 拦截，添加 getter/setter 函数，其中 getter 中会把组件的 watcher 对象添加进依赖 Dep 对象的订阅列表里，setter 则负责当数据发生变化时触发订阅列表里的 watcher 的 update，最终会调用 vm.render 触发重新渲染，并重新收集依赖。

---

至于 Vue3 的原理，由于目前还未使用过（我更倾向于使用 React，不香嘛~），只是大概了解是使用 `Proxy` 来解决 `Object.defineProperty` 的缺陷的。下面是他人写的总结，有时间可以看看

## 参考

- [这次终于把 Vue3 响应式原理搞懂了！](https://mp.weixin.qq.com/s/F2yYqXE_xTHl0d8j03I-UQ)
