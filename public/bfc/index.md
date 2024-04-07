# 块级格式化上下文(BFC)


块级格式化上下文，英文全称（Block Formatting Context）。

其实我个人的理解呢，就是独立的容器，是页面中的一块渲染区域，并且有一套渲染规则，它决定了其子元素将如何定位，以及与其他元素的关系和相互作用。

### 创建 BFC

常见的：

- 根 html
- position: absolute/fixed
- display: flex/inline-flex/inline-block/grid/inline-grid
- float 不为 none
- overflow 不为 visible 和 clip

> 最新见 [MDN](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context)

### BFC 特性

- 同一个 BFC 内的元素 `上下 margin` 会发生重叠
- BFC 元素会计算子浮动元素的高度
- BFC 元素不会被兄弟浮动元素覆盖

对于特性 1，可以把 margin 重叠的元素分别放入不同的 BFC 下即可  
利用特性 2，可以清除浮动  
利用特性 3，可以做自适应两栏布局

