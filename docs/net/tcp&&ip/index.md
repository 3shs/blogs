---
title: tcp/ip
---

## 1. 什么是TCP/IP

`TPC/IP`（Transmission Control Protocol/Internet Protocol）传输控制协议/网际协议 是构成互联网的基础通信协议

特点如下：
`TCP/IP` 协议包含四层网络结构 从低层到高层包括

#### 1. 链路层
- 定义物理传输传输介质和格式的规范 如Ethernet（以太网）
- 通过MAC地址识别主机 完成帧的封装和解封装

#### 2. 网络层
- 主要是IP协议 提供数据报服务 完成分组和路由选择
- IP地址用于逻辑地址 ARP协议用于IP地址和MAC地址的映射

#### 3. 传输层
- 提供面向主机的端到端连接服务
- TCP提供可靠连接服务 UDP提供非连接不可靠服务

#### 4. 应用层
- 为用户提供网络应用服务 完成进程通信
- 包含各种网络应用协议 如`HTTP` `FTP` `DNS` 等等

## 2. 总结

每层都有自己的功能 协同工作以实现网络通信 这就是 `TCP/IP` 的四层网络模型
