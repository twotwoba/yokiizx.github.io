---
title: 'Script标签'
date: 2022-09-20T17:07:56+08:00
tags: [HTML]
---

[async vs defer attributes](https://www.growingwiththeweb.com/2014/02/async-vs-defer-attributes.html)

## async 和 defer

一般情况下，脚本`<script>`会阻塞 DOM 的构建，DOM 的构建又影响到 DOMContentLoaded 的触发。
问题：

1. 阻塞页面渲染
2. 获取不到`<script>`下面的 DOM

解决方法就是使用 async 和 defer

> 这两个特性都只针对于外部脚本，不具有 src 的脚本，则这两个特性会被忽略

##### defer

defer 的脚本不会阻塞 DOM 的渲染，总要等待 DOM 解析完成,但是在 DOMContentLoaded 之前完成。

注意：defer 的多个脚本下载完成后会按照文档的先后顺序执行，而不是下载顺序

##### async

与 defer 一样，都不会阻塞 DOM 渲染  
但是 async 意味着完全独立，不会等待也不会让别人等待，加载完成后就立即执行。  
与 DOMContentLoaded 无关，可能在之前，也可能在之后执行。

##### 场景

在实际开发中，defer 用于需要整个 DOM 的脚本，和/或脚本的相对执行顺序很重要的时候。

async 用于独立脚本，例如计数器或广告，这些脚本的相对执行顺序无关紧要。

### 拓展阅读

- [浅谈 script 标签中的 async 和 defer](https://blog.csdn.net/lhjuejiang/article/details/81428226)
- [script 标签中的 crossorigin 属性详解](https://blog.csdn.net/qq_40028324/article/details/107076751)
- [跨域资源共享 CORS 详解](https://www.ruanyifeng.com/blog/2016/04/cors.html)
- [什么是 MIME](https://www.cnblogs.com/jsean/articles/1610265.html)
- [script 新属性 integrity 与 web 安全，再谈 xss](https://www.zhoulujun.cn/html/webfront/ECMAScript/js6/2018_0521_8115.html)
- [link preload](http://eux.baidu.com/blog/fe/link-preload-%E6%A0%87%E7%AD%BE)
