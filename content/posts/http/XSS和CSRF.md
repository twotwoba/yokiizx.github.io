---
title: 'XSS和CSRF'
date: 2022-10-06T23:29:05+08:00
tags: [http, browser]
---

XSS 和 CSRF 问题是很基础、传统的安全问题，本文不做安全拓展，仅学习这两个知识点，对安全感兴趣的大佬，各种“帽子”书看起来 😄。

专业的话术请见参考，我个人喜欢用土话，起码我自己能理解的话来学习这两个知识点。

## XSS - Cross Site Script

顾名思义，跨站脚本攻击。  
说白了 --- 就是想方设法把恶意脚本搞到你的网页上，脚本执行后获取敏感信息，如 cookie，session id 等。

### XSS 分类

- 存储型：攻击者通过发帖，评论等方式把恶意代码提交到数据库中，用户打开网站后恶意代码从数据库中取出并拼接到 HTML 中返回，浏览器接收后执行执行。
- 反射型：攻击者构造包含恶意代码的 url，用户打开后(发起请求或跳转页面)，把恶意代码从 url 中取出并拼接到 HTML 中返回，浏览器接收后执行。
  ```js
  // 比如:
  http://xxx/search?keyword="><script>alert('XSS');</script>
  http://xxx/?redirect=%20javascript:alert('XSS')
  ```
- DOM 型：攻击者构造包含恶意代码的 url，用户打开后，浏览器直接解析恶意代码，发起攻击。比如直接使用 `document.write()`、`.innerHTML` 这种不安全的 api。

前两个属于服务端的安全漏洞，往往也是服务端渲染，DOM 型属于纯前端的安全漏洞，即取出和执行恶意代码都是由浏览器端完成。

### XSS 预防

对症下药：

- 存储型和反射型的 XSS
  1. 如果不需要 SEO 的网站，完全可以做前后端分离
  2. 如果需要 SEO，那么还是服务端渲染，就需要对 HTML 进行转义
- DOM 型 XSS
  1. 在使用 `.innerHTML`、`.outerHTML`、`document.write()` 时要特别小心，不要把不可信的数据作为 HTML 插到页面上，而应尽量使用 `.textContent`、`.setAttribute() `等
  2. vue/react 不 v-html/dangerouslySetInnerHTML，使用替代方案

其他预防措施：

- HTTP 头：`Set-Cookie: HttpOnly`，禁止脚本读取敏感 cookie
- 验证码，防止脚本冒充用户提交危险操作
- HTTP 头/meta: `Content-Security-Policy: [policy]`，具体 policy 见 [MDN CSP](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Security-Policy#%E8%A7%84%E8%8C%83)

  ```http
  Content-Security-Policy: connect-src http://yokiizx.site/;
                         script-src http://yokiizx.site/
  ```

## CSRF - Cross Site Request Forgery

顾名思义，跨站请求伪造（学好英语的重要性 👻）。  
说白了 --- 就是在**登录后**，被诱导去第三方网站，在第三方网站中向被攻击网站发起跨站请求。这个攻击请求会携带被攻击网站的 cookie，绕过用户验证，冒充用户进行一系列危险操作。

常见于各种垃圾邮件中 --- [真实事件](https://www.davidairey.com/google-gmail-security-hijack/)

### CSRF 分类

- GET 请求
  ```html
  <!-- 仅是举例, 实际上用get进行非幂等操作已经是违规的 -->
  <img src=http://www.bank.com/withdraw?account=yokiizx&money=1000&for=hacker>
  ```
- POST 请求

  ```html
  <form action="http://bank.example/withdraw" method="POST">
    <input type="hidden" name="account" value="xiaoming" />
    <input type="hidden" name="amount" value="10000" />
    <input type="hidden" name="for" value="hacker" />
  </form>
  <script>
    document.forms[0].submit()
  </script>
  ```

- 诱导操作类，这类往往需要用户操作后才会触发，比如点击个链接或者

  ```html
  <a href="http://test.com/csrf/withdraw.php?amount=1000&for=hacker" taget="_blank">重磅消息！！</a>
  ```

- 脚本类
  ```html
  <html>
    <head>
      <script type="text/javascript">
        function steal() {
          iframe = document.frames['steal']
          iframe.document.Submit('transfer')
        }
      </script>
    </head>
    　　
    <body onload="steal()">
      <iframe name="steal" display="none">
        <form method="POST" name="transfer" 　action="http://www.myBank.com/Transfer.php">
          <input type="hidden" name="toBankId" value="11" />
          <input type="hidden" name="money" value="1000" />
        </form>
      </iframe>
    </body>
  </html>
  ```

### CSRF 预防

CSRF 通常从第三方网站发起，被攻击的网站无法防止攻击发生，只能通过增强自己网站针对 CSRF 的防护能力来提升安全性。

- CSRF（通常）发生在第三方域名
- CSRF 攻击者不能获取到 Cookie 等信息，**只是使用**

对症下药：

- 阻止不明外域的访问
  - 同源检测
    1. `origin` 和 `referer` 这两个请求头一般会自动带上，且不能由前端自定义内容，服务端可以解析这两个 header 中的域名，来确定请求的来源域。
    2. `origin` 不会包含在 IE 11 的 CORS 请求 和 302 重定向请求中
    3. `referer` 见 [MDN Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy)
       ```html
       <!-- Referrer-Policy: same-origin 或 html: -->
       <meta name="referrer" content="origin" />
       ```
  - SameSite Cookie
    ```http
    Set-Cookie: CookieName=CookieValue; SameSite=Strict|Lax|None;
    ```
- 提交时要求附加本域才能获取的信息
  - CSRF Token，由于 cookie 能被冒用，使用 token 来进行身份认证
  - 双重 Cookie 验证

## 参考

- [如何防止 XSS 攻击？](https://tech.meituan.com/2018/09/27/fe-security.html)
- [如何防止 CSRF 攻击？](https://tech.meituan.com/2018/10/11/fe-security-csrf.html)
- [Cookie 的 SameSite 属性](https://www.ruanyifeng.com/blog/2019/09/cookie-samesite.html)
