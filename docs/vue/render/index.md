---
title: 挂载渲染阶段
---

## 1. 虚拟DOM

在渲染之前需要了解一下虚拟DOM

1. 虚拟DOM就是用JS一个对象来描述一个DOM节点

```javascript
function VNode(
  tag,
  data,
  children,
  text,
  elm,
  context,
  componentOptions,
  asyncFactory
  )
{
  this.tag = tag; //标签名
  this.data = data; // 标签上的 属性以及值
  this.children = children; // 子元素
  this.text = text; // 文本
  this.elm = elm; // 真实的Dom元素
  this.ns = undefined;
  this.context = context; //当前组件节点对应的vue实例
  this.fnContext = undefined; // 函数式组件对应的vue实例
  this.fnOptions = undefined;
  this.fnScopeId = undefined;
  this.key = data && data.key;
  this.componentOptions = componentOptions;
  this.componentInstance = undefined;
  this.parent = undefined;
  this.raw = false;
  this.isStatic = false;
  this.isRootInsert = true;
  this.isComment = false;
  this.isCloned = false;
  this.isOnce = false;
  this.asyncFactory = asyncFactory;
  this.asyncMeta = undefined;
  this.isAsyncPlaceholder = false;
}
```

2. 为什么用虚拟DOM描述真实DOM 因为操作真实DOM是非常损耗性能的 因为浏览器标准把真实DOM设计的非常复杂和庞大

所以 Vue 有了这套虚拟 DOM 对象 就可以通过不同的搭配来描述不同的节点

### 1.1 注释节点

注释节点相对比较简单 只需要两个属性进行描述 `text=''` `isComment=true` `isComment` 表示是否为注释节点

```javascript
// 创建注释节点
var createEmptyVNode = function (text) {
  if ( text === void 0 ) text = '';

  var node = new VNode();
  node.text = text;
  node.isComment = true;
  return node
};
```

### 1.2 文本节点

文本节点就要更简单一点 只要设置 `text` 值就可以了

```javascript
function createTextVNode (val) {
  return new VNode(undefined, undefined, undefined, String(val))
}
```

### 1.3 克隆节点

克隆节点就是把一个已经存在的节点复制一份出来 是为了做模板编译优化时使用

```javascript
function cloneVNode (vnode) {
  var cloned = new VNode(
    vnode.tag,
    vnode.data,
    // #7975
    // clone children array to avoid mutating original in case of cloning
    // a child.
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  );
  cloned.ns = vnode.ns;
  cloned.isStatic = vnode.isStatic;
  cloned.key = vnode.key;
  cloned.isComment = vnode.isComment;
  cloned.fnContext = vnode.fnContext;
  cloned.fnOptions = vnode.fnOptions;
  cloned.fnScopeId = vnode.fnScopeId;
  cloned.asyncMeta = vnode.asyncMeta;
  cloned.isCloned = true;
  return cloned
}
```

从代码中可以看出 克隆节点就是将已有的节点属性全部复制到新节点中 `cloned` 然后将 `cloned` 的 `isCloned` 属性复制为 `true`

### 1.4 元素节点

元素节点就更接近页面上的真实ODM

```javascript
// 例如 这样的 vnode结构
new Vnode('div', {id: 'app', on: 'handleClick', [vnode,vnode,...]})
```

### 1.5 组件节点

组件节点除了元素节点的属性外 还有两个特有的属性

1. componentOptions: 组件的options `data` `props` `methods` 等
2. componentInstance： 当前组件节点对应的 Vue 实例

### 1.6 函数式组件节点

函数式组件对比组件节点 它又有两个特有的属性

1. fnContext: 函数式组件对应的 Vue 实例
2. fnOptions: 组件的 options 和组件节点的 componentOptions 一样

## 2. mounted

在挂载阶段之前 先 `callHook` 一下 `beforeMount` 的函数 然后给 `updateComponent` 赋值 来作为 `Watcher` 的 `getter` 函数 这个 `getter` 函数主要就是就是用来更新视图的

```javascript
updateComponent = function () {
  vm._update(vm._render(), hydrating)
}
```

