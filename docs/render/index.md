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

随后首先调用 `updateComponent` 方法里的 `vm._render()` 方法 这个方法最主要的目的就是 调用 `render` 函数拿到 `vnode` 也就是虚拟DOM

```javascript
Vue.prototype._render = function () {
  var vm = this;
  var ref = vm.$options;
  // 拿到render函数
  var render = ref.render;
  // 拿到 _parentVnode 如果是组件 就有这个属性 就对应的时组件自身 如果不是组件就没有这个属性 
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
    // 调用render函数 拿到 vnode
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