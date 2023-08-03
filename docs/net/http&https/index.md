---
title: http&https
---

## 1. HTTP

`HTTP`: 超文本传输协议 是实现网络通信的一种规范

`HTTP`是一个传输协议 即将数据由A传到B或将B传输到A 并且A与B之间能够存放很多第三方 如：A<=>X<=>Y<=>Z<=>B

传输的数据并不是计算机底层的二进制包 而是完整的 有意义的数据 如 HTML 图片文件 查询结果等超文本 能够被上层应用识别

在实际应用中 `HTTP` 常被运用于在 `Web` 浏览器和网站服务器之间传递信息 以明文方式发送内容 不提供任何方式的数据加密

特点如下：

1. 支持客户端/服务端模式
2. 简单快速：客户向服务器端请求服务时 只需传送请求方式和路径 由于`HTTP`协议简单 使得`HTTP`服务器的程序规模小 因而通信速度很快
3. 灵活：`HTTP`允许传输任意类型的数据对象 正在传输的类型由`Content-Type`加以标记
4. 无连接：无连接的含义是限制每次连接只处理一个请求 服务器处理完客户的请求 并收到客户应答后 即断开连接 采用这种方式可以节省传输时间
5. 无状态：`HTTP`协议无法根据之前的状态进行本次请求处理

## 2. HTTPS

因为 `http` 是以明文的方式发送内容 并不安全 为了解决这个不安全问题 出现了 `https`

`https` 即让 `http` 运行在安全的 `SSL/TLS` 协议上 即 `HTTPS = HTTP + SSL/TLS`

`SSL` 协议位于 `TCP/IP` 协议和各种应用层协议之间 浏览器和服务器在使用 `SSL` 建立连接时需要选择一组恰当的加密算法来实现安全通信 为数据通讯提供安全支持

建立 `https` 连接的过程

1. 首先客户端通过URL访问服务器建立SSL连接
2. 服务端收到客户端请求后 会将网站支持的证书信息（证书中包含公钥）传送一份给客户端
3. 客户端和服务器开始协商SSL连接的安全等级 也就是信息加密的等级
4. 客户端的浏览器根据双方同意的安全等级 建立会话密钥 然后利用网站的公钥将会话密钥加密 并传送给网站
5. 服务器利用自己的私钥解密出会话密钥
6. 服务器利用会话密钥加密与客户端之间的通信

> ### 如何协商？
> 1. 客户端发起SSL Handshake(握手)请求
> - 客户端发送一个ClientHello消息给服务器 该消息中包含了客户端支持的SSL版本号、加密算法列表等信息
> 2. 服务器端返回可支持的加密方法
> - 服务器端从客户端提供的信息中选择双方都支持的加密方法 并返回一个ServerHello消息 确认使用的协议版本 随机数 会话ID和加密方法
> 3. 服务器发送证书
> - 服务器将向客户端发送其数字证书 以便客户端验证服务器的身份 数字证书中包含了服务器的公钥
> 4. 客户端验证证书并生成pre-master key
> - 客户端会验证证书的有效性 同时利用服务器的公钥生成pre-master key
> 5. 客户端将pre-master key加密后发送给服务器
> - 客户端使用服务器的公钥将pre-master key 加密 然后发送给服务器
> 6. 服务器解密pre-master key
> - 服务器使用私钥解密得到pre-master key
> 7. 双方使用pre-master key生成会话密钥
> - 客户端和服务器端都可以通过pre-master key和一致的算法生成对称的会话密钥 后续通信将使用该会话密钥和确认的加密方法进行加密通信

## 3. 区别

| 不同点 | HTTP | HTTPS |
| :----: | :----: | :----: |
| 安全 | 明文数据传输 | 使用了SSL/TLS协议进行了加密处理 相对更安全 |
| 端口 | 80 | 443 |
| 性能 | 更高 | 协商加密多次握手不如http | 
| 花费 | 小 | 需要证书 功能越强大证书费用越高 |
| 缓存 | 更好 | 不如 http |

## 4. 常见的请求头

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
| Host | 客户端地址 |
| Origin | 目标地址 |
| Referer | 包含一个URL，用户从该URL代表的页面出发访问当前请求的页面 |
| User-Agent | 客户端信息 |
| x－Requested-With | 是否为同步请求 ，如果为XMLHttpRequest，则为 Ajax 异步请求。如果为null则为传统同步请求 |


## 5. 常见的响应头

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