---
title: 'JS关于DOM部分(元素)'
date: 2022-09-20T17:06:54+08:00
tags: [HTML, DOM]
---

## DOM 的大小

##### box-sizing

`content-box` | `border-box` 控制 css 中 width 设置的是 content 还是 content + padding（根据属性名很容易区分）。

> 文字会溢出到`padding-bottom`

##### offsetTop/offsetLeft offsetParent

offsetParent: 获取最近的祖先：

- position 为 absolute，relative 或 fixed
- 或 body
- 或 table, th, td

offsetTop/offsetLeft： 元素带 border 相对于最近的祖先偏移距离

##### offsetWidth/offsetHeight

包含 boder 的完整大小

##### clientTop/clientLeft

content 相对于 border 外侧的宽度

> 当系统为阿拉伯语滚动条在左侧时，client 就变成了 border-left + 滚动条的宽度

##### clientWidth/clientHeight

content + padding 的宽度，不包括滚动条

##### scrollTop/scrollLeft

元素超出 contentHeight/conentWidth 的部分

##### scrollWidth/scrollHeight

元素实际的宽高

## 滚动

```JavaScript
scrollBy(x,y) // 相对自身偏移
scrollTo(pageX,pageY) // 滚动到绝对坐标
scrollToView() // 滚到视野里
```

## 常用的操作

- 判断是否触底（无限加载之类）：`offsetHeight + scrollTop >= scollHeight`
- 判断是否进入可视区域（懒加载图片之类）：`offsetTop < clientHeight + scrollTop`

## 坐标

- clientX/clientY 相对于窗口
- pageX/pageY 相对于文档

一个 API
`dom.getBoundingClientRect()`
返回: x,y,top,left,right,bottom,width,height

> 注意,x,y 与 left,top 并不是多余重复的元素，而是在制定了起点时，x,y 会改变，它是矩形原点相对于窗口的 X/Y 坐标。

## 获取 dom 样式的方式

- dom.style，获取行内样式，并且可以修改
- dom.currentStyle，只能获取样式
- windwo.getComputedStyle(dom)，只能获取样式（IE 兼容较差）
