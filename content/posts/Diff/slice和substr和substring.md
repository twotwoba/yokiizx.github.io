---
title: 'slice | substr | substring'
date: 2022-09-18T11:59:40+08:00
tags: [diff, JavaScript]
---

这个是常用的三个字符串的截取方法，经常搞混，记录一下。

1. 都有两个参数，只不过不太一样的是 `substr` 截取的是长度，其他是索引

   - `slice(start,end)`[^1]
   - `substr(start,len)`
   - `substring(start,end)`
     > 注意索引都是左闭右开的：`[start, end)`

2. 对于负值的处理不同
   - slice 把所有的*负值加上长度转为正常的索引*，且只能从前往后截取  
     (`start > end`则返回空串)
   - substring 负值全部转为 `0`，可以做到从后往前截取  
     (`substring(5, -3)` <==> `substring(0, 5)`)
   - substr 第一个参数为负与 slice 处理方式相同,第二个参数为负与 substring 处理方式相同

[^1]: 字符串中有一些和数组共用的方法，类似的还有 indexOf，includes，concat 等
