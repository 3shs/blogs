module.exports = {
  title: '一些零碎 | 想起就记录一下',
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
        title: 'Vue相关知识',
        collapsable: false,
        children: [
          ['vue/complie/', '模板解析'],
          ['vue/genRender/', '生成render函数'],
          ['vue/render/', '挂载渲染阶段'],
          ['vue/update/', '更新阶段'],
          ['vue/component/', '组件分析'],
        ]
      },
      {
        title: 'Webpack相关知识',
        collapsable: false,
        children: [
          ['webpack/optimization/', '优化'],
        ]
      },
      {
        title: '性能相关',
        collapsable: false,
        children: [
          ['performance/virtualScroll/', '虚拟滚动'],
          ['performance/cacheApi/', '接口缓存']
        ]
      }
    ]
  }
}