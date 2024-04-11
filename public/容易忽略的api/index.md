# 被忽略的一些API


## MutationObserver

监测 DOM，发生变动时触发。

```js
const observer = new MutationObserver(callback)
// callback 回调参数是 MutationRecord 对象 的数组，第二个参数是观察器自身

observer.observe(node, config)
// node 为观察节点
// config 是对观察节点的一系列配置
// 详细见 https://zh.javascript.info/mutation-observer

observe.disconnect() // 注销观察
observer.takeRecords() // 获取已经发生但未处理的变动
```

**重要特性：**

-   MutationObserver 是异步的，等待所有脚本任务完成后才会运行，也就是说当节点有多次变动，它是在最后才执行一次 Callback
-   把所有变动装进一个数组中处理，而不是一条条地个别处理 DOM 变动

## IntersectionObserver

监听元素是否进入了视口(viewport)。

```js
// callback 一般会触发两次。一次是目标元素刚刚进入视口（开始可见），另一次是完全离开视口（开始不可见）。
var io = new IntersectionObserver(callback, option)
// callback 参数是 IntersectionObserverEntry 对象 的数组，观察了几个元素就有几个对象

// 开始观察
io.observe(document.getElementById('example'))
// 停止观察
io.unobserve(element)
// 关闭观察器
io.disconnect()
```

比过往监听 scroll，然后 getBoundingClientRect 的优势：

1. scroll 事件密集发生，IntersectionObserver 没有大量计算
2. 不会引起重绘回流

适合场景比如图片懒加载，无线滚动等，但是如果需要 buffer 好像就不行了。

```js
const imgs = document.querySelectorAll('img[data-src]')
const config = {
    rootMargin: '0px',
    threshold: 0
}
let observer = new IntersectionObserver((entries, self) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            let img = entry.target
            let src = img.dataset.src
            if (src) {
                img.src = src
                img.removeAttribute('data-src')
            }
            self.unobserve(entry.target) // 解除观察
        }
    })
}, config)

imgs.forEach(image => {
    observer.observe(image)
})
```

## requestAnimationFrame

`window.requestAnimationFrame()` 告诉浏览器——你希望执行一个动画，并且要求浏览器在下次重绘之前调用指定的回调函数更新动画。

优点：

-   CPU 节能：使用 setTimeout 实现的动画，当页面被隐藏或最小化时，setTimeout 仍然在后台执行动画任务，由于此时页面处于不可见或不可用状态，刷新动画是没有意义的，完全是浪费 CPU 资源。而 requestAnimationFrame 则完全不同，当页面处理未激活的状态下，该页面的屏幕刷新任务也会被系统暂停，因此跟着系统步伐走的 requestAnimationFrame 也会停止渲染，当页面被激活时，动画就从上次停留的地方继续执行，有效节省了 CPU 开销。
-   函数节流：在高频率事件(resize,scroll 等)中，为了防止在一个刷新间隔内发生多次函数执行，使用 requestAnimationFrame 可保证每个刷新间隔内，函数只被执行一次，这样既能保证流畅性，也能更好的节省函数执行的开销。一个刷新间隔内函数执行多次时没有意义的，因为显示器每 16.7ms 刷新一次，多次绘制并不会在屏幕上体现出来。

兼容性处理：

```js
window._requestAnimationFrame = (function () {
    return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60)
        }
    )
})()
```

场景: 1. scroll 类密集型监听, 2. 大量数据渲染

eg:

-   平滑滚动到顶部

```js
const scrollToTop = () => {
    const c = document.documentElement.scrollTop || document.body.scrollTop
    if (c > 0) {
        window.requestAnimationFrame(scrollToTop)
        window.scrollTo(0, c - c / 8)
    }
}
```

-   十万条数据渲染

```js
//需要插入的容器
let ul = document.getElementById('container')
// 插入十万条数据
let total = 100000
// 一次插入 20 条
let once = 20
//总页数
let page = total / once
//每条记录的索引
let index = 0
//循环加载数据
function loop(curTotal, curIndex) {
    if (curTotal <= 0) {
        return false
    }
    //每页多少条
    let pageCount = Math.min(curTotal, once)
    window.requestAnimationFrame(function () {
        for (let i = 0; i < pageCount; i++) {
            let li = document.createElement('li')
            li.innerText = curIndex + i + ' : ' + ~~(Math.random() * total)
            ul.appendChild(li)
        }
        loop(curTotal - pageCount, curIndex + pageCount)
    })
}
loop(total, index)
```

> 与 setTimeout 相比，requestAnimationFrame 最大的优势是由系统来决定回调函数的执行时机。具体一点讲，如果屏幕刷新率是 60Hz,那么回调函数就每 16.7ms 被执行一次，如果刷新率是 75Hz，那么这个时间间隔就变成了 1000/75=13.3ms，换句话说就是，requestAnimationFrame 的步伐跟着系统的刷新步伐走。它能保证回调函数在屏幕每一次的刷新间隔中只被执行一次，这样就不会引起丢帧现象，也不会导致动画出现卡顿的问题。

## postMessage

跨窗口通信。

发送

```js
window.postMessage(message, targetOrigin, [transfer])
```

接收

```js
window.addEventListener('message', function (event) {
    if (event.origin != 'http://javascript.info') {
        // 来自未知的源的内容，我们忽略它
        return
    }
    alert('received: ' + event.data)
    // 可以使用 event.source.postMessage(...) 向回发送消息
})
```

场景：

1. 可以跨域通信
2. web worker
3. service worker

### 推荐阅读

-   [postMessage 可太有用了](https://juejin.cn/post/6844903665694687240#heading-11)