然后进入 `new Watcher()` 阶段 经过一系列的初始化 将 `updateComponent` 函数 赋值给 `Watcher` 里的 `getter` 函数

随后看 `Watcher` 里面 `this.lazy` 是否延迟执行 如果为 `false` 直接调用 `this.get` 方法 这个方法里 主要调用的是 `getter` 函数 得到一个 `value` 值 赋值给 `Watcher` 里的 `this.value`

```javascript
var Watcher = function Watcher (
  vm,
  expOrFn,
  cb,
  options,
  isRenderWatcher
) {
  this.vm = vm;
  if (isRenderWatcher) {
    vm._watcher = this;
  }
  vm._watchers.push(this);
  // options
  if (options) {
    this.deep = !!options.deep;
    this.user = !!options.user;
    this.lazy = !!options.lazy;
    this.sync = !!options.sync;
    this.before = options.before;
  } else {
    this.deep = this.user = this.lazy = this.sync = false;
  }
  this.cb = cb;
  this.id = ++uid$2; // uid for batching
  this.active = true;
  this.dirty = this.lazy; // for lazy watchers
  this.deps = [];
  this.newDeps = [];
  this.depIds = new _Set();
  this.newDepIds = new _Set();
  this.expression = expOrFn.toString();
  // parse expression for getter
  if (typeof expOrFn === 'function') {
    this.getter = expOrFn;
  } else {
    this.getter = parsePath(expOrFn);
    if (!this.getter) {
      this.getter = noop;
      warn(
        "Failed watching path: \"" + expOrFn + "\" " +
        'Watcher only accepts simple dot-delimited paths. ' +
        'For full control, use a function instead.',
        vm
      );
    }
  }
  // 是否延迟调用
  this.value = this.lazy
    ? undefined
    : this.get();
};




Watcher.prototype.get = function get () {
  pushTarget(this);
  var value;
  var vm = this.vm;
  try {
    value = this.getter.call(vm, vm);
  } catch (e) {
    if (this.user) {
      handleError(e, vm, ("getter for watcher \"" + (this.expression) + "\""));
    } else {
      throw e
    }
  } finally {
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    this.cleanupDeps();
  }
  return value
};
```

随后首先调用 `updateComponent` 方法里的 `vm._render()` 方法 这个方法最主要的目的就是 调用之前利用模板解析生成的 `render` 函数生成 `vnode` 也就是虚拟DOM

```javascript
Vue.prototype._render = function () {
  var vm = this;
  var ref = vm.$options;
  // 拿到render函数
  var render = ref.render;
  // 拿到 _parentVnode 如果是组件 就有这个属性 就对应的时组件自身 
  // 如果不是组件就没有这个属性 
  var _parentVnode = ref._parentVnode;

  if (_parentVnode) {
    vm.$scopedSlots = normalizeScopedSlots(
      _parentVnode.data.scopedSlots,
      vm.$slots,
      vm.$scopedSlots
    );
  }

  // set parent vnode. this allows render functions to have access
  // to the data on the placeholder node.
  vm.$vnode = _parentVnode;
  // render self
  var vnode;
  try {
    // There's no need to maintain a stack becaues all render fns are called
    // separately from one another. Nested component's render fns are called
    // when parent component is patched.
    currentRenderingInstance = vm;
    // 调用render函数 生成 vnode
    vnode = render.call(vm._renderProxy, vm.$createElement);
  } catch (e) {
    handleError(e, vm, "render");
    // return error render result,
    // or previous vnode to prevent render error causing blank component
    /* istanbul ignore else */
    if (vm.$options.renderError) {
      try {
        vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e);
      } catch (e) {
        handleError(e, vm, "renderError");
        vnode = vm._vnode;
      }
    } else {
      vnode = vm._vnode;
    }
  } finally {
    currentRenderingInstance = null;
  }
  // if the returned array contains only a single node, allow it
  if (Array.isArray(vnode) && vnode.length === 1) {
    vnode = vnode[0];
  }
  // return empty vnode in case the render function errored out
  if (!(vnode instanceof VNode)) {
    if (Array.isArray(vnode)) {
      warn(
        'Multiple root nodes returned from render function. Render function ' +
        'should return a single root node.',
        vm
      );
    }
    vnode = createEmptyVNode();
  }
  // set parent
  vnode.parent = _parentVnode;
  return vnode
};
```

