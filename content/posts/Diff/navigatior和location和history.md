---
title: 'navigator | location | history'
date: 2022-09-18T15:17:04+08:00
tags: [diff, BOM]
---

本文着重区分一下这三个 BOM api 。

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/20220918151505.png)

##### navigator

提供了有关浏览器和操作系统的背景信息，api 有很多，记两个常用的
`navigator.userAgent` —— 关于当前浏览器
`navigator.platform` —— 关于平台（有助于区分 Windows/Linux/Mac 等）

##### location

location 顾名思义，主要是对地址栏 URL 的操作。

具体如下: `location.xxx`

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/20220918164450.png)

两个主要点：

1. origin -- 只能获取，不能设置，其他都可
2. protocol -- 不要漏了最后的冒号`:`
3. 还有一种带 password 的，很少用就不记录了

##### history

history 顾名思义，主要是对浏览器的浏览历史进行操作。

##### vue-router/react-router 原理

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

  增加一个前端需要了解的 nginx 知识，跨域配置：
  [Nginx 跨域配置](https://www.cnblogs.com/itzgr/p/13343387.html)
