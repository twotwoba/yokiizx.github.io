---
title: '层叠上下文(SC)'
date: 2022-09-27T17:11:07+08:00
tags: [CSS]
---

### 层叠顺序

DOM 发生重叠在垂直方向上的显示顺序：

![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/20221006131841.png)

从最低到最高实际上是 `装饰->布局->内容` 的变化，比如内联才比浮动的高。

> 注意，`background/border` 是必须层叠上下文的，普通元素的会高于负 `z-index` 的。
> `z-index:0` 与 `z-index:auto` 的层叠等级一样，但是层叠上下文有根本性的差异。

### 层叠上下文

层叠上下文，英文全称（stacking context）。相比普通的元素，级别更高，离人更近。

#### 特性

- 层叠上下文的层叠水平要比普通元素高
- 层叠上下文可以阻断元素的混合模式([isolation: isolate](https://www.zhangxinxu.com/wordpress/2016/01/understand-css3-isolation-isolate/))
- 层叠上下文可以嵌套，内部层叠上下文及其所有子元素均受制于外部的层叠上下文
- 每个层叠上下文和兄弟元素独立，也就是当进行层叠变化或渲染的时候，只需要考虑后代元素
- 每个层叠上下文是自成体系的，当元素发生层叠的时候，整个元素被认为是在父层叠上下文的层叠顺序中

### 创建

- 根 html
- `position` 为 `relative/absolute/fixed` 且具有 `z-index` 为数值的元素
  目前 chrome 单独 `position: fixed` 也会变成层叠上下文
- 父 `display: flex/inline-flex`，具有 `z-index` 为数值的子元素(注意是子元素)
- `opacity` 不为 1
- `transform` 不为 none
- `filter` 不为 none
- 其他 css3 属性，见下方张鑫旭大佬的博客。

### 层叠等级

同一个层叠上下文中，元素在垂直方向的显示顺序。

所有元素都有层叠等级，普通元素的层叠等级由所在的层叠上下文决定，否则无意义。

### 规则

- 谁大谁上：在同一个层叠上下文领域，层叠等级值大的那一个覆盖小的那一个。
- 后来居上：当元素的层叠等级一致、层叠顺序相同的时候，在 DOM 流中处于后面的元素会覆盖前面的元素。

### 一道经典题

改动下方代码，让方框内显示红色。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
      .parent {
        position: relative;
        width: 100px;
        height: 100px;
        border: 1px solid blue;
        background-color: yellow;
      }
      .child {
        width: 100%;
        height: 100%;
        position: absolute;
        z-index: -1;
        background-color: red;
      }
    </style>
  </head>
  <body>
    <div class="box">
      <div class="parent">
        <div class="child"></div>
        <div>我是文案</div>
      </div>
    </div>
  </body>
</html>
```

其实就是把父元素变成层叠上下文即可。  
parent 为普通元素时，普通 block > 层叠上下文的 background，显示为黄色。
parent 为层叠上下文的时候（比如 z-index： 0），后来居上，子元素的背景就会覆盖父元素的背景了。
子元素 z-index 为-1 才能让文案显示出来，因为文案是 inline

### 参考

- [深入理解 CSS 中的层叠上下文和层叠顺序](https://www.zhangxinxu.com/wordpress/2016/01/understand-css-stacking-context-order-z-index/?shrink=1)
