---
title: 模板解析
---

## 1. parse 函数

里面维护了一个 `stack`  内部主要调用 `parseHTMl` 方法对模板进行解析 并且传入 `template` 模板 和 `start`，`end`，`chars`，`comment` 四个方法

<font color=red>**这里的 `stack` 里面主要维护的是解析好的 `AST`**</font>

## 2. parseHTML 函数

这个方法主要是用来解析我们所写的 `template` 模板里面的东西

里面也维护了一个 `stack`  以及游标 `index` 循环解析模板 用 `template.indexOf('<')` 来匹配 匹配到了 `为0` 后 先后判断分别是 是否为 `comment`，`条件注释`，`Doctype`，`End Tag`，`Start Tag`

<font color=red>**这里的 `stack` 里面主要维护的解析好的我们写在标签上的一些属性以及属性开始的下标和结束的下标**</font>

## 3. 解析 Start Tag

调用 `parseStartTag` 这个方法主要匹配单个标签的开始到结束以及里面所有的属性 `<div id="app">` 顺序依次是 `<div` 、`id="app"` 、`>` 

```javascript
function parseStartTag () {
  // 得到 start ['<div', 'div', ...]
  var start = html.match(startTagOpen);
  if (start) {
    var match = {
      tagName: start[1],
      attrs: [],
      start: index
    };
    // 记录 游标 index 并且截取模板字符串
    advance(start[0].length);
    var end, attr;
    // 循环匹配标签上的属性
    while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
      attr.start = index;
      advance(attr[0].length);
      attr.end = index;
      match.attrs.push(attr);
    }
    if (end) {
      match.unarySlash = end[1];
      advance(end[0].length);
      match.end = index;
      return match
    }
  }
}
```

通过 `advance` 方法去记录游标 `index` 的位置并且通过 `subString` 来截取字符串 截取掉已经处理过的模板字符串 得到未处理的模板字符串

```javascript
function advance (n) {
  index += n;
  html = html.substring(n);
}
```

再通过 `while` 循环匹配 `attr` 直到属性全部匹配完匹配到 `>` 结束 最终得到一个 `match` 例如：

```javascript
{
  attrs: [
    ['id=app', 'id', '=', 'app', start: 4, end: 13, ... ]
  ],
  end: 14,
  start: 0,
  tagName: "div",
  unarySlash: ""
}
```

然后通过 `handleStartTag` 方法处理一下 `match` 得到例如： `attr = [{name: 'id', value: 'app', start: 5, end: 13}]` 这样的属性数组

```javascript
function handleStartTag (match) {
  // 拿到标签名称
  var tagName = match.tagName;
  // 自闭合标签
  var unarySlash = match.unarySlash;

  if (expectHTML) {
    if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
      parseEndTag(lastTag);
    }
    if (canBeLeftOpenTag$$1(tagName) && lastTag === tagName) {
      parseEndTag(tagName);
    }
  }

  var unary = isUnaryTag$$1(tagName) || !!unarySlash;

  var l = match.attrs.length;
  //  利用 match 解析出来的 attrs 长度 重新生成一个相同长度的 attrs
  var attrs = new Array(l);
  for (var i = 0; i < l; i++) {
    var args = match.attrs[i];
    var value = args[3] || args[4] || args[5] || '';
    var shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
      ? options.shouldDecodeNewlinesForHref
      : options.shouldDecodeNewlines;
    attrs[i] = {
      name: args[1],
      value: decodeAttr(value, shouldDecodeNewlines)
    };
    if (options.outputSourceRange) {
      attrs[i].start = args.start + args[0].match(/^\s*/).length;
      attrs[i].end = args.end;
    }
  }

  if (!unary) {
    stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end });
    lastTag = tagName;
  }

  if (options.start) {
    options.start(tagName, attrs, unary, match.start, match.end);
  }
}
```

然后 **push** 到 `parseHTML` 的 `stack` 中

```javascript
// stack
[
  {
    attrs: [
      {
        name: 'id', 
        value: 'app', 
        start: 5,
        end: 13
      }
    ]
    end: 14,
    lowerCasedTag: "div",
    start: 0,
    tag: "div"
  }
]
```

然后再调用 `parseHTML` 里 `options` 里面的 `start` 的方法创建 ***AST*** element 同时，在这个方法里解析 `v-pre` `v-for` `v-once` 最终得到 ***AST*** element 例如：

