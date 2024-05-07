---
title: 'JS关于DOM部分(事件)'
date: 2022-09-20T21:51:51+08:00
tags: [HTML, DOM]
---

## 浏览器事件

当事件发生时，浏览器会创建一个 event 对象，将详细信息放入其中，并将其作为参数传递给处理程序。
每个处理程序都可以访问 event 对象的属性：

- event.target —— 引发事件的层级最深的元素。
- event.currentTarget —— 处理事件的当前元素（具有处理程序的元素）
- event.eventPhase —— 当前阶段（capturing=1，target=2，bubbling=3）。

### DOM0 和 DOM2 事件模型

有三种事件绑定方式：

- 行内绑定，利用 html 属性，`onclick="..."`
- 动态绑定，利用 dom 属性，`dom.onclick = function`
- 方法, `addEventListener`，`dom.addEventListener(event, handler[, option]`，一定记得清除。

> 其中前三种属于 DOM0 级，第三种属于 DOM2 级。option 若为 Boolean 值，true 表示捕获阶段触发，false 为冒泡阶段触发。

区别：
DOM0 只绑定一个执行程序，如果设置多个会被覆盖。
DOM2 可以绑定多个，不会覆盖，依次执行。

DOM2 有三个阶段：

- 捕获阶段
- 处于目标阶段
- 冒泡阶段

> 对于同一个元素不区分冒泡还是捕获，按照绑定顺序执行
> 阻止事件冒泡，`e.stopPropgation()`; 阻止默认行为，`e.preventDefault()`

如果一个元素在一个事件上有多个处理程序，即使其中一个停止冒泡，其他处理程序仍会执行。
换句话说，event.stopPropagation() 停止向上移动，但是当前元素上的其他处理程序都会继续运行。
有一个 event.stopImmediatePropagation() 方法，可以用于停止冒泡，并阻止当前元素上的处理程序运行。使用该方法之后，其他处理程序就不会被执行。

DOM3 在 DOM2 的基础上添加了更多事件类型。

---

### 事件委托 (react 旧版本中的事件处理方式)

利用冒泡机制。

1. 一个好用的 api：`const ancestor = dom.closest(selector)` 返回最近的与 selector 匹配的祖先
2. 如果`event.target`在 ancestor 中不存在，就不会触发委托在祖先元素上的事件。

实例：

1. react 旧版本事件机制
2. markup 标记

```HTML
<!-- data-xxx属性，在js中可以使用dataset.xxx来获取属性值 -->
 <div id="menu">
  <button data-action="save">Save</button>
  <button data-action="load">Load</button>
  <button data-action="search">Search</button>
</div>
 <script>
  class Menu {
    constructor(elem) {
      this._elem = elem;
      elem.onclick = this.onClick.bind(this); // 这里将onclick绑定到this,这样触发的就是event.currentTarget而不是event.target
    }

    save() {
      alert('saving');
    }
    load() {
      alert('loading');
    }
    search() {
      alert('searching');
    }

    onClick(event) {
      let action = event.target.dataset.action;
      if (action) {
        this[action]();
      }
    };
  }

  new Menu(menu); // 可以直接用id来获取元素
 </script>
```

- 优点
  - 简化初始化并节省内存：无需添加许多处理程序。
  - 更少的代码：添加或移除元素时，无需添加/移除处理程序。
- 缺点
  - 首先，事件必须冒泡。而有些事件不会冒泡。此外，低级别的处理程序不应该使用 event.stopPropagation()。
  - 其次，委托可能会增加 CPU 负载，因为容器级别的处理程序会对容器中任意位置的事件做出反应，而不管我们是否对该事件感兴趣。但是，通常负载可以忽略不计，所以我们不考虑它。

## 自定义事件

```js
const event = new Event(type[, options]);
const customEvent = new CustomEvent(type[, options]);

options: {
  bubbles: false, // 能否冒泡
  cancelable: false // 是否阻止默认行为
}

// CustomEvent 中多了个 detail 的选项
```

> 自定义事件的监听一定要写在在分发之前

> 有一种方法可以区分“真实”用户事件和通过脚本生成的事件。
> 对于来自真实用户操作的事件，event.isTrusted 属性为 true，对于脚本生成的事件，event.isTrusted 属性为 false。

## 参考

- [事件委托](https://zh.javascript.info/event-delegation)
- [事件模型](https://javascript.ruanyifeng.com/dom/event.html#toc16)