之前通过模板解析生成的 `render` 函数 拼接了一系列在这个阶段需要的字符串方法 例如：

1. `_c` 就是调用 Vue 上的 `createElement` 在其内部 调用 `_createElement` 方法 创建元素节点的 vnode

```javascript
function _createElement (
  context,
  tag,
  data,
  children,
  normalizationType
) {
  // 如果有data 并且 data上有 __ob__ 属性 
  // 说明这个 data 被 observed 过不能作为 vnode 的data属性
  if (isDef(data) && isDef((data).__ob__)) {
    warn(
      "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
      'Always create fresh vnode data objects in each render!',
      context
    );
    return createEmptyVNode()
  }
  // object syntax in v-bind
  // 将动态组件的 tag 设置为 动态组件上面 is 属性
  if (isDef(data) && isDef(data.is)) {
    tag = data.is;
  }
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }
  // warn against non-primitive key
  if (isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) {
    {
      warn(
        'Avoid using non-primitive value as key, ' +
        'use string/number value instead.',
        context
      );
    }
  }
  // support single function children as default scoped slot
  if (Array.isArray(children) &&
    typeof children[0] === 'function'
  ) {
    data = data || {};
    data.scopedSlots = { default: children[0] };
    children.length = 0;
  }
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children);
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children);
  }
  var vnode, ns;
  if (typeof tag === 'string') {
    var Ctor;
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
    if (config.isReservedTag(tag)) {
      // 如果是 HTML 的 tag
      // platform built-in elements
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      );
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      vnode = createComponent(Ctor, data, context, children, tag);
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      );
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children);
  }
  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) { applyNS(vnode, ns); }
    if (isDef(data)) { registerDeepBindings(data); }
    return vnode
  } else {
    return createEmptyVNode()
  }
}
```

2. `_v` 就是调用 Vue 上的 `createTextVNode` 创建文本节点的 vnode

```javascript
function createTextVNode (val) {
  return new VNode(undefined, undefined, undefined, String(val))
}
```

3. `_l` 就是调用 Vue 上的 `renderList` 循环创建元素节点

```javascript
function renderList (
  val,
  render
) {
  // val: []
  // render: function (item) { return _c('div') }
  var ret, i, l, keys, key;
  if (Array.isArray(val) || typeof val === 'string') {
    // 初始化一个 val 长度的 数组
    ret = new Array(val.length);
    // 循环生成 vnode [vnode, vnode]
    for (i = 0, l = val.length; i < l; i++) {
      ret[i] = render(val[i], i);
    }
  } else if (typeof val === 'number') {
    ret = new Array(val);
    for (i = 0; i < val; i++) {
      ret[i] = render(i + 1, i);
    }
  } else if (isObject(val)) {
    if (hasSymbol && val[Symbol.iterator]) {
      ret = [];
      var iterator = val[Symbol.iterator]();
      var result = iterator.next();
      while (!result.done) {
        ret.push(render(result.value, ret.length));
        result = iterator.next();
      }
    } else {
      keys = Object.keys(val);
      ret = new Array(keys.length);
      for (i = 0, l = keys.length; i < l; i++) {
        key = keys[i];
        ret[i] = render(val[key], key, i);
      }
    }
  }
  if (!isDef(ret)) {
    ret = [];
  }
  // 设置 ret 的 _isVList 为 true
  (ret)._isVList = true;
  return ret
}
```

然后调用外面的 `vm._update` 方法 传入生成好的 `vnode` 通过这个方法将 vnode 转为 页面上真实的 DOM