```javascript
{
  attrsList: [
    {
      end: 13,
      name: "id",
      start: 5,
      value: "app"
    }
  ]
  attrsMap: {id: 'app'}
  children: []
  end: 14
  parent: undefined
  rawAttrsMap: {
    id: {
      end: 13,
      name: "id",
      start: 5,
      value: "app"
    }
  }
  start: 0
  tag: "div"
  type: 1
}
```
```javascript
if (!inVPre) {
  processPre(element);
  if (element.pre) {
    inVPre = true;
  }
}
if (platformIsPreTag(element.tag)) {
  inPre = true;
}
if (inVPre) {
  processRawAttrs(element);
} else if (!element.processed) {
  // structural directives
  processFor(element);
  processIf(element);
  processOnce(element);
}
```

然后 `start` 方法里对是否有根节点做个判断

```javascript
// 是否有root的根节点
if (!root) {
  root = element
  {
    checkRootConstraints(root)
  }
}
// 是否为自闭合标签
if (!unary) {
  currentParent = element
  stack.push(element)
} else {
  closeElement(element)
}
```

然后将 ***AST*** 的element push到 `parse` 的 `stack` 内

```javascript
[
  {
    attrsList: [
      {
        end: 13,
        name: "id",
        start: 5,
        value: "app"
      }
    ]
    attrsMap: {id: 'app'}
    children: []
    end: 14
    parent: undefined
    rawAttrsMap: {
      id: {
        end: 13,
        name: "id",
        start: 5,
        value: "app"
      }
    }
    start: 0
    tag: "div"
    type: 1
  }
]
```

## 4. 解析 v-for

通过 `processFor` 方法来处理 `v-for` 然后通过 `processFor` 里的 `getAndRemoteAttr` 方法 得到 `v-for` 属性的值 例如：`item in list` 然后通过循环得到 `v-for` 这个属性在 `attrList` 的位置 然后进行删除 因为这个属性不是 `HTML` 标准的属性 所以要删除掉

```javascript
function processFor (el) {
  var exp;
  if ((exp = getAndRemoveAttr(el, 'v-for'))) {
    var res = parseFor(exp);
    if (res) {
      extend(el, res);
    } else {
      warn$2(
        ("Invalid v-for expression: " + exp),
        el.rawAttrsMap['v-for']
      );
    }
  }
}



function getAndRemoveAttr (
  el,
  name,
  removeFromMap
) {
  // 例如 item in list
  var val
  if ((val = el.attrsMap[name]) != null) {
    var list = el.attrsList
    for (var i = 0, l = list.length; i < l; i++) {
      if (list[i].name === name) {
        list.splice(i, 1)
        break
      }
    }
  }
  if (removeFromMap) {
    delete el.attrsMap[name]
  }
  return val
}



function parseFor (exp) {
  // inMatch ["item in list", "item", "list"]
  var inMatch = exp.match(forAliasRE);
  if (!inMatch) { return }
  var res = {};
  res.for = inMatch[2].trim();
  var alias = inMatch[1].trim().replace(stripParensRE, '');
  var iteratorMatch = alias.match(forIteratorRE);
  if (iteratorMatch) {
    res.alias = alias.replace(forIteratorRE, '').trim();
    res.iterator1 = iteratorMatch[1].trim();
    if (iteratorMatch[2]) {
      res.iterator2 = iteratorMatch[2].trim();
    }
  } else {
    res.alias = alias;
  }
  return res
}
```

然后将得到的值 `item in list` 传给 `parseFor` 这个方法 里面通过正则匹配 得到 **inMatch** ：`["item in list", "item", "list"]` 最终得到一个 `res` 例如：

```javascript
{
  alias: "item",
  for: "list"
}
```

最后通过 `extend` 方法 将这个 `res` 合并到当前的 element 的 ***AST*** 上 最终得到合并好的 ***AST***

```javascript
{
  alias: "item",
  ...
  for: "list",
  parent,
  rawAttrsMap: {
    v-for: {
      end: 87,
      name: "v-for",
      start: 67,
      value: "item in list"
    }
  }
  ...
  type: 1
}
```



## 5. 解析 {{}}

>从解析的当前位置到下一个 `<` 如果 `indexOf('<')` 大于0 说明之间是文本内容


通过 `parseText` 方法最终得到 这样的 res 其中有个 `parseFilters`方法 解析过滤器


