---
title: 'null | undefined'
date: 2022-09-18
tags: [diff, JavaScript]
---

null 和 undefined 都是 JavaScript 的基本数据类型之一，初学者有时候会分不清。

主要有以下的不同点：

- null 是 JavaScript 的保留关键字，undefined 只是 JavaScript 的全局属性，所以 undefined 可以用作变量名，然后被重新赋值，like this：`var undefined = '变身'`
- null 表示空，undefined 表示已声明但未赋值
- null 是原型链的终点
- Number(null) => 0；Number(undefined) => NaN

---

对于上方 undefined 只是一个属性，可以被重新赋值，所以经常可以在很多源码中看见 `void 0` 被用来获取 undefined。

> 关于 void 运算符，就是执行后面的表达式，并且最后始终返回纯正的 undefined

常用的用法还有:

- 更优雅的立即调用表达式(IIFE)  
  `void function(){...}()`

- 箭头函数确保返回 undefined。（防止本来没有返回值的函数返回了数据影响原有逻辑）
  `button.onclick = () => void doSomething()`
