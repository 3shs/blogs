---
title: 生成render函数
---

## 1. 前言

上面的模板编译已经将模板解析成 ***AST*** 树形格式 现在需要将这个 ***AST*** 转化为 可以被 Vue 调用的 `render` 函数

## 2. generate 函数

该方法目的是将模板编译好的 ***AST*** 解析成为 `render` 函数 内部主要利用 `genElement` 方法先将 ***AST*** 解析成 `render` 函数所需的 `code` 字符串 最后拼接为 `with` 函数的 字符串

```javascript
function generate (
  ast,
  options
) {
  var state = new CodegenState(options);
  // 将 AST 处理成 render 函数所需的 code 字符串
  var code = ast ? genElement(ast, state) : '_c("div")';
  return {
    // 拼接 with 函数字符串
    render: ("with(this){return " + code + "}"),
    staticRenderFns: state.staticRenderFns
  }
}
```

## 3. genElement 函数

通过各种判断来决定生成什么 基本原理就是 将 ***AST*** 解析成为 创建一个元素所需要的 `tag` `attrs` `children` 例如：

```javascript
//  标签    属性               子元素 同样子元素也是遵循这个基本原理
'_c("div", {attrs: {id: app}}, [_c("span", {}, [])])'
```

```javascript
function genElement (el, state) {
  if (el.parent) {
    el.pre = el.pre || el.parent.pre;
  }

  if (el.staticRoot && !el.staticProcessed) {
    return genStatic(el, state)
  } else if (el.once && !el.onceProcessed) {
    return genOnce(el, state)
  } else if (el.for && !el.forProcessed) {
    return genFor(el, state)
  } else if (el.if && !el.ifProcessed) {
    return genIf(el, state)
  } else if (el.tag === 'template' && !el.slotTarget && !state.pre) {
    return genChildren(el, state) || 'void 0'
  } else if (el.tag === 'slot') {
    return genSlot(el, state)
  } else {
    // component or element
    var code;
    if (el.component) {
      code = genComponent(el.component, el, state);
    } else {
      var data;
      if (!el.plain || (el.pre && state.maybeComponent(el))) {
        // 将写在标签上的属性 解析成 data 字符串 -> {attr: {id: app}, on: {click: handleClick}}
        data = genData$2(el, state);
      }
      // 解析 该元素下面的所有子元素
      var children = el.inlineTemplate ? null : genChildren(el, state, true);
      code = "_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")";
    }
    // module transforms
    for (var i = 0; i < state.transforms.length; i++) {
      code = state.transforms[i](el, code);
    }
    return code
  }
}



function genChildren (
  el,
  state,
  checkSkip,
  altGenElement,
  altGenNode
) {
  // 拿到子元素
  var children = el.children;
  if (children.length) {
    // 取出子元素里的第一个元素
    var el$1 = children[0];
    // optimize single v-for
    // 这里是优化子元素只有 v-for 的情况 直接通过 genElment 来处理 不需要循环子元素来进行处理
    if (children.length === 1 &&
      el$1.for &&
      el$1.tag !== 'template' &&
      el$1.tag !== 'slot'
    ) {
      var normalizationType = checkSkip
        ? state.maybeComponent(el$1) ? ",1" : ",0"
        : "";
      return ("" + ((altGenElement || genElement)(el$1, state)) + normalizationType)
    }
    var normalizationType$1 = checkSkip
      ? getNormalizationType(children, state.maybeComponent)
      : 0;
    // 提供 altGenNode 就用 altGenNode 否则就用 genNode
    var gen = altGenNode || genNode;
    // 然后依次循环处理 children
    return ("[" + (children.map(function (c) { return gen(c, state); }).join(',')) + "]" + (normalizationType$1 ? ("," + normalizationType$1) : ''))
  }
}


// 该方法是判断来生成节点 
// 这里的节点指的不是真实的节点 而是字符串拼接的 在之后用来生成什么类型的 vnode
// 例如 _c('div'),  _v(_s(item.name)) 这种
function genNode (node, state) {
  if (node.type === 1) {
    // 生成元素节点
    return genElement(node, state)
  } else if (node.type === 3 && node.isComment) {
    // 生成注释节点
    return genComment(node)
  } else {
    // 生成文本节点
    return genText(node)
  }
}
```

通过 `genElement` 这个方法 基本逻辑是 递归循环处理 将 ***AST*** 转化成 `render` 函数所需要的 字符串 `code` 例如：

```javascript
code = "_c(
  'div', 
  {attrs: {"id": "app"}},
  [
    _c(
      'h1',
      {on: {"click": "handleClick"}},
      [
        _v(_s(txt))
      ]
    ),
    _v(""),
    _l(
      (list), 
      function (item) {return _c('div', [_v(_s(item.name))])}
    )
  ],
  2
)"
```

最终利用code拼接一个 `with` 函数的字符串 再通过 `new Function(code)` 得到一个 `render` 匿名函数

最后 让这个 `template` 字符串为键 以这个 `render`　函数为值　cache一下

## 4. genFor 函数