```javascript
Vue.prototype._update = function (vnode, hydrating) {
  var vm = this;
  // 根节点 <div id="app"></div>
  var prevEl = vm.$el;
  // 等同于 旧 vnode
  var prevVnode = vm._vnode;
  var restoreActiveInstance = setActiveInstance(vm);
  // 将新的 vnode 挂到 vm._vnode 上
  vm._vnode = vnode;
  // Vue.prototype.__patch__ is injected in entry points
  // based on the rendering backend used.
  if (!prevVnode) {
    // 如果之前没有 vnode 说明是第一次渲染 是初始化渲染页面
    // initial render
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
  } else {
    // 否则就是更新
    // updates
    vm.$el = vm.__patch__(prevVnode, vnode);
  }
  restoreActiveInstance();
  // update __vue__ reference
  if (prevEl) {
    prevEl.__vue__ = null;
  }
  if (vm.$el) {
    vm.$el.__vue__ = vm;
  }
  // if parent is an HOC, update its $el as well
  if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
    vm.$parent.$el = vm.$el;
  }
  // updated hook is called by the scheduler to ensure that children are
  // updated in a parent's updated hook.
};
```

第一次渲染 通过 `vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)` 方法来进行渲染 这个方法不仅包括第一次渲染 而且还包括 updates 就是进行 `Diff` patch

```javascript
function patch (oldVnode, vnode, hydrating, removeOnly) {
  if (isUndef(vnode)) {
    // 如果新节点不存在 但是老节点存在 就销毁老节点
    if (isDef(oldVnode)) { invokeDestroyHook(oldVnode); }
    return
  }

  // 首先将是否第一次补丁设置为 false
  var isInitialPatch = false;
  // 插入虚拟dom的队列
  var insertedVnodeQueue = [];


  if (isUndef(oldVnode)) {
    // 如果 oldVnode 不存在  vnode存在 这种情况会在一个组件初次渲染的时候出现
    // <div> <my-component /> </div>
    // 这个 my-component 渲染的时候会走到这
    // empty mount (likely as component), create new root element

    // 第一次补丁 变量为 true
    isInitialPatch = true;

    // 创建元素
    createElm(vnode, insertedVnodeQueue);
  } else {
    var isRealElement = isDef(oldVnode.nodeType);
    // 如果 oldVnode 不是一个真实的dom 并且 oldVnod 和 vnode 相似
    if (!isRealElement && sameVnode(oldVnode, vnode)) {
      // patch existing root node
      // 进行补丁 updates
      patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly);
    } else {
      if (isRealElement) {
        // 如果 oldVnode 是真实的dom 则表示是初次渲染
        // mounting to a real element
        // check if this is server-rendered content and if we can perform
        // a successful hydration.
        // 挂载到真实的元素以及处理服务端渲染情况
        if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
          oldVnode.removeAttribute(SSR_ATTR);
          hydrating = true;
        }
        if (isTrue(hydrating)) {
          if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
            invokeInsertHook(vnode, insertedVnodeQueue, true);
            return oldVnode
          } else {
            warn(
              'The client-side rendered virtual DOM tree is not matching ' +
              'server-rendered content. This is likely caused by incorrect ' +
              'HTML markup, for example nesting block-level elements inside ' +
              '<p>, or missing <tbody>. Bailing hydration and performing ' +
              'full client-side render.'
            );
          }
        }

        //这里 hydration，又可以翻译为“注入”，
        //可以理解为将在客户端生成的虚拟 DOM 结构注入到服务端渲染出的 HTML 中使这些静态的 HTML 变为动态的。
        // either not server-rendered, or hydration failed.
        // create an empty node and replace it
        // 走到这里说明不是服务端渲染 会根据 oldVnode 创建一个 vnode 节点
        // 因为走到这里一般都是初始化渲染 所以这里 oldVnode 是 vm.$el 就是 #app
        oldVnode = emptyNodeAt(oldVnode);
      }

      // replacing existing element
      // 拿到 oldVnode 真实的元素
      var oldElm = oldVnode.elm;
      // 拿到 oldVnode 真实的元素的父元素 即 body
      var parentElm = nodeOps.parentNode(oldElm);

      // create new node
      // 基于 vnode 创建整个 dom 树 并插入到 body 元素下
      createElm(
        vnode,
        insertedVnodeQueue,
        // extremely rare edge case: do not insert if old element is in a
        // leaving transition. Only happens when combining transition +
        // keep-alive + HOCs. (#4590)
        oldElm._leaveCb ? null : parentElm,
        nodeOps.nextSibling(oldElm)
      );

      // update parent placeholder node element, recursively
      // 递归更新父占位符节点元素
      if (isDef(vnode.parent)) {
        var ancestor = vnode.parent;
        var patchable = isPatchable(vnode);
        while (ancestor) {
          for (var i = 0; i < cbs.destroy.length; ++i) {
            cbs.destroy[i](ancestor);
          }
          ancestor.elm = vnode.elm;
          if (patchable) {
            for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
              cbs.create[i$1](emptyNode, ancestor);
            }
            // #6513
            // invoke insert hooks that may have been merged by create hooks.
            // e.g. for directives that uses the "inserted" hook.
            var insert = ancestor.data.hook.insert;
            if (insert.merged) {
              // start at index 1 to avoid re-invoking component mounted hook
              for (var i$2 = 1; i$2 < insert.fns.length; i$2++) {
                insert.fns[i$2]();
              }
            }
          } else {
            registerRef(ancestor);
          }
          ancestor = ancestor.parent;
        }
      }

      // destroy old node
      // 移除老节点
      if (isDef(parentElm)) {
        removeVnodes(parentElm, [oldVnode], 0, 0);
      } else if (isDef(oldVnode.tag)) {
        invokeDestroyHook(oldVnode);
      }
    }
  }

  invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
  return vnode.elm
}
```

