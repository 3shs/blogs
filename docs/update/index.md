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

## 3. Diff算法

从上诉代码可以看出 对于子节点的更新主要调用的时 `updatechildren` 方法 这个方法主要的作用就是通过 `Diff` 算法来进行 `patchVnode`

基本逻辑是通过两边向中间的循环方式找到相同的 `oldVnode` 和 `vnode` 利用 `patchVnode` 方法来对 `oldVnode` 进行更新 也就是对页面进行更新

* 定义 `oldCh` 开始的下标 `oldStartIdx` 和 `newCh` 开始的下标 `newStartIdx`

* 定义 `oldCh` 结束的下标 `oldEndIdx` 和 `oldCh` 开始的元素 `oldStartVnode` 和 `oldCh` 结束的元素 `oldEndVnode`

* 定义 `newCh` 结束的下标 `newEndIdx` 和 `newCh` 开始的元素 `newStartVnode` 和 `newCh` 结束的元素 `newEndVnode`

* 首先从起始位置开始对比 如果 `oldStartVnode` 和 `newStartVnode` 相同 则调用 `patchVnode` 方法完成对DOM的更新 然后将 `oldStartIdx` 和 `newStartIdx` 增加一位 利用增加一位的 `oldStartIdx` 和 `newStartIdx` 得到新的 `oldStartVnode` 和 `newStartVnode` 然后重新走入循环

* 如果起始位置不同 则从末尾进行对比 如果 `oldEndVnode` 和 `newEndVnode` 相同 则同样调用 `patchVnode` 方法完成对DOM的更新 然后 `oldEndIdx` 和 `newEndIdx` 减去一位 利用减去一位的 `oldEndIdx` 和 `newEndIdx` 得到新的 `oldEndVnode` 和 `newEndVnode` 然后重新走入循环

* 如果起始位置和末尾位置都不相同的话 则用 `oldStartVnode` 和 `newEndVnode` 进行对比 如果相同的话 就说明节点元素进行了移动 旧节点的这个元素已经移动到了右边 同样 先调用 `patchVnode` 方法完成对DOM的更新 然后获取 `oldEndVnode` 的下个兄弟元素作为参照 插入到这个参照元素之前 然后将 `oldStartIdx` 增加一位 `newEndIdx` 减去一位 因为这是旧节点的起始元素和新节点的结束元素做对比 所以一个向后 一个向前 同样利用更新过后的 `oldStartIdx` 和 `newEndIdx` 得到新的 `oldStartVnode` 和 `newEndVnode` 然后重新走入循环

* 如果旧节点的起始位置和新节点的结束位置也不相同的话 则用旧节点结束位置和新节点开始位置进行对比 即 `oldEndVnode` 和 `newStartVnode` 进行对比 如果相同的话 就说明节点进行了移动 旧节点这个元素已经移动到了左边 同样 先调用 `patchVnode` 方法完成对DOM的更新 然后 将这个元素插入到 旧节点起始位置之前 也就是 `oldStartVnode` 之前 然后将 `oldEndIdx` 减去一位 `newStartIdx` 增加一位 同样 利用更新过后的 `oldEndIdx` 和 `newStartIdx` 得到新的 `oldEndVnode` 和 `newStartVnode` 然后重新走入循环

