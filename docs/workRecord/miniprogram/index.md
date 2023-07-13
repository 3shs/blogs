---
title: uni/小程序相关
---

## 1. canvas drawImage OSS 上的图片

```js
uni.getImageInfo({
  src: 'https://oss.example.com/wechat/map_bg.png',
  success(res) {
    console.log(res.path)
  }
})
```

## 2. canvas 固定点位适配所有机型

```js
scalePosition(x, isX = true) {
    // 每个机型上容器的宽度
    let contentWidth = this.mapContentWidth
    // 每个机型上容器的高度
    let contentHeight = this.mapContentHeight
    // 标准宽 以什么机型为参照
    let standarX
    // 标准高 以什么机型为参照
    let standarY
    // 是否横屏
    if (this.isLandScape) {
        standarX = 523.2
        standarY = 327
    } else {
        standarX = 375
        standarY = 600
    }

    let scaleX
    if (isX) {
        scaleX = (x / standarX) * contentWidth
    } else {
        scaleX = (x / standarY) * contentHeight
    }

    // 得到每个固定点位在不同机型的位置
    return scaleX
}
```

## 3. 画点

```js
/**
 * 最后没用 ctx.scale(1, -1) 沿 X 轴翻转 然后平移到容器底部 这样做的话导致图标都翻转了
 * 最后采用的是
 * 园区的宽度 / canvas容器的宽度 = 后台返回真是的米 / x
 * 当旋转的时候 将 X轴 Y轴互换
 * 
 * if (this.isLandScape) {
        let systemInfo = uni.getSystemInfoSync()
        console.log('systemInfosystemInfosystemInfo', systemInfo)
        let windowHeight = systemInfo.windowHeight - this.customBarHeight - 40
        result.forEach(res => {
            res.x = (res.y * windowHeight) / 41.6
            res.y = (res.x * windowHeight) / 41.6
        })
    } else {
        result.forEach(res => {
            res.x = (res.x * this.screenWidthSystem) / 41.6
            res.y = (res.y * this.screenWidthSystem) / 41.6
        })
    }
 */
draw(points) {
  const self = this
  const ctx = uni.createCanvasContext('myCanvas')

  
  // ctx.scale(self.devicePixelRatio, self.devicePixelRatio)
  const query = uni.createSelectorQuery().in(this)

  const phoneInfo = uni.getStorageSync('phone_info') || {}

  query.selectAll('.map-container').boundingClientRect(rect => {

    // 绘制图标
    if (this.isLandScape) {
        this.placeOfPic(picDataLandScape, ctx)
    } else {
        this.placeOfPic(picData, ctx)
    }
    // if (this.isLandScape) {
    //     ctx.scale(1, -1)
    //     ctx.translate(0, -this.mapContentHeight)  
    // }
    // 绘制点位
    points.forEach(point => {
        const isSelf = phoneInfo.phoneNumber === point.memberPhone

        // 内圈
        ctx.beginPath()
        ctx.arc(this.scalePosition(point.x), this.scalePosition(point.y, false), 6, 0, 2 * Math.PI)  
        ctx.fillStyle = isSelf ? '#ED6066' : '#F08656'
        ctx.fill()
        ctx.closePath()
        // 外圈
        ctx.beginPath()
        ctx.arc(this.scalePosition(point.x), this.scalePosition(point.y, false), 7, 0, 2 * Math.PI)
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.closePath()
        
        

        // 点位图标

        ctx.save()
        ctx.beginPath()
        
        let pointImg = isSelf ? './../static/assets/position/map_me.png' : './../static/assets/position/map_other.png'
        let pointSize = isSelf ? [58, 67] : [44, 50]
        let pointX = isSelf ? 28.5 : 21.5
        let pointY = isSelf ? 64 : 50

        let maxDisY = isSelf ? 56 : 42
        if (this.scalePosition(point.y, false) <= maxDisY) {
            ctx.translate(this.scalePosition(point.x) + pointX, this.scalePosition(point.y, false) + pointY)
            ctx.rotate(180 * Math.PI / 180)
            ctx.drawImage(pointImg, 0, 0, ...pointSize)
        } else {
            ctx.drawImage(
                pointImg, 
                this.scalePosition(point.x) - pointX, 
                this.scalePosition(point.y, false) - pointY,
                ...pointSize
            )
        }
        ctx.closePath()

        ctx.restore()
        
        ctx.save()
        // 人物标识
        ctx.beginPath()
        let avatarSize = isSelf ? [34, 34] : [25, 25]
        let avatarX = isSelf ? 16.5 : 11.5
        let avatarY = isSelf ? 55 : 43
        if (this.scalePosition(point.y, false) <= maxDisY) {

            ctx.drawImage(getAvatar(point.customerType, point.customerSex), 
                this.scalePosition(point.x) - avatarX - 1.2, 
                this.scalePosition(point.y, false) + avatarY / 2.6,
                ...avatarSize
            )
        } else {
            ctx.drawImage(
                getAvatar(point.customerType, point.customerSex), 
                this.scalePosition(point.x) - avatarX, 
                this.scalePosition(point.y, false) - avatarY, 
                ...avatarSize
            )
        }
        ctx.closePath()
        ctx.restore()

    })

    ctx.draw()
  }).exec()

}
```

## 4. login

