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
        label="对象" 
        :prop="`pushList.${index}.obj`"
        :rules="{ required: true, message: '对象不能为空', trigger: 'change' }">
        <el-radio-group 
            v-model="ele.obj">
            <el-radio :label="1">对象1</el-radio>
            <el-radio :label="0">对象2</el-radio>
        </el-radio-group> 
    </el-form-item>
</div>
```

## 2. el-input 限制数字、字数

```html
<el-input
    :maxLength="3"
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

## 4. vue/cli@4.x 编写一个loader

```js
/**
 * 生产环境去除 console.log
 * 
 * src/loader/clearConsole
 */

module.exports = function (source) {
  return source.replace(/console\.log\(.*\);?/g, '')
}

config.when(process.env.NODE_ENV !== 'development', config => {
  config.module
    .rule('clear-console-js')
    .test(/\.js$/)
    .exclude
      .add(path.resolve(__dirname, 'node_modules'))
      .end()
    .use('clear-console-js')
    .loader('./src/loader/clearConsole')
    .end()


    config.module
    .rule('clear-console-vue')
    .test(/\.vue$/)
    .exclude
      .add(path.resolve(__dirname, 'node_modules'))
      .end()
    .use('clear-console-vue')
    .loader('./src/loader/clearConsole')
    .end()
})
```

## 5. 前端发布/本地脚本

- 因为需要一次性发布到三个服务器 每次finalshell拖上去很麻烦 所以编写一个脚本
- 前提需要安装一个 zx `npm install -g zx` 方便 windows 使用 linux 可以忽略
- package.json 配置 ` "type": "module" ` 更友好的使用 zx
- .js 改成 .mjs
```js
// build.js
#! /usr/bin/env zx

cd('./../project')
await $`npm run build:prod`
await $`tar zcvf dist.tar.gz dist`
```
```js
import { exec } from 'node:child_process'
import { Client } from 'ssh2'
const pro = exec('zx ./build.mjs', {}, (err, stdout, stderr) => {})
pro.stdout.pipe(process.stdout)
// 多服务器发布需要定义一个数组 单个服务器直接在 connect() 里面写就好了
const services = [
    {
        host: 'host1',
        password: 'password1'
    },
    {
        host: 'host2',
        password: 'password2'
    },
    {
        host: 'host3',
        password: 'password3'
    },
]
pro.on('exit', () => {
    for (let i = 0; i < services.length; i++) {
        const service = services[i]
        link(service)
    }
})
function link({ host, password }) {
    const client = new Client()
    client.on('ready', () => {
        client.sftp((err, sftp) => {
          /**
           * 第一个参数 本地目录
           * 第二个参数 服务器目录
           */
            sftp.fastPut('./../project/dist.tar.gz', '/home/xiaohuanghua/html/dist.tar.gz', {}, (err, result) => {
                finish(client)
            })
        })
    }).connect({
        host,
        port: '22',
        username: 'root',
        password
    })
}
/**
 * 上传过后 进入目标服务器
 * 解压 删除压缩包
 * 移动dist文件夹到目标目录
 */
function finish(client) {
    client.shell((err, stream) => {
        stream.end(`
            cd /home/xiaohuanghua/html
            tar zxvf dist.tar.gz
            rm -rf dist.tar.gz
            rm -rf front/*
            mv dist/* /home/xiaohuanghua/html/front
            rm -rf dist/
            exit
        `).on('data', data => {
            console.log('data', data.toString())
        }).on('close', () => {
            client.end()
            console.log('link-close')
        })
    })
}
```
