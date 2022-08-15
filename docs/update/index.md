---
title: 更新阶段
---

## 1. 前言

Vue对页面的更新 是通过 `patch` 的方式来完成的 就是通过 `Diff` 算法来找出不同 然后进行更新

## 2. patchVnode

根据前文的分析 在更新阶段主要是调用 `patchVnode` 方法来完成补丁更新

* 如果 `oldVnode` 和 `vnode` 两个完全相同 这不需要更新 直接退出

* 如果 `oldVnode`　和 `vnode` 都是静态节点 则 return

* 判断 `vnode` 是否有 `text` 属性 如果没有 则说明是元素节点

  * 如果 `oldVnode` 和 `vnode` 都有子节点 则直接 调用 `updateChildren` 方法去更新子节点（Diff）算法

  * 如果只有 `vnode` 中有子节点 判断 `oldVnode` 里面是否有文本 如果有则清空并且将 `vnode` 的子节点直接添加到DOM中 如果没有 则直接 将 `vnode` 的子节点直接添加到DOM中

  * 如果只有 `oldVnode` 中有子节点 则清空 DOM 中的子节点

  * 如果 `oldVnode` 和 `vnode` 的 都没有子节点 判断如果 `oldVnode` 中有 文本 则清空 `oldVnode` 中的文本

* 如果 `vnode` 有 `text` 属性 判断 `oldVnode` 和 `vnode` 的 `text` 是否一样 如果不一定 就用 `vnode` 的text 替换真实DOM中的文本

```javascript
function patchVnode (
  oldVnode,
  vnode,
  insertedVnodeQueue,
  ownerArray,
  index,
  removeOnly
) {
  // 如果旧的和新的完全相同 则直接退出
  if (oldVnode === vnode) {
    return
  }

  if (isDef(vnode.elm) && isDef(ownerArray)) {
    // clone reused vnode
    vnode = ownerArray[index] = cloneVNode(vnode);
  }

  var elm = vnode.elm = oldVnode.elm;

  if (isTrue(oldVnode.isAsyncPlaceholder)) {
    if (isDef(vnode.asyncFactory.resolved)) {
      hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
    } else {
      vnode.isAsyncPlaceholder = true;
    }
    return
  }

  // reuse element for static trees.
  // note we only do this if the vnode is cloned -
  // if the new node is not cloned it means the render functions have been
  // reset by the hot-reload-api and we need to do a proper re-render.
  
  // 如果新旧都是静态节点 则直接退出
  // 静态节点就是 类似于 <p>我是静态节点</p> 没有任何变量的节点
  if (isTrue(vnode.isStatic) &&
    isTrue(oldVnode.isStatic) &&
    vnode.key === oldVnode.key &&
    (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
  ) {
    vnode.componentInstance = oldVnode.componentInstance;
    return
  }

  // 这里是处理组件的 patch
  var i;
  var data = vnode.data;
  if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
    i(oldVnode, vnode);
  }

  // 拿到 oldVnode 上的 children
  // 拿到 vnode 上的 children
  var oldCh = oldVnode.children;
  var ch = vnode.children;
  
  if (isDef(data) && isPatchable(vnode)) {
    // 这个和之前第一次渲染的时候 invokeCreateHooks 作用一样
    for (i = 0; i < cbs.update.length; ++i) { cbs.update[i](oldVnode, vnode); }
    // 这个是处理组件的方法
    if (isDef(i = data.hook) && isDef(i = i.update)) { i(oldVnode, vnode); }
  }
  // vnode 有 text 属性？ 如没有 就说明是元素节点
  if (isUndef(vnode.text)) {
    // 判断 oldVnode 和 vnode 是否同时存在
    if (isDef(oldCh) && isDef(ch)) {
      // 若两个不相同 则进行 更新
      if (oldCh !== ch) { updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly); }
    } else if (isDef(ch)) {
      // 若 只有 vnode 的 子节点存在
      {
        checkDuplicateKeys(ch);
      }
      // 判断 oldVnode 是否有文本
      // 如果有 则清空 DOM 中的文本 再把 vnode 的子节点添加到真实的 DOM 中
      // 如果没有 直接把 vnode 的子节点 添加到 DOM 中
      if (isDef(oldVnode.text)) { nodeOps.setTextContent(elm, ''); }
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
    } else if (isDef(oldCh)) {
      // 如果只有 oldVnode 的子节点存在
      // 则清空 DOM 中的子节点
      removeVnodes(elm, oldCh, 0, oldCh.length - 1);
    } else if (isDef(oldVnode.text)) {
      // 如果 oldVnode 和 vnode 的 都没有子节点
      // 但是 oldVnode 中有文本
      // 则清空 oldVnode 中的文本
      nodeOps.setTextContent(elm, '');
    }
  } else if (oldVnode.text !== vnode.text) {
    // 如果 vnode 有 text 属性 则判断是否和 oldVnode text相同
    // 不同则用 vnode 的 text 替换真实 DOM 中的文本
    nodeOps.setTextContent(elm, vnode.text);
  }
  // 处理组件
  if (isDef(data)) {
    if (isDef(i = data.hook) && isDef(i = i.postpatch)) { i(oldVnode, vnode); }
  }
}
```