通过上述代码我们知道 第一次渲染的时候 通过 `createElm` 来创建元素 这个方法主要是基于 vnode 创建整个 dom 树 然后插入到 父元素中 这个方法就是将 vnode 转成真实 dom 树插入到body元素中

```javascript
function createElm (
  vnode,
  insertedVnodeQueue,
  parentElm,
  refElm,
  nested,
  ownerArray,
  index
) {
  if (isDef(vnode.elm) && isDef(ownerArray)) {
    // This vnode was used in a previous render!
    // now it's used as a new node, overwriting its elm would cause
    // potential patch errors down the road when it's used as an insertion
    // reference node. Instead, we clone the node on-demand before creating
    // associated DOM element for it.
    vnode = ownerArray[index] = cloneVNode(vnode);
  }

  vnode.isRootInsert = !nested; // for transition enter check
  // 这里是针对组件的创建 之后会详细说明
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
    return
  }
  
  // 获取 vnode 上面的 data
  var data = vnode.data;
  // 获取 vnode 上面的 childre 就是子节点
  var children = vnode.children;
  // 获取标签
  var tag = vnode.tag;
  if (isDef(tag)) {
    {
      if (data && data.pre) {
        creatingElmInVPre++;
      }
      // 如果是 未知的标签 就 抛出错误
      if (isUnknownElement$$1(vnode, creatingElmInVPre)) {
        warn(
          'Unknown custom element: <' + tag + '> - did you ' +
          'register the component correctly? For recursive components, ' +
          'make sure to provide the "name" option.',
          vnode.context
        );
      }
    }

    // 创建 真实的 dom 赋值给 vnode 的 elm
    // vnode 的 elm 属性就是对应的真实的 dom 节点
    vnode.elm = vnode.ns
      ? nodeOps.createElementNS(vnode.ns, tag)
      : nodeOps.createElement(tag, vnode);
    setScope(vnode);

    /* istanbul ignore if */
    {
      // 递归创建 所有的子节点 （元素 组件）
      // 这个方法里通过利用递归 调用 createElm 创建出 所有的元素
      createChildren(vnode, children, insertedVnodeQueue);
      if (isDef(data)) {
        // 如果 vnode 上面的 data 属性存在 则对 属性进行处理
        invokeCreateHooks(vnode, insertedVnodeQueue);
      }
      // 将节点插入到父元素中
      insert(parentElm, vnode.elm, refElm);
    }

    if (data && data.pre) {
      creatingElmInVPre--;
    }
  } else if (isTrue(vnode.isComment)) {
    // 如果 isComment 为 true 说明这是注释节点
    // 创建注释节点 插入到父元素中
    vnode.elm = nodeOps.createComment(vnode.text);
    insert(parentElm, vnode.elm, refElm);
  } else {
    // 否则 就是文本节点
    // 创建文本节点插入到父元素中
    vnode.elm = nodeOps.createTextNode(vnode.text);
    insert(parentElm, vnode.elm, refElm);
  }
}



// 创建子节点
function createChildren (vnode, children, insertedVnodeQueue) {
  if (Array.isArray(children)) {
    {
      // 检查 key 值
      checkDuplicateKeys(children);
    }
    // 循环子节点 调用 createElm 方法 创建远元素
    for (var i = 0; i < children.length; ++i) {
      createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i);
    }
  } else if (isPrimitive(vnode.text)) {
    // 说明是文本节点 创建文本节点插入到父元素中
    nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)));
  }
}
```

