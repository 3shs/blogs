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
          ['complie/', '模板解析'],
          ['genRender/', '生成render函数'],
          ['render/', '挂载渲染阶段'],
        ]
      },
      {
        title: 'Webpack相关知识',
        collapsable: false,
        children: [

        ]
      }
    ]
  }
}