# 常用内置 API 的实现


### new

```js
function _new(ctor, ...args) {
    const obj = Object.create(ctor.prototype)
    const ret = ctor.call(obj, ...args)
    const isFunc = typeof ret === 'function'
    const isObj = typeof ret === 'object' && ret !== null
    return isFunc || isObj ? ret : obj
}
```

### instanceof

```js
/**
 * ins  - instance
 * ctor - constructor
 */
function _instanceof(ins, ctor) {
    let __proto__ = ins.__proto__
    let prototype = ctor.prototype
    while (true) {
        if (__proto__ === null) return false
        if (__proto__ === prototype) return true
        __proto__ = __proto__.__proto__
    }
}
```

> 建议判断类型使用：  
> `Object.prototype.toString.call(source).replace(/\[object\s(.*)\]/, '$1')`

### call/apply

加载到函数原型上，注意：不能使用箭头函数哦，否则 this 指向会指向全局对象去了~

```js
Function.prototype._call = function (ctx = window, ...args) {
    ctx.fn = this
    const res = ctx.fn(...args)
    delete ctx.fn
    return res
}
Function.prototype._apply = function (ctx, args) {
    ctx.fn = this
    const res = args ? ctx.fn(...args) : ctx.fn()
    delete ctx.fn
    return res
}
```

### bind

bind 与 call/apply 不同的是返回的是函数，而不是改变上下文后直接立即就执行了。

另外需要考虑返回的函数如果能做构造函数的情况。

```js
Funtion.prototype._bind = function (ctx = window, ...args) {
    const fn = this
    const resFn = function () {
        // 这里的this指向调用该函数的对象,如果被new则指向new生成的新对象
        const _ctx = this instanceof resFn ? this : ctx
        return fn.apply(_ctx, args.concat(...arguments))
    }
    // 作为构造函数要继承 this，采用寄生组合式继承
    function F() {}
    F.prototype = this.prototype
    resFn.prototype = new F()
    resFn.prototype.constructor = resFn

    return resFn
}
```

上方原型式继承也可以这么写：

```js
let p = Object.create(this.prototype)
p.constructor = resFn
resFn.prototype = p
```

### 深拷贝

-   需要注意 函数 正则 日期 ES 新对象等，需要用他们的构造器创建新的对象
-   需要注意循环引用的问题

```js
/**
 * 借助 WeakMap 解决循环引用问题
 */
function deepClone(target, wm = new WeakMap()) {
    if (target === null || typeof target !== 'object') return target

    const constructor = target.constructor
    // 处理特殊类型
    if (/^(Function|RegExp|Date|Map|Set)$/i.test(constructor.name)) return new constructor(target)

    if (wm.has(target)) return wm.get(target)
    wm.set(target, true)

    const commonTarget = Array.isArray(target) ? [] : {}
    for (let prop in target) {
        if (target.hasOwnProperty(prop)) {
            t[prop] = deepClone(target[prop], wm)
        }
    }
    return commonTarget
}
```

### Promise.all & Promise.race

```js
const promiseAll = promises => {
    let res = []
    let count = 0
    return new Promise(resolve => {
        promises.forEach((p, i) => {
            p().then(r => {
                res[i] = r
                count++
                if (count === promises.length) resolve(res)
            })
        })
    })
}
promiseAll(reqs).then(res => console.log('🔥 ---', res))

/* ---------- race ---------- */
function promiseRace(promises) {
    return new Promise((resolve, reject) => {
        for (const p of promises) {
            Promise.resolve(p).then(
                r => resolve(r),
                e => reject(e)
            )
        }
    })
}
```

