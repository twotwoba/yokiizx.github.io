# 页面生命周期


## 生命周期事件

- DOMContentLoaded，完全加载 HTML，但 img、style 等`外部资源`还未完成
- load，把 img、style 等外部资源也加载完成
- beforeunload，正在离开
- unload，几乎已经离开，常用来处理不涉及延迟的操作，比如发送分析数据

注意：

1. DOMContentLoaded 是 document 上的事件，其他三个是 window 上的事件
2. DOMContentLoaded 只能用 DOM2 事件`addEventListener`来监听
3. DOMContentLoaded 必须在脚本执行完成后再执行（具有`async`和`document.createElement('script')`动态创建的脚本不会阻塞）

---

发送分析数据：

```js
// 以 post 请求方式发送
// 数据大小限制在 64kb
// 一般是一个字符序列化对象
const analyticsData = { /* 带有收集的数据的对象 */ };
window.addEventListener("unload", function() {
  navigator.sendBeacon("/analytics", JSON.stringify(analyticsData));
})
```

