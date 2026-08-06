import { defineConfig } from 'vitepress'
import { katex } from '@mdit/plugin-katex'
import { SITE, normalizeBase } from './site'
import { orderedArticleLinks, sidebar } from './sidebar'

export default defineConfig({
  lang: 'zh-CN',
  title: SITE.title,
  titleTemplate: `:title | ${SITE.title}`,
  description: SITE.description,
  base: normalizeBase(process.env.VITEPRESS_BASE),
  lastUpdated: true,
  cleanUrls: true,
  srcExclude: ['README.md', 'docs/**'],
  markdown: {
    lineNumbers: true,
    config(md) {
      md.use(katex, { delimiters: 'dollars' })
    }
  },
  transformPageData(pageData) {
    const currentPath = `/${pageData.relativePath.replace(/\.md$/, '')}`
    const currentIndex = orderedArticleLinks.findIndex((article) => article.link === currentPath)

    if (currentIndex === -1) return

    const toNavItem = (article: (typeof orderedArticleLinks)[number] | undefined) => article && ({
      text: article.title,
      link: article.link
    })

    pageData.frontmatter.prev = toNavItem(orderedArticleLinks[currentIndex - 1]) ?? false
    pageData.frontmatter.next = toNavItem(orderedArticleLinks[currentIndex + 1]) ?? false
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '笔记', link: '/notes' },
      { text: '关于', link: '/about' },
      { text: 'GitHub', link: SITE.github }
    ],
    sidebar,
    outline: { level: 'deep', label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新于' },
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '外观',
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
              modal: {
                displayDetails: '显示详细列表',
                resetButtonTitle: '重置搜索',
                backButtonTitle: '关闭搜索',
                noResultsText: '没有找到相关结果',
                footer: {
                  selectText: '选择', selectKeyAriaLabel: '回车',
                  navigateText: '切换', navigateUpKeyAriaLabel: '上箭头',
                  navigateDownKeyAriaLabel: '下箭头',
                  closeText: '关闭', closeKeyAriaLabel: 'Esc'
                }
              }
            }
          }
        }
      }
    },
    socialLinks: [{ icon: 'github', link: SITE.github }],
    footer: {
      message: '仅供学习使用',
      copyright: 'Copyright © 2026 shuming-wang'
    }
  }
})