```js
/**
 * 1. 获取code
 */
uni.login({
  provider: 'weixin',
  success(res) {
    this.code = res.code
  }
})

/**
 * 2. 用这个 code 调用服务器 接口 获取 openId 存入本地缓存
 */

/**
 * 3. 然后使用手机号登录
 */
<button  open-type="getPhoneNumber" @getphonenumber="getPhoneNumber($event)" loadingText="登录中...">
  使用微信手机号登录
</button>

/**
 * 4. 然后通过 e.detail.errmsg 看用户是否允许授权
 * 5. 然后利用这里的 e.detail.code 调取服务器接口 获取手机号
 * 6. 然后将这个 code 和 手机号 以及经纬度 进入最后一步登录 调用服务端接口 获取token
 * 7. 存储 token 跳转页面
 */
```

## 5. 支付

```js
/**
 * 1. 拿到前端需要传递的参数调用服务端接口
 * 2. 后台返回支付需要的签名、时间戳等参数
 * 3. 拿到这些参数调用uni.requestPayment API (代码如下)
 * 4. 因为微信返回的支付成功不够准确 所以我们还要拿 这个订单号 轮询去查后台的接口 看是否成功
 * 5. 我们是一分钟查五次 如果还没成功 我们就拿这个 订单号 去查服务器另一个接口 如果成功了 就是成功了 失败了就是失败了
 */
const QUERY_COUNT = 0
const TIME = 2000
const QUERY_MAX = 5
uni.requestPayment({
    provider: 'wxpay',//支付类型-固定值
    timeStamp: data.timeStamp,// 时间戳（单位：秒）
    nonceStr: data.nonceStr,// 随机字符串
    package: data.packageValue,// 固定值
    signType: data.signType,//固定值
    paySign: data.paySign,//签名
    success: function(res) {
        console.log('success:' + JSON.stringify(res))
        QUERY_COUNT = 0
        uni.showLoading()
        searchOrderStatus(data.orderNo, options.isNopayOrder).then(orderNo => {
            resolve(orderNo)
            uni.hideLoading()
        })
    },
    fail: function(err) {
        if (err.errMsg == 'requestPayment:fail cancel') {
            uni.showToast({
                title: '您已取消支付',
                icon: 'none',
                success() {
                    uni.navigateTo({
                        url: `/ticketPages/myTicketList?orderStatus=0`
                    })
                }
            })
            uni.hideLoading()
        }
    }
})

const searchOrderStatus = (orderNo, isNopayOrder) => {
    let fromPage = isNopayOrder ? 'noPayOrder' : 'buyTickets'
    return new Promise((resolve, reject) => {
        DtpApi.queryOrderStatusIsPayed(orderNo, false).then(res => {
            let { code, data } = res.data
            if (code === 200) {
                if (data) {
                    uni.navigateTo({
                        url: `/paymentPages/success?orderNo=${orderNo}&fromPage=${fromPage}`
                    })
                    resolve(orderNo)
                } else {
                    if (QUERY_COUNT < QUERY_MAX) {
                        ++QUERY_COUNT
                        setTimeout(() => {
                            searchOrderStatus(orderNo)
                        }, TIME)
                    } else {
                        // 1分钟过后直接查询微信小程序的订单接口
                        DtpApi.queryOrderByWm(orderNo, true).then(res => {
                            let { code, data } = res.data
                            if (code == 200) {
                                if (data.tradeState === 'SUCCESS') {
                                    uni.navigateTo({
                                        url: `/paymentPages/success?orderNo=${orderNo}&fromPage=${fromPage}`
                                    })
                                    resolve(orderNo)
                                } else {
                                    uni.navigateTo({
                                        url: '/paymentPages/failed'
                                    })
                                    uni.hideLoading()
                                }
                            } else {
                                uni.navigateTo({
                                    url: '/paymentPages/failed'
                                })
                                uni.hideLoading()
                            }
                        })
                    }
                }
            } else {
                uni.navigateTo({
                    url: '/paymentPages/failed'
                })
                uni.hideLoading()
            }
        })
    })
}
```

## 6. 文件上传到OSS 不需要后端情况

## 7. 利用后端返回的数据绘制多边形

```js
/**
 * 示例代码数据格式 实际的米数
 * [
 *  {
 *      polygonData: "72.10,17.30|72.10,12.80|76.30,12.80|76.20,17.30|72.10,17.30"
 *  },
 * {
 *      polygonData: "76.40,22.20|76.40,18.80|81.80,18.80|81.80,22.20|76.40,22.20"
 * }
 * ]
 */
draw(polygons) {
    const ctx = uni.createCanvasContext('map')
    
    polygons.forEach(polygon => {
        const points = polygon.polygonData.split('|').map(point => {
            const [x, y] = point.split(',')
            return {x, y}
        })

        ctx.beginPath()
        ctx.moveTo(...this.targetPoinit([points[0].y, points[0].x]))
        points.forEach(point => {
            ctx.lineTo(...this.targetPoinit([point.y, point.x])) 
        })

        ctx.closePath()

        // 根据不同的区域绘制不同多边形的填充颜色
        if (polygon.areaName === 'xx' || polygon.areaName === 'yy') {
            ctx.fillStyle = '#FFFAFA'
        } else if (polygon.areaName === 'zz') {
            ctx.fillStyle = '#DFECFF'
        } else if (polygon.areaName === 'vv') {
            ctx.fillStyle = '#E8F3E4'
        } else {
            ctx.fillStyle = '#FDEBEB'
        }
        ctx.fill()

    })
    
    ctx.draw()

},
/**
 * 41.6 实际的米数 370屏幕的宽度
 * 100 实际的米数 700屏幕的高度
 */
targetPoinit([x, y]) {
    return [
        (x * 370) / 41.6,
        (y * 700) / 100
    ]
},
```