module.exports = {
  title: '一些零碎',
  markdown: {
    lineNumbers: true
  },
  head: [
    ['link', { rel: 'icon', href: '/logo.png' }]
  ],
  themeConfig: {
    search: false,
    editLinks: true,
    searchMaxSuggestions: 10,
    sidebar: [
      {
        title: 'JavaScript相关知识',
        collapsable: false,
        children: [
          ['javascript/promise/', 'Promise'],
        ]
      },
      {
        title: 'Vue相关知识',
        collapsable: false,
        children: [
          ['vue/complie/', '模板解析'],
          ['vue/genRender/', '生成render函数'],
          ['vue/render/', '挂载渲染阶段'],
          ['vue/update/', '更新阶段'],
          ['vue/component/', '组件分析'],
          ['vue/lifeCycle/', '生命周期'],
        ]
      },
      {
        title: 'Webpack相关知识',
        collapsable: false,
        children: [
          ['webpack/entry/', '入口'],
          ['webpack/optimization/', '优化'],
        ]
      },
      {
        title: '网络相关知识',
        collapsable: false,
        children: [
          ['net/http&https/', 'http&https'],
          ['net/https/', 'https'],
        ]
      },
      {
        title: '性能相关',
        collapsable: false,
        children: [
          ['performance/virtualScroll/', '虚拟滚动'],
          ['performance/cacheApi/', '接口缓存'],
          ['performance/debounce&throttle/', '防抖与节流'],
        ]
      },
      {
        title: '问题记录',
        collapsable: false,
        children: [
          ['workRecord/vue/', 'vue相关'],
          ['workRecord/miniprogram/', '小程序相关']
        ]
      }
    ]
  }
}