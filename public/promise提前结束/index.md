# Promise提前结束


常见的需求是，当点击一个按钮时，连续点击多次，就会触发多次请求，我们可以通过防抖来解决，也可以通过取消相同的重复请求来实现。

axios 已经有了取消请求的功能：

```js {open=false, lineNos=false, wrap=true, header=true, title="已废弃"}
const CancelToken = axios.CancelToken
let cancel

axios.get('/demo', {
    cancelToken: new CancelToken(c => {
        cancel = c
    })
})

cancel() // 取消这个请求

/* ---------- 或者 ---------- */
const CancelToken = axios.CancelToken
const source = CancelToken.source()

axios
    .get('/user/12345', {
        cancelToken: source.token
    })
    .catch(function (thrown) {
        if (axios.isCancel(thrown)) {
            console.log('Request canceled', thrown.message)
        } else {
            // 处理错误
        }
    })

axios.post(
    '/user/12345',
    {
        name: 'new name'
    },
    {
        cancelToken: source.token
    }
)

// 取消请求（message 参数是可选的）
source.cancel('Operation canceled by the user.')
```

上方的 CancelToken 从 v0.22.0 版本被废弃，最新的 axios 使用的是与 fetch 一样的 api `AbortController`:

```js {open=true, lineNos=false, wrap=true, header=true, title=""}
const controller = new AbortController()

axios
    .get('/foo/bar', {
        signal: controller.signal
    })
    .then(function (response) {
        //...
    })
// 取消请求
controller.abort()
```

还是那句话，我们主要学习思想嘛，针对一个 promise，怎么做到"中断" promise 的执行呢？一起来看看。

首先我在"中断"上打了引号，因为 promise 一旦创建是无法取消的，所谓的”中断“，只是在合适的时候，提前结束 pending 状态而已，所以本文题目才是提前结束而不是“中断”。

```js {open=true, lineNos=false, wrap=true, header=true, title=""}
const mockReq = function (time) {
    const req = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(time)
        }, time)
    })
    let abort = null
    const stopHandler = new Promise((resolve, reject) => {
        abort = reject
    })
    const p = Promise.race([req, stopHandler])
    p.abort = abort
    return p
}

mockReq(2000).then(res => console.log(res))
mockReq().abort()
```

其实核心就是借助另一个永远不会成功或失败的 promise 的 execute 函数，来让人可以手动改变 handle 的状态，进而影响 `Promise.race` 的执行。值得注意的是，req 仍然会执行完成，但是已经无意义了。

promise 超时控制原理一样，把一个设定超时时间的 promise 和正常的请求放到 Promise.race()中即可。

## 参考

-   [axios 文档-取消请求](https://www.axios-http.cn/docs/cancellation)

