---
title: 'getElementBy* | querySelector*'
date: 2022-09-18T15:36:06+08:00
tags: [diff, BOM]
---

DOM 查询的方式比较，目前推荐使用 querySelector。

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/20220918153426.png)

##### 性质不同

- getElementsBy\* 是动态的， 类似于引用类型，若之后 dom 发生了改变，则已获取到的 dom 也会相应改变
- querySelectorAll 是静态的，类似于快照的意思，获取后就不会再变了

```html
<div class="demo">First div</div>

<script>
  let divs1 = document.getElementsByTagName('div')
  let divs2 = document.querySelectorAll('div')
  console.info(divs1.length) // 1
  console.info(divs2.length) // 1
</script>

<div class="demo">Second div</div>

<script>
  console.info(divs1.length) // 2
  console.info(divs2.length) // 1

  console.log(document.getElementsByClassName('demo'))
  console.log(document.querySelectorAll('.demo'))
</script>
```

##### 返回值不同

- getElementsBy\* 返回的是 HTMLCollection
- querySelectorAll 返回值是 NodeList

![](https://cdn.staticaly.com/gh/yokiizx/picgo@master/img/20220918155922.png)

> HTMLCollection 比 NodeList 多了个 `namedItem(name)` 方法，根据 name 属性获取 dom
> NodeList 相比 HTMLCollection 多了更多的信息，比如注释，文本等

##### 参考

- [现代 JavaScript 教程](https://zh.javascript.info/document)
