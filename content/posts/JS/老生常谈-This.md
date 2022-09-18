---
title: '老生常谈 -- This'
date: 2022-09-17T01:25:06+08:00
tags: ['JavaScript']
---

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/this.png)

回想起刚刚进入这行的时候，被 this 没少折腾，回忆记录一下吧~

## 默认绑定

非严格模式下，this 指向 window/global，严格模式下 this 指向 undefined

```JavaScript
function demo() {
  console.log(this) // window
}
```

```JavaScript
'use strict'
function demo() {
  console.log(this) // undefined
}
```

## 显式绑定

其实我更愿意称其为`强制绑定`哈哈哈。三个流氓 `apply`、`call`、`bind` 强行霸占 `this` 小美女!
这三个函数都会劫持 this，绑定到指定的对象上。
不同的地方是：`call 和 apply 会立即执行,而 bind 不会立即执行，返回 this 修改指向后的函数`。
如果你把 null 或者 undefined 作为 this 的绑定对象传入 call、apply 或者 bind，这些值 在调用时会被忽略，实际应用的是默认绑定规则，也就是全局对象。

## 隐式绑定

普通函数在的执行时，创建它的执行上下文，此时才能决定 this 的指向，谁调用 this 指向这个对象。

```JavaScript
var name = 'yokiizx';
var demo = {
    name: '94yk',
    learn () {
        console.log(this.name + ' is learning JS');
    }
};
demo.learn(); // 上下文为demo
// 94yk is learning JS

/* ---------- 用一个变量去引用对象的方法 ---------- */
var learn = demo.learn;
learn(); // 上下文为window
// yokiizx is learning JS   (注意是浏览器环境下)
```

有些人喜欢把上方第二种情况称为 `this 丢失`，其实在我看来，`无非就是上下文的不同而已`。

> 注意：变量是使用`var`关键字进行声明的而非`let/const`；
> 若是 `name` 用 `let/const` 声明，则最后在浏览器中的输出是'undefined is learning JS'；
> 原因是：只有 var 声明的变量才会被加到它所在的上下文的变量对象上，详细见前文--闭包

## 箭头函数

首先明确一点，`箭头函数自身没有 this！没有 this！没有 this！`

平时所见到的箭头函数中的 this，其实指向的就是是它定义时所处的上下文，这是与普通函数的区别

```JavaScript
var name = 'yokiizx';
var demo = {
    name: '94yk',
    learn: () => {
        console.log(this.name + ' is learning JS'); // this 指向全局上下文 window
    }
};
demo.learn() // yokiizx is learning JS
```

> 箭头函数还有没有原型链，不能 new 实例化，没有 arguments 等特点。

小结：

```JavaScript
var name = 'outer_name'
var obj = {
  name: 'inner_name',
  log1: function () {
    console.log(this.name) // 普通函数自带上下文，this 指向调用时的上下文 (谁调用指向谁)
  },
  log2: () => {
    console.log(this.name) // window环境: this 指向 window   ||   node环境: this 指向空对象 {}
  },
  log3: function () {
    return function () {
      console.log(this.name) // this 指向调用时的上下文 (谁调用指向谁)
    }
  },
  log4: function () {
    return () => {
      console.log(this.name) // this 指向声明所处位置外部第一个上下文，若是函数上下文，指向调用函数的对象，若是全局上下文，就指向window
    }
  }
}

/******* 注意 *******/
var log_4 = obj.log4()  // 让内部箭头函数确定了 this 指向的是obj
var demo = {
  name: 'demo'
}
log_4.call(demo) // inner_name
```

> 注意上方，箭头函数的另一个特点，一旦确定了它的 this 指向，即使是强制绑定也不能改变它的 this 指向。

## new 绑定

this 指向新创建的实例对象

```JavaScript
function _new(fn, ...args) {
  // 创建新对象,修改原型链  obj.__proto__ 指向 fn.prototype
  const obj = Object.create(fn.prototype)
  // 修改this指向
  const res = fn.call(obj, ...args)
  // 看返回的结果是不是对象
  return res instanceof Object ? res : obj;
}
```

## 总结

其实 this 存在的原因就是为了方便程序员的书写，相比 window.xxx/someObj.xxx，this.xxx 显然来的更加简单便捷，可以看做它只不过是你调用的方法所在上下文的一个代理而已。简单一句话：`谁调用的这个方法,this 就指向谁`，当然了，想要清楚来龙去脉，还是要对上下文的理解够深入。
