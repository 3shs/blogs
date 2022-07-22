---
title: 挂载渲染阶段
---

## 1. mounted

在挂载阶段之前 先 `callHook` 一下 `beforeMount` 的函数 然后给 `updateComponent` 赋值 来作为 `Watcher` 的 `getter` 函数

