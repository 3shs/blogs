module.exports = {
  title: '一些零碎 | 想起就记录一下',
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
          ['complie/', '模板解析']
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