---
title: '容易混淆的API'
date: 2022-09-24T11:28:25+08:00
tags: [JavaScript, DOM]
---

## getElement VS querySelector

1. 性质不同

- getElementsBy\* 是动态的， 类似于引用类型，若之后 dom 发生了改变，则已获取到的 dom 也会相应改变
- querySelectorAll 是静态的，类似于快照的意思，获取后就不会再变了

```html
<div class="demo">First div</div>

<script>
  let divs1 = document.getElementsByTagName('div');
  let divs2 = document.querySelectorAll('div');
  console.info(divs1.length); // 1
  console.info(divs2.length); // 1
</script>

<div class="demo">Second div</div>

<script>
  console.info(divs1.length); // 2
  console.info(divs2.length); // 1

  console.log(document.getElementsByClassName('demo'));
  console.log(document.querySelectorAll('.demo'));
</script>
```

2. 返回值不同

- getElementsBy\* 返回的是 HTMLCollection
- querySelectorAll 返回值是 NodeList

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/20220918155922.png)

> HTMLCollection 比 NodeList 多了个 `namedItem(name)` 方法，根据 name 属性获取 dom
> NodeList 相比 HTMLCollection 多了更多的信息，比如注释，文本等

## navigator | location | history

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/20220918151505.png)

### navigator

提供了有关浏览器和操作系统的背景信息，api 有很多，记两个常用的
`navigator.userAgent` —— 关于当前浏览器
`navigator.platform` —— 关于平台（有助于区分 Windows/Linux/Mac 等）

### location

location 顾名思义，主要是对地址栏 URL 的操作。

具体如下: `location.xxx`

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/20220918164450.png)

两个主要点：

1. origin -- 只能获取，不能设置，其他都可
2. protocol -- 不要漏了最后的冒号`:`
3. 还有一种带 password 的，很少用就不记录了

### history

history 顾名思义，主要是对浏览器的浏览历史进行操作。

### vue-router/react-router 原理

都有两种模式 hash 模式和 history 模式，分别基于 location.hash 和 history 的 api: `pushState`,`replaceState`

- hash 模式

  1. 改变 hash 值
  2. 监听 hashchange 事件即可实现页面跳转

  ```JavaScript
  window.addEventListener('hashchange', () => {
   const hash = window.location.hash.slice(1)
   // 根据hash值渲染不同的dom
  })
  ```

  > 不会向服务器发起请求，只会修改浏览器访问历史记录

- history 模式

  1. 改变 url （通过 `pushState()` 和 `replaceState()`）

  ```JavaScript
  // 第一个参数：状态对象，在监听变化的事件中能够获取到
  // 第二个参数：标题
  // 第三个参数：跳转地址url
  history.pushState({}, "", '/a')
  ```

  2. 监听 `popstate` 事件

  ```JavaScript
  window.addEventListener("popstate", () => {
    const path = window.location.pathname
    // 根据path不同可渲染不同的dom
  })
  ```

  > pushState 和 replaceState 也只是改变历史记录，不会向服务器发起请求  
  > 但是如果直接访问非 index.html 所在位置的 url 则服务器会报 404 因为我们是单页应用，根本就没有子路由的路径

  解决方案很多，常用的解决方案的话就是后端配置 nginx

  ```sh
  location / {
    root html;
    index index.html index.htm;
    #新添加内容
    #尝试读取$uri(当前请求的路径)，如果读取不到读取$uri/这个文件夹下的首页
    #如果都获取不到返回根目录中的 index.html
    try_files $uri $uri/ /index.html;
  }
  ```

  > 增加一个前端需要了解的 nginx 知识，跨域配置：[Nginx 跨域配置](https://www.cnblogs.com/itzgr/p/13343387.html)

## slice | substr | substring

这个是常用的三个字符串的截取方法，经常搞混，记录一下。

1. 都有两个参数，只不过不太一样的是 `substr` 截取的是长度，其他是索引

   - `slice(start,end)`[^1]
   - `substr(start,len)`
   - `substring(start,end)`
     > 注意索引都是左闭右开的：`[start, end)`

2. 对于负值的处理不同
   - slice 把所有的<mark>负值加上长度转为正常的索引</mark>，且只能从前往后截取  
     (`start > end`则返回空串)
   - substring 负值全部转为 `0`，可以做到从后往前截取  
     (`substring(5, -3)` <==> `substring(0, 5)`)
   - substr 第一个参数为负与 slice 处理方式相同,第二个参数为负与 substring 处理方式相同

[^1]: 字符串中有一些和数组共用的方法，类似的还有 indexOf，includes，concat 等

## undefined | null

null 和 undefined 都是 JavaScript 的基本数据类型之一，初学者有时候会分不清。

主要有以下的不同点：

- null 是 JavaScript 的保留关键字，undefined 只是 JavaScript 的全局属性，所以 undefined 可以用作变量名，然后被重新赋值，like this：`var undefined = '变身'`
- null 表示空，undefined 表示已声明但未赋值
- null 是原型链的终点
- Number(null) => 0；Number(undefined) => NaN

对于上方 undefined 只是一个属性，可以被重新赋值，所以经常可以在很多源码中看见 `void 0` 被用来获取 undefined。

> 关于 void 运算符，就是执行后面的表达式，并且最后始终返回纯正的 undefined

常用的用法还有:

- 更优雅的立即调用表达式(IIFE)  
  `void function(){...}()`

- 箭头函数确保返回 undefined。（防止本来没有返回值的函数返回了数据影响原有逻辑）
  `button.onclick = () => void doSomething()`

## 参考

- [现代 JavaScript 教程](https://zh.javascript.info/document)