上述代码看到了如果 vnode data 属性不为空 则调用 `invokeCreateHooks` 这个方法主要是在创建真实元素的时候提供一些钩子函数

```javascript
cbs.create = [
  updateAttrs(oldVnode, vnode),
  updateClass(oldVnode, vnode),
  updateDOMListeners(oldVnode, vnode),
  updateDOMProps(oldVnode, vnode),
  updateStyle(oldVnode, vnode),
  _enter(_, vnode),
  create(_, vnode),
  updateDirectives(oldVnode, vnode)
]


function invokeCreateHooks (vnode, insertedVnodeQueue) {
  for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
    cbs.create[i$1](emptyNode, vnode);
  }
  i = vnode.data.hook; // Reuse variable
  if (isDef(i)) {
    if (isDef(i.create)) { i.create(emptyNode, vnode); }
    if (isDef(i.insert)) { insertedVnodeQueue.push(vnode); }
  }
}
```

通过上述代码可以知道 在元素创建的时候 主要调用的 `cbs.create` 里面的钩子函数 同时在创建的时候传入的也是 `emptyNode` 来分别依次更新 元素上面的 属性 类名 事件 props 样式 transition动画 Ref 过滤器

### 2.1 解析updateDOMListeners

这个方法主要是用来注册和更新绑定在DOM上的事件

