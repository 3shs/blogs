module.exports = {
  themeConfig: {
    search: false,
    searchMaxSuggestions: 10,
    sidebar: [
      {
        title: 'Vue相关知识',
        collapsable: false,
        children: [
          ['vue/', '综述'],
          ['complie/', '模板解析']
        ]
      }
    ]
  }
}