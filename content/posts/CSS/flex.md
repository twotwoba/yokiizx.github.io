---
title: 'flex'
date: 2022-09-27T17:10:53+08:00
tags: [CSS]
---

flex 是 css 界的宠儿，基础的就不记录了，直接参考[Flex 布局教程：语法篇](https://www.ruanyifeng.com/blog/2015/07/flex-grammar.html)

主要记录下需要注意的地方。

##### 上下文影响

1. flex 会让元素变成 BFC
2. 会让具有 z-index 且值不为 auto 的子元素成为 SC

##### align-items 和 align-content

- align-items 针对 单行，作用于行内所有盒子的对齐行为
- align-content 针对 多行，对于 `flex-wrap: no-wrap` 无效，作用于行的对齐行为

##### flex 的计算

flex 能完美自适应大小，是因为有一套计算逻辑，学习一下。

```css
/* grow  shrink basis */
/* 1     1      0 */
flex: 1;
/* 1     1      auto */
flex: auto;
/* 0     0      auto */
flex: none;
```

> 涉及到计算的比较重要的属性是 `flex-basis`，表示分配空间之前，占据主轴的空间大小，`auto` 表示为元素本身的大小。
> `flex-basis` 为百分比时，会忽略自身的 width 来计算空间。

下面说下大致的计算过程：

1. 得到剩余空间 = 总空间 - 确定的空间
2. 得到需要分配的数量 = `flex-grow` 为 1 的盒子数量
3. 得到单位空间大小 = 剩余空间 / 分配数量
4. 得到最终长度 = 单位空间 \* 分配数量 + 原来的长度

```html
<div class="wrap">
  <div class="item-1"></div>
  <div class="item-2"></div>
  <div class="item-3"></div>
</div>
<style>
  .wrap {
    display: flex;
    width: 600px;
    background-color: yellowgreen;
  }

  .item-1 {
    width: 100px;
  }
  .item-2 {
    width: 200px;
  }
  .item-3 {
    flex: 1;
  }
</style>
```

过程如下：

```m
rest = 600 - 100 - 200 - 0 = 300
count = 1
unit = rest / count
total = unit * 1 + 0
```

所以 `flex: 1` 就是占据剩下的所有空间。

如果是下面这样的呢？

```css
.item-1 {
  flex: 2 1 10%;
}
.item-2 {
  flex: 1 1 10%;
}
.item-3 {
  width: 100px;
  flex: 1 1 200px;
}
```

过程如下：

```m
rest = 600 - 600 * 0.1 - 600 * 0.1 - 200 = 280
count = 2 + 1 + 1 = 4
unit = rest / count = 70
item1: 600 _ 0.1 + 2 _ 70 = 200
item2: 600 _ 0.1 + 1 _ 70 = 130
item3: 200 + 70 270
```

关于缩小的，可以参考 - [这篇文章](https://www.cnblogs.com/liyan-web/p/11217330.html)

##### flex: 1 滚动条不生效

当发生 flex 嵌套，多个 flex： 1 时，会产生 flex1 内的元素滚动失效，往往需要加上 `height: 0` 来解决。

```html
<style>
  html,
  body {
    height: 100%;
  }

  .wrap {
    display: flex;
    width: 500px;
    height: 100%;
    flex-direction: column;
    background-color: yellowgreen;
  }

  .head,
  .foot,
  .center-header {
    height: 20px;
    background-color: black;
  }

  .center {
    display: flex;
    flex: 1;
    /* 关键代码，需要在这里设置 height 为 0，这样子元素才会滚动起来 */
    height: 0;
    flex-direction: column;
  }

  .center-content {
    flex: 1;
    overflow: auto;
  }

  .item {
    height: 50px;
    margin: 20px;
    background-color: pink;
  }
</style>
<body>
  <div class="wrap">
    <div class="head"></div>
    <div class="center">
      <div class="center-header"></div>
      <div class="center-content">
        <div class="item"></div>
        <div class="item"></div>
        <div class="item"></div>
        <div class="item"></div>
        <div class="item"></div>
        <div class="item"></div>
        <div class="item"></div>
      </div>
    </div>
    <div class="foot"></div>
  </div>
</body>
```
