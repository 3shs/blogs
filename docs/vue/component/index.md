---
title: 组件分析
---

## 1. 前言

组件是 Vue 重要的组成部分 所以了解组件的工作原理是十分有必要的

## 2. 组件解析

在创建虚拟DOM之前 不会去单独的去解析组件 所以在在生成 `render` 函数的时候 我们所命名的组件名还是对应的什么组件名 `_c('my-component')` 但是在调用 `_createElement` 方法生成虚拟DOM的时候 Vue 会对组件以不同的逻辑进行处理

这个 `_createElement` 在文档 render 的时候已经分析过了 但是里面有含有组件的逻辑 之前是没有提到过的 现在放到这里单独分析 其实针对 创建组件 vnode 的就两种情况

1. 如果 tag 不是 string 的话 直接当成组件 调用 `createComponent` 来创建 组件的 vnode

2. 如果 tag 是 string 的话 并且这个 tag 不是 html 内置的标签名的话 调用 `createComponent` 来创建 组件的 vnode

如果是组件的话 调用 `resolveAsset` 取出我们写在 组件里的 `options` 赋值给 Ctor 这个 options 其实就是我们写在组件内的 `{ data() {}, props: {}, methods: {} }` 这些配置

然后去调用 `createComponent` 方法去 创建 vnode 这个方法 主要有三大部分

1. 构造子类的构造函数即构造组件的构造函数

2. 安装组件的钩子函数

3. 生成组件的 vnode

```javascript
function _createElement (
  context,
  tag,
  data,
  children,
  normalizationType
) {
  if (isDef(data) && isDef((data).__ob__)) {
    warn(
      "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
      'Always create fresh vnode data objects in each render!',
      context
    );
    return createEmptyVNode()
  }
  // object syntax in v-bind
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

```javascript
function createComponent (
  Ctor,
  data,
  context,
  children,
  tag
) {
  // 如果写在组件内的配置不存在 直接 retrun
  if (isUndef(Ctor)) {
    return
  }

  // 取出 context.$options._base 其实就是 Vue
  var baseCtor = context.$options._base;

  // plain options object: turn it into a constructor
  // 如果写在 组件上的 option 是个对象
  if (isObject(Ctor)) {
    // 其实就是调用 Vue 上面的 extend 方法 将其 转成一个构造函数
    Ctor = baseCtor.extend(Ctor);
  }

  // if at this stage it's not a constructor or an async component factory,
  // reject.
  if (typeof Ctor !== 'function') {
    {
      warn(("Invalid Component definition: " + (String(Ctor))), context);
    }
    return
  }

  // async component
  var asyncFactory;
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor;
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor);
    if (Ctor === undefined) {
      // return a placeholder node for async component, which is rendered
      // as a comment node but preserves all the raw information for the node.
      // the information will be used for async server-rendering and hydration.
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        children,
        tag
      )
    }
  }

  data = data || {};

  // resolve constructor options in case global mixins are applied after
  // component constructor creation
  resolveConstructorOptions(Ctor);

  // transform component v-model data into props & events
  if (isDef(data.model)) {
    transformModel(Ctor.options, data);
  }

  // extract props
  var propsData = extractPropsFromVNodeData(data, Ctor, tag);

  // functional component
  if (isTrue(Ctor.options.functional)) {
    return createFunctionalComponent(Ctor, propsData, data, context, children)
  }

  // extract listeners, since these needs to be treated as
  // child component listeners instead of DOM listeners
  var listeners = data.on;
  // replace with listeners with .native modifier
  // so it gets processed during parent component patch.
  data.on = data.nativeOn;

  if (isTrue(Ctor.options.abstract)) {
    // abstract components do not keep anything
    // other than props & listeners & slot

    // work around flow
    var slot = data.slot;
    data = {};
    if (slot) {
      data.slot = slot;
    }
  }

  // install component management hooks onto the placeholder node
  installComponentHooks(data);

  // return a placeholder vnode
  var name = Ctor.options.name || tag;
  var vnode = new VNode(
    ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
    data, undefined, undefined, undefined, context,
    { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },
    asyncFactory
  );

  return vnode
}
```

```javascript
Vue.extend = function (extendOptions) {
  // 写在 组件里面的 options
  extendOptions = extendOptions || {};
  // this 其实就是 Vue 因为上面代码是 Vue 进行调用的
  var Super = this;
  // 取出 cid
  var SuperId = Super.cid;
  // extendOptions上面的 _Ctor 上有值 就去对应的值 没有 赋予 {}
  var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});

  // 如果 cachedCtors 上有 SuperId 直接返回对应的数据
  if (cachedCtors[SuperId]) {
    return cachedCtors[SuperId]
  }

  var name = extendOptions.name || Super.options.name;
  if (name) {
    validateComponentName(name);
  }

  // 将 构造函数 VueComponent 赋值给 Sub
  var Sub = function VueComponent (options) {
    this._init(options);
  };
  // 将 构造函数 Vue 赋值给 构造函数 Sub 的原型对象 
  // 其实 这行代码 就相当于 Sub.prototype = new Vue()
  Sub.prototype = Object.create(Super.prototype);
  // 将实实例对象 指向 构造函数
  // 其实这里就是最标准的 原型继承
  Sub.prototype.constructor = Sub;
  // 赋值 Sub 的 cid
  Sub.cid = cid++;
  // 合并 Vue 上自定义的 options 和 写在组件内的options 赋值给 Sub.options
  Sub.options = mergeOptions(
    Super.options,
    extendOptions
  );
  // 赋值 Sub 的 super
  Sub['super'] = Super;

  // For props and computed properties, we define the proxy getters on
  // the Vue instances at extension time, on the extended prototype. This
  // avoids Object.defineProperty calls for each instance created.
  if (Sub.options.props) {
    initProps$1(Sub);
  }
  if (Sub.options.computed) {
    initComputed$1(Sub);
  }

  // allow further extension/mixin/plugin usage
  // 做一些赋值工作
  Sub.extend = Super.extend;
  Sub.mixin = Super.mixin;
  Sub.use = Super.use;

  // create asset registers, so extended classes
  // can have their private assets too.
  // ASSET_TYPES: [''component, 'directive', 'filter']
  ASSET_TYPES.forEach(function (type) {
    Sub[type] = Super[type];
  });
  // enable recursive self-lookup
  // 如果组件有配置中有 name 属性
  if (name) {
    Sub.options.components[name] = Sub;
  }

  // keep a reference to the super options at extension time.
  // later at instantiation we can check if Super's options have
  // been updated.
  Sub.superOptions = Super.options;
  Sub.extendOptions = extendOptions;
  // 将 Sub.options 合并到 {}
  Sub.sealedOptions = extend({}, Sub.options);

  // cache constructor
  // 缓存 构造函数
  cachedCtors[SuperId] = Sub;
  // 返回构造函数
  return Sub
};
```