* 如果以上对比方式都没找到

  * 首先判断 `oldKeyToIdx` 是否有值 如果没值 利用 `createKeyToOldIdx` 方法 这个方法主要是循环还未进行对比的 `oldCh` 得到一个 剩下未进行对比的 `oldCh` 以它们每个 `key` 为属性 `i` 也就是下标为值 的这样一个 `map` 对象

  * 然后就从 `newStartVnode` 开始对比 首先判断 `newStartVnode` 是否有 `key` 值 如果有 就利用这个 `key` 值 找到 它所对应在 `oldCh` 上面的位置 也就是利用之前的 `map` 找到对应 在 `oldCh` 上的下标 赋值给 `idxInOld` 如果没有 `key` 值 则利用 `findIdxInOld` 方法 循环未处理的 `oldStartIdx` 到 `oldEndIdx` 的下标 判断 `oldCh` 哪个元素 和 `newStartVnode` 相同 如果相同 返回 对应的 下标 赋值给 `idxInOld`

  * 如果 `idxInOld` 不存在 说明这个元素之前的 `oldCh` 没有 说明是新元素 则直接调用 `createElm` 方法 创建Dom 然后插入 `oldStartVnode` 之前

  * 如果存在 利用刚才找到的下标 `idxInOld` 找到对应的 `vnode` 赋值给 `vnodeToMove` 判断 `vnodeToMove` 和 `newStartVnode` 是否相同 如果相同 则同样调用 `patchVnode` 方法完成对DOM的更新 然后将 `oldCh` 原来对应位置的元素 赋值为 undefined 最后将 `vnodeToMove` 这个元素 插入到 `oldStartVnode` 之前

    * 如果这两个元素不相同 就将 `newStartVnode` 这个 vnode 作为新元素 直接调用 `createElm` 方法 创建Dom 然后插入 `oldStartVnode` 之前

  * 最后将 `newStartIdx` 增加一位 得到 新的  `newStartVnode` 然后重新走入循环

  * > 这里有个问题 就是为啥都是 插入到 `oldStartVnode` 之前 走到这的逻辑就是利用 更新过后的 `newStartVnode` 在 `oldCh` 剩余未处理里面去寻找 对于这种情况只需要将这些元素依次的插入到 `oldCh` 那个未处理元素之前就可以了 因为是从 `newStartVnode` 开始 所以 未处理之前 就是 `oldStartVnode` 之前

* 如果 `oldStartIdx > oldEndIdx` 说明 `oldCh` 比 `newCh` 先循环完了 说明 `newCh` 剩下的 vnode 都是要新增的

* 如果 `newStartIdx > newEndIdx` 说明 `newCh` 比 `oldCh` 先循环完了 说明 `oldCh` 剩下的 vnode 都是要移除的




```javascript
function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
  var oldStartIdx = 0;
  var newStartIdx = 0;
  var oldEndIdx = oldCh.length - 1;
  var oldStartVnode = oldCh[0];
  var oldEndVnode = oldCh[oldEndIdx];
  var newEndIdx = newCh.length - 1;
  var newStartVnode = newCh[0];
  var newEndVnode = newCh[newEndIdx];
  var oldKeyToIdx, idxInOld, vnodeToMove, refElm;

  // removeOnly is a special flag used only by <transition-group>
  // to ensure removed elements stay in correct relative positions
  // during leaving transitions
  var canMove = !removeOnly;

  {
    checkDuplicateKeys(newCh);
  }

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (isUndef(oldStartVnode)) {
      oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
    } else if (isUndef(oldEndVnode)) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
      canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
      canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      if (isUndef(oldKeyToIdx)) { oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx); }
      idxInOld = isDef(newStartVnode.key)
        ? oldKeyToIdx[newStartVnode.key]
        : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
      if (isUndef(idxInOld)) { // New element
        createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
      } else {
        vnodeToMove = oldCh[idxInOld];
        if (sameVnode(vnodeToMove, newStartVnode)) {
          patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
          oldCh[idxInOld] = undefined;
          canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
        } else {
          // same key but different element. treat as new element
          createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
        }
      }
      newStartVnode = newCh[++newStartIdx];
    }
  }
  if (oldStartIdx > oldEndIdx) {
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
    addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
  } else if (newStartIdx > newEndIdx) {
    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
  }
}




function createKeyToOldIdx (children, beginIdx, endIdx) {
  var i, key;
  var map = {};
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key;
    if (isDef(key)) { map[key] = i; }
  }
  return map
}




function findIdxInOld (node, oldCh, start, end) {
  for (var i = start; i < end; i++) {
    var c = oldCh[i];
    if (isDef(c) && sameVnode(node, c)) { return i }
  }
}
```