这个函数主要用来处理 `v-for` 这个指令的 基本逻辑 用 Vue 上面的 `_l` 方法来进行处理 这个方法接收两个参数 第一个参数 传入 我们写在模板的 数据源 例如 `list` 第二个参数是拼接一个方法 主要用来生成节点

所以这个方法 就是用来拼接 `_l` 方法所需要的数据

```javascript
_l(
  (list), 
  function (item) {return _c('div', [_v(_s(item.name))])}
)
```

```javascript
function genFor (
  el,
  state,
  altGen,
  altHelper
) {
  // 拿到元素上面的 数据源 例如 list
  var exp = el.for;
  // 拿到我们定义的别名 例如 item
  var alias = el.alias;

  var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
  var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';

  
  if (state.maybeComponent(el) &&
    el.tag !== 'slot' &&
    el.tag !== 'template' &&
    !el.key
  ) {
    state.warn(
      "<" + (el.tag) + " v-for=\"" + alias + " in " + exp + "\">: component lists rendered with " +
      "v-for should have explicit keys. " +
      "See https://vuejs.org/guide/list.html#key for more info.",
      el.rawAttrsMap['v-for'],
      true /* tip */
    );
  }

  // 避免进入递归 就是死循环
  el.forProcessed = true; // avoid recursion

  // 拼接 _l 函数 及其里面的参数 例如:
  // exp: list
  // function(item) { retrun _c('div', [_v(_s(item.name))])}
  return (altHelper || '_l') + "((" + exp + ")," +
    "function(" + alias + iterator1 + iterator2 + "){" +
      "return " + ((altGen || genElement)(el, state)) +
    '})'
}
```

## 5. 解析 v-if

基本的原理就根据我们提供的数据 利用一个三元表达式 判断是否生成元素

在前面模板解析的时候 对于标签上的属性都做了解析 当然也包括 `v-if` 其解析出来基本格式为：

```javascript
if: "isShow",
ifConditions: [
  {
    exp: 'isShow',
    block: {
      // 自身的所有AST属性
    }
  },
]
```

然后在 `genElement` 方法里对 ***AST*** 节点上 是否存在 `el.if` 属性进行判断 如果有 则调用 `genIf` 方法 该方法返回 `genIfConditions` 的结果

`genIfConditions` 方法主要进行以下判断

首先判断 **AST** 上面的 **ifConditions** 是否为空 如果为空 直接返回 空节点 或者 `_e()` 利用 `_e` 方法创建的空节点

如果不为空则继续往下走 拿到 **condition** 头部的数据对象

然后判断 该头部数据是有值 如果有值 则返回 一段经过处理好的 三元字符串 大致如下

```javascript
isShow ? _c('div') : _e()
```

最后在调用生成好的 render 函数的时候 根据 **isShow** 来判断 是否生成对应的元素还是空节点

```javascript
function genIf (
  el,
  state,
  altGen,
  altEmpty
) {
  el.ifProcessed = true; // avoid recursion
  return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
}



function genIfConditions (
  conditions,
  state,
  altGen,
  altEmpty
) {
  // 如果 ast 上面解析出来的 ifConditions 则直接返回空节点
  if (!conditions.length) {
    return altEmpty || '_e()'
  }

  // 拿到 conditions 里面的数据
  var condition = conditions.shift();
  // exp -> isShow
  if (condition.exp) {
    // 这里 genTernaryExp 方法内部处理各种情况 目的就是返回 解析好的 元素 code
    return ("(" + (condition.exp) + ")?" + (genTernaryExp(condition.block)) + ":" + (genIfConditions(conditions, state, altGen, altEmpty)))
  } else {
    return ("" + (genTernaryExp(condition.block)))
  }

  // v-if with v-once should generate code like (a)?_m(0):_m(1)
  function genTernaryExp (el) {
    return altGen
      ? altGen(el, state)
      : el.once
        ? genOnce(el, state)
        : genElement(el, state)
  }
}
```

## 6. 解析 v-show

在解析模板的阶段会对 `v-show` 这个属性转化为 指令的形式

```javascript
// AST 比如这样子
{
  attrsList,
  attrsMap,
  children: [],
  directives: [
    {
      arg: null,
      end: 39,
      isDynamicArg: false,
      modifiers: undefined,
      name: "show",
      rawName: "v-show",
      start: 24,
      value: "isShow",
    }
  ],
  end: 46,
  hasBindings: true,
  parent: {type: 1, tag: 'div', attrsList: Array(1), attrsMap: {…}, rawAttrsMap: {…}, …}
  plain: false,
  rawAttrsMap,
  start: 19,
  tag: "div",
  type: 1,
}
```
然后在将 ***AST*** 转为 `render` 函数之前的 `code` 的时候 通过 `genData$2` 方法里的 `genDirectives` 方法 拼接出该元素的 data 例如：

```javascript
// 解析成这样
"{directives:[{name:"show",rawName:"v-show",value:(isShow),expression:"isShow"}]}"

```
最后在创建真实Dom的时候 调用 `invokeCreateHooks` 方法 该方法里面通过 `updateDirectives` 来更新指令 就是 Vue 内部自定义的 `v-show` 指令 通过 `bind` 方法来处理 最后 通过之前的 `value` 来决定是否 `display:none`
