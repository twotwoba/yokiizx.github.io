# CORS及其他跨域方案


## 前言

同源策略(same origin policy)是由网景公司提出的最基础的安全策略。同源，就是*协议，域名和端口*。其中任意一个不同，就会产生跨域问题。

## CORS

`CORS` 是 W3C 标准，的全名是 `Cross-Origin Resource Sharing`，即跨域资源共享机制，满足可以跨域请求资源，是平时最常用的解决跨域问题的方案。

浏览器会自动向 HTTP header 添加一个额外的请求头字段：Origin。Origin 标记了请求的站点来源：

```http
GET https://api.target.com/demo HTTP/1.1
Origin: https://www.source.com // <- 浏览器自己加的
```

为了使浏览器允许访问跨域资源，服务器返回的 response 还需要加一些响应头字段，这些字段将显式表明此服务器是否允许这个跨域请求。

- Access-Control-Allow-Origin 必须的，指定可访问的源 (带 cookie 的请求不支持\*号)
- Access-Control-Allow-Methods
- Access-Control-Allow-Headers
- Access-Control-Allow-Credentials 带上 cookie，ajax/axios 也要配置 `withCredential`
- Access-Control-Expose-Headers 暴露更多可获取的响应头
- Access-Control-Max-Age 指定预检请求有效期

### 处理机制

CORS 把请求分为了两种，简单请求和非简单请求，其中非简单请求需要先发起一次 OPTIONS 预检请求。

简单请求：

1. GET/HEAD/POST 三者之一
2. 请求头不超出以下几个字段
   - Accept
   - Accept-Language
   - Last-Event-ID
   - Content-Language
   - Content-Type：application/x-www-form-urlencoded、multipart/form-data、text/plain 三者之一

发起简单请求时，自动带上 origin，服务器返回数据，并返回检查结果，配置 CORS 响应头，浏览器对响应头进行检查，包含则放行，否则拦截。

非简单请求：

先发起一次 options 预检请求，过程与简单请求一致，响应头没有通过检查就不会发起真正的请求。

只对非简单请求做预检是因为，此类请求往往会对服务器产生副作用。

### 为什么请求要带上 origin

主要是因为 CORS 给开发带来了便利，同时也带来了安全隐患——CSRF 攻击。
![](https://cdn.jsdelivr.net/gh/yokiizx/picgo@main/img/202210280002617.png)
如果严格按照同源政策，第 2 步的跨域请求不能进行的，也就不会造成危害。所以 CORS 策略的心智模型是：所有跨域请求都是不安全的，浏览器要带上来源给服务器检验。

### html 标签的 cors 配置

script 标签 有一个 crossorigin 属性，就是用来进行 CORS 的配置的。
CORS 有三种值：

- anonymous
- use-credentials，需要设置请求凭证 cookie。
- ""，就是在标签中直接使用 crossorigin，与 anonymous 效果一样

html 标签中 有些是自带跨域的，img，link，script 等，但是当添加了 crossorigin 后，浏览器就不能使用自带的跨域去请求资源了，而是使用 CORS，那就需要服务器设置跨域了。

PS：script 加载的外部脚本内发生错误时，浏览器上 onerror 事件是捕获不到具体错误信息的 ，只会捕获到 Script error 错误，添加上 crossorigin 就可以看见了，不过前提是目标源要支持 CORS 哦。

## jsonp

利用 script 自带跨域的功能，动态创建 script 标签，指定 src 为目标跨域 url，在 url 中指定回调函数，当请求返回时，就会执行这个回调，从而实现跨域请求，所以这个方法只支持 GET 请求。

## 配置 nginx

配置 `nginx` 代理跨域，也是常用的方法，实质和 CORS 跨域原理一样，通过配置文件设置请求响应头 `Access-Control-Allow-Origin` 等字段。。

1. 解决字体跨域  
   浏览器跨域访问 js、css、img 等常规静态资源被同源策略许可，但 iconfont 字体文件(eot|otf|ttf|woff|svg)例外，此时可在 nginx 的静态资源服务器中加入以下配置。

```nginx
location / {
  add_header Access-Control-Allow-Origin *;
}
```

2. 反向代理

反向代理，代理服务器。

```nginx
# proxy服务器
server {
    listen       80;
    server_name  www.target.com;

    location / {
        proxy_pass   http://www.turntoweb.com:8080;  # 反向代理 目标服务器
        proxy_cookie_domain www.turntoweb.com www.target.com; # 修改cookie里域名
        index  index.html index.htm;

        # 当用webpack-dev-server等中间件代理接口访问nignx时，此时无浏览器参与，故没有同源限制，下面的跨域配置可不启用
        #当前端只跨域不带cookie时，可为*
        add_header Access-Control-Allow-Origin http://www.target.com;
        add_header Access-Control-Allow-Credentials true;
    }
}
```

以上是常用的跨域方法，还有其他的方案见文末的参考。

## 参考

- [跨域资源共享 CORS 详解](https://www.ruanyifeng.com/blog/2016/04/cors.html)
- [http 演进之路四](https://zhuanlan.zhihu.com/p/50979016)
- [CORS 为什么能保障安全？为什么只对复杂请求做预检？](https://mp.weixin.qq.com/s/W38vyzlqRtUysjguHeqiNQ)
- [9 种常见的前端跨域解决方案](https://juejin.cn/post/6844903882083024910)

