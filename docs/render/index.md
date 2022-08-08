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


