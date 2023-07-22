---
title: 生命周期
---

## 1. 前言

## 2. vue生命周期

### _init 方法 初始化

* 主要是初始化 vm
* 合并我们写在组件里面 options 与 vue 本身自带的 components (KeepAlive, Transition, TransitionGroup) directives(model, show) 运用策略模式 合并 赋值给 vm.$options
* 然后进入 initLifecycle 方法 初始化 一些 $parent $root $children $refs _watcher _inactive _directInactive _isMounted _isDestroyed _isBeingDestroyed 赋予默认值
* 然后 进入 initEvents 方法 初始化些我们写在父组件上的自定义事件 赋值给 vm._events = {}
* 然后 进入 initRender 方法 初始化一些 render时候需要用到的 slots 默认值 以及 vm._c vm.$createElement
* 然后 callHook 一下 beforeCreated 说明在这个钩子函数之前 我们仅仅做个一些初始化的 准备工作

### created 钩子执行之前阶段工作

* 然后进入 initInjections 方法 拿到 inject 的值
* 然后进入 initState 方法 
* 如果又 props 调用 initProps 方法 拿到 prop 的值 并进行一些处理 
* 如果有方法 就调用 initMethods 方法 进行处理 包括对一些规则的校验 方法写的不对 和 props 定义重名 已_ 和 $ 开头 然后将 方法绑定到 vm上 就是 this上
* 如果有data函数 调用 initData 方法 对 数据进行一些处理 包括不能和 方法重名 props 重名  最后调用 observe 这个方法 对数据进行 响应式 
* 如果有计算属性 调用initComputed 方法 对计算属性进行处理 然后对计算属性进行 Object.defineProperty
* 如果有watch 调用 initWatch 方法 对watch 进行处理
* 然后 callHook 一下 我们写在组件里的 created 钩子函数 说明当执行到这个钩子函数的时候 我们 inject props methods data computed watch 都能获取到了 而且数据都进行了 响应式

### beforeMount 钩子执行之前阶段工作

* 然后进入对模板的解析过程
* 如果有template 就用 template 没有 就用 app 的outerHtml
* 然后调用 compileToFunctions 方法 将模板编译成 render 函数 其实这里面做了很多的事情
* 首先做了性能处理 这个模板如果被编译了 就从缓存里面取代
* 然后进入解析我们所写的模板 调用 parse 方法 将我们所写的模板 解析成 AST 抽象语法树
* 然后通过 generate 方法 生成 一个 with 函数 的字符串
* 然后调用createFunction 将 witch 函数的字符串 转成 匿名函数的 witch 函数 得到 render 函数
* 然后 callHook 一下 我们写在组件里的 beforeMount 这个钩子函数 说明当这个钩子函数执行的时候 我们已经将 模板编译成 render 函数了

### mounted 钩子执行之前阶段工作

* 然后进入挂载阶段
* new Watch()
* 先调用 _render 方法 在这个方法里面主要是 调用我们解析好的 render 函数 生成 vnode 虚拟Dom
* 然后调用 _update 方法方法
* 这个方法可 update diff 算法 可第一次渲染 利用 vnde tag 的值 创建真实的 dom 挂在到 vnode ele 上 然后递归创建 最后插入到 页面中 然后删除我们原始的模板
* 然后 callHoock 我们写在组件里面的 mounted 这个钩子函数 当这个钩子函数执行的时候 所有真实的dom都插入到页面中的 这是我们能获取到页面上真实的dom


