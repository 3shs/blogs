---
title: vue相关
---

## 1. el-form-item 循环校验

```html
<!-- 参考 elementui 动态增减表单项 -->
<div 
    class="msg-card-container"
    v-for="(ele, index) in form.pushList"
    :key="index">
    <div class="msg-card"></div>
    <el-form-item 
        label="推送对象" 
        :prop="`pushList.${index}.receiveObj`"
        :rules="{ required: true, message: '推送对象不能为空', trigger: 'change' }">
        <el-radio-group 
            v-model="ele.receiveObj">
            <el-radio :label="1">客户</el-radio>
            <el-radio :label="0">员工</el-radio>
        </el-radio-group> 
    </el-form-item>
</div>
```

## 2. el-input 限制数字、字数

```html
<el-input
    :maxLength=3
    oninput="value=value.replace(/^0|[^\d]/g,'')">
</el-input>
```

## 3. Array: object 去重

```js
/**
 * 1. 可以以利用 Map 来去重
 * 2. 可以利用 Object{} 属性不能重复来去重
 */
const removeDuplicates = (firstArr: arr, secondArr: arr, generateKey: function) => {
  if (firstArr.length <= 1 && secondArr.length <= 1) {
    return firstArr.concat(secondArr)
  }

  const combinedArray = firstArr.concat(secondArr)

//   let res = {}

  const uniqueMap = new Map()

  combinedArray.forEach(area => {
    const key = generateKey(area)
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, area)
    }
  })

  const uniqueArray = Array.from(uniqueMap.values())

//   combinedArray.forEach(c => {
//     const key = generateKey(c)
//     res[key] = c
//   })

//   const uniqueArray = Object.values(res)


  return uniqueArray
}
```