```javascript
function updateDOMListeners (oldVnode, vnode) {
  // 如果 oldVnode 和 vnode 上面都没有 事件 直接 return
  if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
    return
  }
  // 拿到新的事件对象 如果没有 则取空对象
  var on = vnode.data.on || {};
  // 拿到旧的事件对象 如果没有 则取空对象
  var oldOn = oldVnode.data.on || {};
  // 拿到 vnode上面的 真实元素
  target$1 = vnode.elm;
  normalizeEvents(on);
  // 这个方法 主要就是绑定事件和移除事件
  updateListeners(on, oldOn, add$1, remove$2, createOnceHandler$1, vnode.context);
  // 更新完成 真实元素 赋值为 undefined
  target$1 = undefined;
}


function updateListeners (
  on,
  oldOn,
  add,
  remove$$1,
  createOnceHandler,
  vm
) {
  var name, def$$1, cur, old, event;
  // 循环 on 对象 所有的事件
  for (name in on) {
    // 拿到 新的事件
    def$$1 = cur = on[name];
    // 拿到 旧的事件
    old = oldOn[name];
    /**
     *  这里得到的 event
     * event: {
     *  name: 'click', 
     *  capture: false,
     *  once: false,
     *  passive: false
     * }
     * 
     **/
    event = normalizeEvent(name);
    if (isUndef(cur)) {
      warn(
        "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
        vm
      );
    } else if (isUndef(old)) {
      // 如果没有旧事件
      // 并且新事件上面没有 fns
      if (isUndef(cur.fns)) {
        // 创建 invoker 函数 赋值给 on[name] 和 cur
        cur = on[name] = createFnInvoker(cur, vm);
      }
      // 这里是处理 $once 
      if (isTrue(event.once)) {
        cur = on[name] = createOnceHandler(event.name, cur, event.capture);
      }
      // 调用传入进来的 add$1
      add(event.name, cur, event.capture, event.passive, event.params);
    } else if (cur !== old) {
      old.fns = cur;
      on[name] = old;
    }
  }
  // 遍历 旧数据上面的 事件
  for (name in oldOn) {
    // 如果在新数据上面没有这个事件
    if (isUndef(on[name])) {
      event = normalizeEvent(name);
      // 则移除这个事件
      remove$$1(event.name, oldOn[name], event.capture);
    }
  }
}


// 创建一个 invoker 函数 return 出去
// 经过 Vue 处理 我们触发的事件 就是这里面的 invoker 函数 
function createFnInvoker (fns, vm) {
  // 定义 invoker 函数
  function invoker () {
    // 原生事件 arguments 指的是事件对象
    var arguments$1 = arguments;
    // 拿到真正经过处理的 我们写在dom上的事件
    // 在之前经过 genData$2 函数的处理 最终我们所写的 例如 :
    // 有参数：@click="handleClick('1')" => {on: {"click": function($event) { return handleClick('1') } }}
    // 无参数：@click="handleClick" => {on: {"click": handleClick }}
    var fns = invoker.fns;
    // 如果 fns 为数组 则循环调用
    if (Array.isArray(fns)) {
      var cloned = fns.slice();
      for (var i = 0; i < cloned.length; i++) {
        invokeWithErrorHandling(cloned[i], null, arguments$1, vm, "v-on handler");
      }
    } else {
      // 直接调用
      // return handler return value for single handlers
      return invokeWithErrorHandling(fns, null, arguments, vm, "v-on handler")
    }
  }
  // 将我们定义的事件  例如 handleClick 赋值给 invoker的fns
  invoker.fns = fns;
  // 返回 invoker 函数
  return invoker
}



// 这个方法主要就是用来触发 我们定义在 methods 里面的方法
function invokeWithErrorHandling (
  handler,
  context,
  args,
  vm,
  info
) {
  var res;
  try {
    // 判断是否有参数 然后进行调用
    res = args ? handler.apply(context, args) : handler.call(context);
    if (res && !res._isVue && isPromise(res) && !res._handled) {
      res.catch(function (e) { return handleError(e, vm, info + " (Promise/async)"); });
      // issue #9511
      // avoid catch triggering multiple times when nested calls
      res._handled = true;
    }
  } catch (e) {
    handleError(e, vm, info);
  }
  return res
}

/**
 *  这个方法主要是绑定dom上的事件
 *  name: 事件的名称
 *  handler: 之前处理的 invoker 函数
 *  capture
 *  passive
 * **/
function add$1 (
  name,
  handler,
  capture,
  passive
) {
  // async edge case #6566: inner click event triggers patch, event handler
  // attached to outer element during patch, and triggered again. This
  // happens because browsers fire microtask ticks between event propagation.
  // the solution is simple: we save the timestamp when a handler is attached,
  // and the handler would only fire if the event passed to it was fired
  // AFTER it was attached.
  if (useMicrotaskFix) {
    var attachedTimestamp = currentFlushTimestamp;
    // 将 之前的 invoker 函数 赋值给 original
    var original = handler;
    // 在 invoker 上面再 挂载 一个 _wrapper 函数 
    // 然后将这个函数重新赋值给 handler
    // 因此经过 Vue 的处理 最后绑定的就是 下面这个函数
    handler = original._wrapper = function (e) {
      if (
        // no bubbling, should always fire.
        // this is just a safety net in case event.timeStamp is unreliable in
        // certain weird environments...
        e.target === e.currentTarget ||
        // event is fired after handler attachment
        e.timeStamp >= attachedTimestamp ||
        // bail for environments that have buggy event.timeStamp implementations
        // #9462 iOS 9 bug: event.timeStamp is 0 after history.pushState
        // #9681 QtWebEngine event.timeStamp is negative value
        e.timeStamp <= 0 ||
        // #9448 bail if event is fired in another document in a multi-page
        // electron/nw.js app, since event.timeStamp will be using a different
        // starting reference
        e.target.ownerDocument !== document
      ) {
        // 最后我们做点击事件的事件的时候 其实调用的 就是 invoker 函数
        // 然后再 invoker 里进行处理
        // 这里的 arguments是指 事件对象 e
        return original.apply(this, arguments)
      }
    };
  }
  // 绑定dom事件
  target$1.addEventListener(
    name,
    handler,
    supportsPassive
      ? { capture: capture, passive: passive }
      : capture
  );
}
```

综上代码就是原生事件绑定及其调用的原理 当然 Vue 不仅有原生事件 还有自定义事件 用于父子组件传递参数 这种自定义事件在组件生成的时候会进行分析