* 更新阶段
* 如果数据更新 利用dep.notify() 通知修改 然后找到对应的 watcher
* 调用一下 watcher 上面 before 方法 这个方法 主要用来 callHook 我们写在组件里面 beforeUpdate 这个钩子函数 当执行到这个函数说明 马上就要进行数据更新 说明这时候的数据还是之前的数据
* 然后重新调用 _render 函数 调用我们生成的 render 函数 重新生成一份 vnode
* 然后一样调用 _update 这个方法 来进行更新 主要是diff算法 双指针的方式
* 然后一个数据被多初地方用到 一定是先触发 子组件里的 update 钩子函数 然后向外 直到所有的 watcher 都被处理 意思就是 只要运用这个数据被改变了 那这个组件的 updated 钩子函数就会被触发
* 当这个钩子函数执行的时候 就说明 我们可以得到最新的 数据了 
*  
* 
* 主要逻辑 notify 通知修改
* 重新调用 _render 函数 生成虚拟dom 
* 然后 通过 update 方法 diff 算法 
* 遇到子组件 patch 则调用 prepatch 方法触发更新
* 子组件 通过组件的 钩子函数 prepatch 这个钩子 里面的 updateChildComponent() 方法 通过对 prop 赋值 出发 notify 去修改 为  queue 添加子组件的 watcher
* 
* 细节 在父组件里面 更新 子组件 通过 flushing 字段 表示整个的还在更新 然后 将子组件的 这个 watcher 加到 queue 后面
* 然后继续循环 queue 队列 这时候 队列里有个 子组件 watcher
* 然后开始更新 同样 render函数 update方法 diff 去修改模板
* 
* 
* 
* 
* new Watcher 将 render 函数传进去  render 对应 Wacther 调用 watcher 的 get 方法其实就是 调用 render 
* 这是将 Dep.target = this(对应这个Watcher)  dep.depend 就将这个 watcher 收集进去
* 
* 
* slot 解析 先解析 父组件么 
* 当解析到父组件的 slot=header 就给 ast 加上 slotTarget 属性 el.slotTarget = "header"
* 然后在生成 render 函数的处理 el.slotTarget
* 生成例如 _c('div', {attr: "slot": "header"}, slot: "header")
* 到这里父组件关于插槽的就解析好了
* 
* 在父组件里生成子组件的dom 我们写的不是 标准标签 是作为一个vnode来生成的
* 但是这个 vnode 有个特殊之处 就是在于 他提供一个 componentOptions 这个属性 值为
* {
*  Ctor: 构造子类的构造函数 其实就是 _init 重新走一遍
*  children: [] 子组件在父组件中使用 在标签内定义的一些 插槽 内容
*  listeners：事件
*  propsData: props 对象 {name : 'zs'}
*  tag: 'child'
* }
* 
* 
* 然后在生成真实的dom的时候 继续处理 component 处理
* 如果发现这个标签是组件标签 就再对组件进行处理 用提供的组件钩子函数进行处理 init prepatch insert 等等
* 拿到之前的 Ctor 拿到父级作用域 然后是 本身的虚拟dom
* options:{
*  _isComponent: true,
_parentVnode: vnode,
parent: parent
* }
* new vnode.componentOptions.Ctor(options)
* 然后进入 _init方法 
* 如果是组件则进入 initInternalComponent 方法 对 option 进行处理
* 处理成
* vm.options: {
*  parent,
*  propsData,
*  _componentTag,
*  _parentListeners,
*  _parentVnode vnode 对应组件本身
*  _renderChildren vnode  对应 在父组件内 引入 子组件 在子组件内写的 插槽内容
* }
* 
* 然后再initRender 里面 对插槽进行数据处理 最终修改成 下面的形式
* vm.$slot: {
*  header: [vnode]
*  default: [vnode]
*  footer: [vnode]
* }
* 
* 然后进入解析阶段
* 同样解析 将 template 里的模板变成 render 函数
* 有 slot 标签 最后都会 转成 _t("header") _t("default") _t("footer")
* 然后在挂载阶段对slot进行出里 转换成
* {
*  header: function () { return slot[key] } slot 对应前面解析出来的 $slot key 对应就是 header
* }
* 然后执行 render 函数 _t 调用 renderSlot 方法 里面就调用 之前的 function () { return slot[key] } 取出对应的 vnode
* 
* 整体逻辑就是 在父组件 解析到组件 比如 上文的 child
* 然后vue 发现他是一个组件 然后将这个组件 特殊处理 生成 组件 vnode 时候 会定义 一个 componentOptions 这个属性
* 属性值为
* {
*  Ctor: 构造子类的构造函数 其实就是 _init 重新走一遍
*  children: [] 子组件在父组件中使用 在标签内定义的一些 插槽 内容
*  listeners：事件
*  propsData: props 对象 {name : 'zs'}
*  tag: 'child'
* }
* 然后解析组件的时候 处理 插槽 对应的那个 vnode
* 然后在 调用子组件的时候 传入 slot 的 值 返回对应的 vnode
* 子组件内的 vnode 全都转成真实的 dom 插入到 父组件中