```javascript
function parseText (
  text,
  delimiters
) {
  // 有分隔符 得到 过滤器的 正则匹配  否则就是 {{}} 的正则匹配
  var tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE;
  // 如果正则表达是没有匹配到 说明是普通的文本 直接 return
  if (!tagRE.test(text)) {
    return
  }
  var tokens = [];
  var rawTokens = [];
  var lastIndex = tagRE.lastIndex = 0;
  var match, index, tokenValue;
  // {{}} -> ['{{txt}}', 'txt']
  while ((match = tagRE.exec(text))) {
    index = match.index;
    // push text token
    if (index > lastIndex) {
      rawTokens.push(tokenValue = text.slice(lastIndex, index));
      tokens.push(JSON.stringify(tokenValue));
    }
    // tag token
    // 解析过滤器 如果不是 得到原本的 类似 txt
    var exp = parseFilters(match[1].trim());
    // 拼接出 render 函数所需要的 字符串 push 到 token
    tokens.push(("_s(" + exp + ")"));
    rawTokens.push({ '@binding': exp });
    
    // 设置lastIndex 以保证下一轮循环时，只从'}}'后面再开始匹配正则
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    rawTokens.push(tokenValue = text.slice(lastIndex));
    tokens.push(JSON.stringify(tokenValue));
  }
  return {
    expression: tokens.join('+'),
    tokens: rawTokens
  }
}
```

```javascript
{
  expression: "_s(txt)",
  tokens: [
    {
      @binding: "txt"
    }
  ]
}
```

然后推入此时 `currentParent` 的 `children` 里面

```javascript
{
  end: 51,
  expression: "_s(txt)",
  start: 44,
  text: "{{txt}}",
  tokens: [
    {
      @binding: "txt"
    }
  ],
  type: 2
}
```

## 6. 解析 End Tag

如匹配到闭合标签 随后将执行 `parseEndTag` 方法 从后向前循环（先解析的标签先推入栈里当然也会最后闭合） 然后调用 `parseHTML` 里 `optios` 上的 `end` 方法 然后通过 `stack.length -= 1` pop掉 `parse` 方法里的最新解析到的 ***AST*** 元素 最后调用 `closeElement` 方法 里面通过调用 `processElement` 方法 然后通过其里面的 `processKey`, `processRef`, `processSlotContent`, `processSlotOutlet`, `processComponent`, `processAttrs` 方法分别对元素进行 `key`, `Ref`, `slot`, `componnet(:is)`, `Attr` 进行处理 然后将处理好的 ***element*** 进行:

```javascript
currentParent.children.push(element)
element.parent = currentParent
```

```javascript
function parseEndTag (tagName, start, end) {
  var pos, lowerCasedTagName;
  if (start == null) { start = index; }
  if (end == null) { end = index; }

  // Find the closest opened tag of the same type
  // 找到 该 标签 在 parseHTML stack 里的位置
  if (tagName) {
    lowerCasedTagName = tagName.toLowerCase();
    for (pos = stack.length - 1; pos >= 0; pos--) {
      if (stack[pos].lowerCasedTag === lowerCasedTagName) {
        break
      }
    }
  } else {
    // If no tag name is provided, clean shop
    pos = 0;
  }

  if (pos >= 0) {
    // Close all the open elements, up the stack
    for (var i = stack.length - 1; i >= pos; i--) {
      if (i > pos || !tagName &&
        options.warn
      ) {
        options.warn(
          ("tag <" + (stack[i].tag) + "> has no matching end tag."),
          { start: stack[i].start, end: stack[i].end }
        );
      }
      if (options.end) {
        // 调用 传进来的 options 上 end 方法
        options.end(stack[i].tag, start, end);
      }
    }

    // Remove the open elements from the stack
    stack.length = pos;
    lastTag = pos && stack[pos - 1].tag;
  } else if (lowerCasedTagName === 'br') {
    if (options.start) {
      options.start(tagName, [], true, start, end);
    }
  } else if (lowerCasedTagName === 'p') {
    if (options.start) {
      options.start(tagName, [], false, start, end);
    }
    if (options.end) {
      options.end(tagName, start, end);
    }
  }
}

// parse 里面 维护的 end 方法
function end (tag, start, end$1) {
  // 取出最新解析的元素
  var element = stack[stack.length - 1];
  // pop stack
  stack.length -= 1;
  // 意思是 拿到 最新解析的元素的 父元素 ast
  currentParent = stack[stack.length - 1];
  if (options.outputSourceRange) {
    element.end = end$1;
  }
  // 这个方法是对这个元素进行 process 各种解析 最后完全解析好的元素 push到 currentParent 的 children里面 
  // 然后 讲这个元素 parent 属性 设置成 currentParent
  closeElement(element);
},
```

最后也要将 `parseHTML` 的 `stack` 通过 `stack.length = pos` pop掉最新的解析标签