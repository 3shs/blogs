---
title: http&https
---

## 1. HTTP

HTTP: 超文本传输协议 是实现网络通信的一种规范

`HTTP`是一个传输协议 即将数据由A传到B或将B传输到A 并且A与B之间能够存放很多第三方 如：A<=>X<=>Y<=>Z<=>B

## 2. HTTPS

## 3. 常见的请求头

#### 1. 通用信息 General

| 键 | 作用 | 参数 |
| :----: | :----: | :----: |
| Request URL | 请求url地址 | http://localhost:8088/api/login |
| Request Method | 请求方法 | POST |
| Status Code | 状态码 | 200 |
| Remote Address | 请求的源地址 | 127.0.0.1:8088 |
| Referrer Policy | 用来监管哪些访问来源信息——会在 Referer 中发送——应该被包含在生成的请求当中 | strict-origin-when-cross-origin |

#### 2. 请求头

| 请求头 | 作用 | 参数 |
| :----: | :----: | :----: |
| Accept | 指定客户端能够接收的内容类型，内容类型中的先后次序表示客户端接收的先后次序 | application/json, text/plain, `*/*` |
| Accept-Encoding | 指定客户端浏览器可以支持的web服务器返回内容压缩编码类型 | gzip, deflate, br |
| Accept-Language | 指定HTTP客户端浏览器用来展示返回信息所优先选择的语言 | zh-CN,zh;q=0.9 |
| Connection |  表示是否需要持久连接 | keep-alive 长连接 |
| Connec-Length |  请求头的长度 | 86 |
| Connect-Typ | 显示此HTTP请求提交的内容类型 一般只有post提交时才需要设置该属性 | application/json;charset=UTF-8 |
| cookie | 浏览器端cookie |
| Hose | 客户端地址 |
| Origin | 目标地址 |
| Referer | 包含一个URL，用户从该URL代表的页面出发访问当前请求的页面 |
| User-Agent | 客户端信息 |
| x－Requested-With | 是否为同步请求 ，如果为XMLHttpRequest，则为 Ajax 异步请求。如果为null则为传统同步请求 |


## 4. 常见的响应头

| 响应头 | 作用 | 参数 |
| :----: |    :----: |  :----: |
| Accept-Ranges | 表明服务器是否支持指定范围请求及哪种类型的分段请求 | Accept-Ranges: bytes |
| Age | 从原始服务器到代理缓存形成的估算时间（以秒计，非负） | Age: 12 |
| Allow | 对某网络资源的有效的请求行为，不允许则返回405 | Allow: GET, HEAD |
| Cache-Control | 告诉所有的缓存机制是否可以缓存及哪种类型 | Cache-Control: no-cache |
| Content-Encoding | web服务器支持的返回内容压缩编码类型 | Content-Encoding: gzip |
| Content-Language | 响应体的语言 | Content-Language: en,zh |
| Content-Length | 响应体的长度 | Content-Length: 348 |
| Content-Location | 请求资源可替代的备用的另一地址 | Content-Location: /index.htm |
| Content-MD5 | 返回资源的MD5校验值 | Content-MD5: Q2hlY2sgSW50ZWdyaXR5IQ== |
| Content-Range | 在整个返回体中本部分的字节位置 | Content-Range: bytes 21010-47021/47022 |
| Content-Type | 返回内容的MIME类型 | Content-Type: text/html; charset=utf-8 |
| Date | 原始服务器消息发出的时间 | Date: Tue, 15 Nov 2010 08:12:31 GMT |
| ETag | 请求变量的实体标签的当前值 | ETag: "737060cd8c284d8af7ad3082f209582d" |
| Expires | 响应过期的日期和时间 | Expires: Thu, 01 Dec 2010 16:00:00 GMT |
| Last-Modified | 请求资源的最后修改时间 | Last-Modified: Tue, 15 Nov 2010 12:45:26 GMT |
| Location | 用来重定向接收方到非请求URL的位置来完成请求或标识新的资源 | Location: http://www.zcmhi.com/archives/94.html |
| Pragma | 包括实现特定的指令，它可应用到响应链上的任何接收方 | Pragma: no-cache |
| Proxy-Authenticate | 它指出认证方案和可应用到代理的该URL上的参数 | Proxy-Authenticate: Basic |
| refresh | 应用于重定向或一个新的资源被创造，在5秒之后重定向（由网景提出，被大部分浏览器支持）| Refresh: 5; url= |
| Retry-After | 如果实体暂时不可取，通知客户端在指定时间之后再次尝试 | Retry-After: 120 |
| Server | web服务器软件名称 | Server: Apache/1.3.27 (Unix) (Red-Hat/Linux) |
| Set-Cookie | 设置Http Cookie | Set-Cookie: UserID=JohnDoe; Max-Age=3600; Version=1 |
| Trailer | 指出头域在分块传输编码的尾部存在 | Trailer: Max-Forwards |
| Transfer-Encoding | 文件传输编码 | Transfer-Encoding:chunked Vary |
| Via | 告知代理客户端响应是通过哪里发送的 | Via: 1.0 fred, 1.1 nowhere.com (Apache/1.1) |
| Warning | 警告实体可能存在的问题 | Warning: 199 Miscellaneous warning |
| WWW-Authenticate | 表明客户端请求实体应该使用的授权方案 | WWW-Authenticate: Basic |