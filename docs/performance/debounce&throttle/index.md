---
title: 防抖与节流
---

## 1. 前言

防抖：就是你尽管触发事件，但是事件一定在n秒后才执行，如果一个事件触发n秒内又触发了这个事件，那就以新的事件的事件为准，n秒后才执行，总之，就是你触发事件n秒内不会触发该事件

```javascript

// eg
var count = 1
var container = document.getElementById('container')
function getUserAction() {
    container.innerHTML = count++
}
container.onmousemove = getUserAction
container.onmousemove = debounce(getUserAction, 1000)


function debounce(func, wait, immediate) {
    var timeout
    return function () {
        // 保存this 解决this指向问题
        var ctx = this
        // 保存事件对象
        var args = arguments
        if (timeout) clearTimeout(timeout)
        if (immediate) {
            var callNow = !timeout
            timeout = setTimeout(function() {
                timeout = null
            }, wait)
            // 如果已经调用就不用调用了
            if (callNow) func.apply(ctx, args)
        } else {
            timeout = setTimeout(function() {
                func.apply(ctx, args)
            }, wait)
        }
    }
}

```

节流：就是你如果持续触发某个事件 每隔一段时间 只执行一次事件

```javascript
// 采用时间戳方式
function throttle(func, wait) {
    var timeout
    var previous = 0
    return function() {
        var now = +new Date()
        var ctx = this
        var args = arguments
        if (now - previous > wait) {
            func.apply(ctx, args)
            previous = now
        }
    }
}

// 采用定时器
function throttle(func, wait) {
    var timeout

    return function() {
        var ctx = this
        var args = arguments
        if (!timeout) {
            timeout = setTimeout(function() {
                timeout = null
                func.apply(ctx, args)
            }, wait)
        }
    }
}
```
但是这两个方式有区别：
* 第一种会立即执行并且触发结束后无法再执行
* 第二种是过n秒后执行且触发结束后还有再执行一次