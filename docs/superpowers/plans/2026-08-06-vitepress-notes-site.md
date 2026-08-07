# VitePress 在线笔记站实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将仓库中 30 篇 Python、LangChain 与 LangGraph Markdown 笔记建设为支持中文搜索、Mermaid、KaTeX 和 GitHub Pages 自动部署的现代中文文档站。

**Architecture:** 以仓库根目录作为 VitePress 内容根，保留三组笔记与图片的现有路径。Node.js 脚本负责内容扫描、侧边栏生成、图片校验和独立交互页发布；VitePress 配置与扩展默认主题负责路由、搜索、Markdown 增强和视觉表现。

**Tech Stack:** Node.js 20+、npm、VitePress 1.6.x、TypeScript、Vue 3、Markdown-it、Mermaid 11、KaTeX、`@mdit/plugin-katex`、Node.js 内置测试运行器、GitHub Actions、GitHub Pages。

## Global Constraints

- 必须兼容 Node.js 20 或更新版本，并使用 npm。
- 原始 Markdown 和图片保留当前位置；不得批量改写内容或强制添加 Frontmatter。
- 当前 30 篇 Markdown 与 401 处本地图片引用必须全部可访问。
- 标题优先级固定为 Frontmatter `title`、首个一级标题、文件名。
- 排序优先级固定为 Frontmatter `order`、文件名前导数字、文件名中文自然排序。
- 站点名称固定为 `Yook's Notes`，副标题固定为“记录学习、研究与思考”，集中定义后允许修改。
- GitHub 地址固定为 `https://github.com/wang844314728/My-study-materials`，集中定义后允许修改。
- 本地 `base` 默认 `/`；GitHub Pages 项目站通过 `VITEPRESS_BASE=/My-study-materials/` 注入。
- 使用 VitePress 内置本地搜索，不部署搜索服务或接入收费搜索。
- 视觉采用克制的编辑化文档风格；禁止大面积渐变、玻璃拟态、发光光斑、营销式大动画和装饰性 AI 图标堆叠。
- 只引入职责明确的 VitePress、Markdown-it、Mermaid、KaTeX 相关依赖；测试运行器使用 Node.js 标准库。
- 原始 `LangGraph/langgraph-runtime-viz/index.html` 保持不动，发布副本不得请求远程字体。
- 每个任务只暂存列出的文件，避免误提交工作区中的无关用户改动。

## 文件职责

- `package.json`：npm 元数据、依赖与统一命令入口。
- `package-lock.json`：锁定可复现依赖。
- `.vitepress/site.ts`：站点名称、副标题、GitHub 地址、分类元数据。
- `.vitepress/config.mts`：VitePress、导航、搜索、Markdown 和 Pages 基础路径配置。
- `.vitepress/sidebar.ts`：由脚本生成的侧边栏、文章顺序和分类摘要。
- `.vitepress/theme/index.ts`：扩展默认主题、注册首页和 Mermaid 组件、加载样式。
- `.vitepress/theme/components/HomePage.vue`：内容驱动的定制首页。
- `.vitepress/theme/components/MermaidDiagram.vue`：仅在客户端渲染 Mermaid，隔离错误并响应主题变化。
- `.vitepress/theme/custom.css`：全站编辑化视觉、中文排版、响应式与深色样式。
- `scripts/lib/content.mjs`：内容扫描、标题解析、排序、路由和图片引用校验的纯函数。
- `scripts/generate-sidebar.mjs`：生成 `.vitepress/sidebar.ts`。
- `scripts/validate-content.mjs`：验证 Markdown 数量、图片引用、关键入口与生成数据。
- `scripts/copy-runtime-viz.mjs`：从原始交互 HTML 生成无远程字体的 `public/langgraph-runtime-viz/index.html`。
- `tests/content.test.mjs`：内容生成和资源校验单元测试。
- `tests/markdown.test.mjs`：KaTeX 与 Mermaid 围栏转换测试。
- `tests/runtime-viz.test.mjs`：交互页复制、远程字体移除和返回链接测试。
- `index.md`、`notes.md`、`about.md`、`markdown-guide.md`：首页入口、笔记总览、关于页和 Markdown 能力示例页。
- `python/index.md`、`LangChain_1.2/index.md`、`LangGraph/index.md`：三个分类首页。
- `.github/workflows/deploy.yml`：GitHub Pages 构建和部署。
- `README.md`：中文维护与部署说明。

---

### Task 1: 固化现有内容基线

**Files:**
- Add: `python/**`
- Add: `LangChain_1.2/assets/**`
- Add: `LangGraph/assets/**`
- Add: `LangGraph/langgraph-runtime-viz/index.html`

**Interfaces:**
- Consumes: 用户已补充到工作区的原始笔记、图片和独立 HTML。
- Produces: 后续扫描器可依赖的 30 篇 Markdown、401 处有效本地图片引用和一个交互 HTML 源文件。

- [ ] **Step 1: 记录内容基线**

Run:

```bash
find python LangChain_1.2 LangGraph -type f -name '*.md' | wc -l
find python LangChain_1.2 LangGraph -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.gif' -o -name '*.svg' -o -name '*.webp' \) | wc -l
test -f LangGraph/langgraph-runtime-viz/index.html
```

Expected: Markdown 数量为 `30`，图片数量大于或等于 `401` 个引用所需的唯一资源数，HTML 检查退出码为 `0`。

- [ ] **Step 2: 检查暂存范围**

Run:

```bash
git status --short
git check-ignore .DS_Store LangGraph/.DS_Store
```

Expected: 只看到用户新增的内容目录和计划文件；两个 `.DS_Store` 均被忽略。

- [ ] **Step 3: 提交内容基线**

```bash
git add python LangChain_1.2/assets LangGraph/assets LangGraph/langgraph-runtime-viz
git diff --cached --check
git commit -m "content: add note assets and Python materials"
```

### Task 2: 用测试驱动实现内容扫描与侧边栏生成

**Files:**
- Create: `tests/content.test.mjs`
- Create: `scripts/lib/content.mjs`
- Create: `scripts/generate-sidebar.mjs`
- Create: `scripts/validate-content.mjs`
- Create: `.vitepress/sidebar.ts`

**Interfaces:**
- Consumes: `scanContent(rootDir, category)` 的目录路径与 `{ key, text, path, description }` 分类配置。
- Produces: `parseFrontmatter(source) -> Record<string, string | number | boolean>`、`extractTitle(source, filePath) -> string`、`toRoute(relativePath) -> string`、`scanContent(rootDir, category) -> ContentEntry[]`、`validateLocalAssets(entries) -> MissingAsset[]`；生成文件导出 `sidebar`、`categorySummaries`、`orderedArticleLinks`。

- [ ] **Step 1: 写标题、排序、Unicode 路由和资源校验的失败测试**

Create `tests/content.test.mjs` with fixture directories made through `mkdtemp`:

```js
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  extractTitle,
  parseFrontmatter,
  scanContent,
  toRoute,
  validateLocalAssets
} from '../scripts/lib/content.mjs'

test('title priority is frontmatter, H1, filename', () => {
  assert.equal(extractTitle('---\ntitle: 显式标题\n---\n# 一级标题', '01-file.md'), '显式标题')
  assert.equal(extractTitle('# 一级标题', '02-file.md'), '一级标题')
  assert.equal(extractTitle('正文', '03-文件名称.md'), '文件名称')
})

test('frontmatter order overrides numeric filename and index sorts first', async () => {
  const root = await mkdtemp(join(tmpdir(), 'notes-content-'))
  await writeFile(join(root, 'index.md'), '# 分类首页')
  await writeFile(join(root, '01-first.md'), '# 数字第一')
  await writeFile(join(root, '99-override.md'), '---\norder: 0\n---\n# 显式最前')
  const entries = await scanContent(root, { key: 'demo', text: '示例', path: '/demo/' })
  assert.deepEqual(entries.map(({ title }) => title), ['分类首页', '显式最前', '数字第一'])
})

test('unicode filenames produce stable readable routes', () => {
  assert.equal(toRoute('LangGraph/01-LangGraph基础入门.md'), '/LangGraph/01-LangGraph基础入门')
})

test('asset validation reports source markdown and missing path', async () => {
  const root = await mkdtemp(join(tmpdir(), 'notes-assets-'))
  await mkdir(join(root, 'assets'))
  await writeFile(join(root, 'note.md'), '# Note\n![ok](assets/ok.png)\n![bad](assets/missing.png)')
  await writeFile(join(root, 'assets/ok.png'), '')
  const entries = await scanContent(root, { key: 'demo', text: '示例', path: '/demo/' })
  assert.deepEqual(validateLocalAssets(entries).map(({ reference }) => reference), ['assets/missing.png'])
})
```

- [ ] **Step 2: 运行测试并确认因模块缺失而失败**

Run: `node --test tests/content.test.mjs`

Expected: FAIL，错误包含 `ERR_MODULE_NOT_FOUND` 和 `scripts/lib/content.mjs`。

- [ ] **Step 3: 实现内容纯函数**

Create `scripts/lib/content.mjs` with these exact data fields and exported signatures:

```js
export const CONTENT_CATEGORIES = [
  { key: 'python', text: 'Python', path: '/python/', description: '从基础语法到并发编程' },
  { key: 'langchain', text: 'LangChain 1.2', path: '/LangChain_1.2/', description: '模型、工具、智能体与 RAG' },
  { key: 'langgraph', text: 'LangGraph', path: '/LangGraph/', description: '有状态工作流与智能体运行时' }
]

// ContentEntry fields:
// categoryKey, filePath, relativePath, route, title,
// order: number | null, numericPrefix: number | null,
// isIndex: boolean, source: string
```

The module must export these concrete functions: `parseFrontmatter(source)`、`extractTitle(source, filePath)`、`toRoute(relativePath)`、`scanContent(rootDir, category)`、`validateLocalAssets(entries)` and `buildSidebar(entriesByCategory)`.

Implementation details required in the function bodies:

- `parseFrontmatter` only treats a `---` block at byte zero as Frontmatter;
- H1 matching uses `/^#\s+(.+)$/m` and strips trailing heading hashes;
- filename formatting removes a leading `NN-`, converts `_` and `-` to spaces, and preserves Chinese;
- index is always first; after that, finite `order`, numeric prefix, and `Intl.Collator('zh-CN', { numeric: true })` are compared in that order;
- traversal skips dot-prefixed names, `assets`, `node_modules`, `dist`, `.vitepress`, and `langgraph-runtime-viz`;
- image parsing accepts Markdown image destinations with percent-encoded Chinese characters, ignores `http:`, `https:`, `data:` and root-absolute paths, and removes optional quoted titles before filesystem resolution.

- [ ] **Step 4: 运行测试并修正到通过**

Run: `node --test tests/content.test.mjs`

Expected: PASS，`4` 个测试全部通过。

- [ ] **Step 5: 实现稳定生成器和仓库校验命令**

Create `scripts/generate-sidebar.mjs` to scan from `process.cwd()`, build data, and atomically write `.vitepress/sidebar.ts` only when content changes. Generated exports must be named `sidebar`（typed as `DefaultTheme.Sidebar`）、`categorySummaries`（readonly entries containing `key`, `text`, `path`, `description`, `count`, `firstArticle`）and `orderedArticleLinks`（readonly entries containing `title`, `link`, `categoryKey`）.

Create `scripts/validate-content.mjs` with hard failures for lesson count other than `30`, local image reference count other than `401`, missing image references, duplicate routes, and absent runtime source HTML. When invoked with `--require-pages`, additionally require `index.md`、`notes.md`、`about.md`、`markdown-guide.md` and all three category `index.md` files. Diagnostics must include the offending file path or route. Lesson and image counts exclude generated category indexes and root site pages.

- [ ] **Step 6: 生成数据并验证仓库真实内容**

Run:

```bash
node scripts/generate-sidebar.mjs
node scripts/validate-content.mjs
node scripts/generate-sidebar.mjs
git diff --exit-code -- .vitepress/sidebar.ts
```

Expected: 校验报告包含 `30 lesson Markdown files`、`401 local image references`、`0 missing`；第二次生成不产生差异。

- [ ] **Step 7: 提交内容工具**

```bash
git add tests/content.test.mjs scripts/lib/content.mjs scripts/generate-sidebar.mjs scripts/validate-content.mjs .vitepress/sidebar.ts
git diff --cached --check
git commit -m "feat: generate navigation from note structure"
```

### Task 3: 建立 VitePress 工程与集中配置

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `.vitepress/site.ts`
- Create: `.vitepress/config.mts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Task 2 的 `sidebar` 与 `orderedArticleLinks`。
- Produces: `SITE` 常量、VitePress 构建入口和 `docs:*` npm 命令；后续主题与页面从 `SITE` 读取品牌文案。

- [ ] **Step 1: 创建最小 package manifest**

Create `package.json`:

```json
{
  "name": "yooks-notes",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "test": "node --test tests/*.test.mjs",
    "docs:generate": "node scripts/generate-sidebar.mjs",
    "docs:validate": "node scripts/validate-content.mjs --require-pages",
    "docs:dev": "npm run docs:generate && vitepress dev .",
    "docs:build": "npm run docs:generate && npm run docs:validate && vitepress build .",
    "docs:preview": "vitepress preview ."
  }
}
```

- [ ] **Step 2: 安装职责明确的依赖**

Run:

```bash
npm install -D vitepress@^1.6.4 markdown-it
npm install mermaid@^11 katex@^0.16 @mdit/plugin-katex
```

Expected: `package-lock.json` 创建成功，`npm ls --depth=0` 只列出上述五个直接依赖。

- [ ] **Step 3: 定义唯一站点元数据**

Create `.vitepress/site.ts`:

```ts
export const SITE = {
  title: "Yook's Notes",
  description: '记录学习、研究与思考',
  github: 'https://github.com/wang844314728/My-study-materials',
  repository: 'My-study-materials'
} as const

export function normalizeBase(value = '/') {
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}
```

- [ ] **Step 4: 创建 TypeScript VitePress 配置**

Create `.vitepress/config.mts` using `defineConfig`, `SITE`, `normalizeBase`, `sidebar`, `orderedArticleLinks`, and the KaTeX plugin. Required settings:

```ts
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
    socialLinks: [{ icon: 'github', link: SITE.github }]
  }
})
```

Use the complete translation object shown above. Configure `themeConfig.footer` with the learning-use copyright note already present in the source repository.

- [ ] **Step 5: 更新忽略规则并验证配置加载**

Append to `.gitignore`:

```gitignore
node_modules/
.vitepress/cache/
.vitepress/dist/
public/langgraph-runtime-viz/
```

Run `npx vitepress --help` and confirm the command exits `0`; the authoritative TypeScript config validation is the production build in Task 5.

- [ ] **Step 6: 提交工程骨架**

```bash
git add package.json package-lock.json .gitignore .vitepress/site.ts .vitepress/config.mts
git diff --cached --check
git commit -m "build: configure VitePress project"
```

### Task 4: 创建真实内容驱动的站点页面

**Files:**
- Create: `index.md`
- Create: `notes.md`
- Create: `about.md`
- Create: `markdown-guide.md`
- Create: `python/index.md`
- Create: `LangChain_1.2/index.md`
- Create: `LangGraph/index.md`
- Create: `.vitepress/theme/components/HomePage.vue`
- Modify: `.vitepress/sidebar.ts` (regenerate)

**Interfaces:**
- Consumes: `SITE`、`categorySummaries` 和 `orderedArticleLinks`。
- Produces: 首页、总览、关于、Markdown 能力示例和三个分类入口；Task 5 的主题入口注册 `HomePage`。

- [ ] **Step 1: 创建七个入口 Markdown 页面**

Use page frontmatter deliberately rather than adding it to existing lessons:

```md
---
layout: page
title: 首页
sidebar: false
outline: false
---

<HomePage />
```

`notes.md` must list Python、LangChain 1.2、LangGraph with direct category links. Use these category descriptions verbatim: Python “从语言基础、数据容器和面向对象，逐步学习文件、线程、进程与协程”；LangChain “围绕模型、消息、工具、智能体、记忆与 RAG 整理 LangChain 1.2”；LangGraph “学习状态图、控制流、持久化、中断、部署与高级运行时能力”。Each category `index.md` must contain one H1 and a link to its first chapter. `LangGraph/index.md` must also link to `/langgraph-runtime-viz/`. `markdown-guide.md` must contain one Mermaid flowchart, inline `$E = mc^2$`, one block formula, a task list, a table, an image example using an existing repository asset, and a blockquote; `about.md` links to this page as“Markdown 能力示例”。

- [ ] **Step 2: 实现内容驱动首页组件**

Create `.vitepress/theme/components/HomePage.vue` with:

```vue
<script lang="ts">
let mermaidInitialized = false
</script>

<script setup lang="ts">
import { withBase } from 'vitepress'
import { SITE } from '../../site'
import { categorySummaries, orderedArticleLinks } from '../../sidebar'

const recommended = orderedArticleLinks.filter(({ link }) => !link.endsWith('/')).slice(0, 4)
</script>

<template>
  <main class="notes-home">
    <header class="notes-home__intro">
      <p class="notes-home__eyebrow">LEARNING NOTEBOOK · 2026</p>
      <h1>{{ SITE.title }}</h1>
      <p>{{ SITE.description }}</p>
      <div class="notes-home__actions">
        <a class="notes-button notes-button--primary" :href="withBase('/notes')">开始阅读</a>
        <a class="notes-button" :href="SITE.github">查看 GitHub</a>
      </div>
    </header>
    <section aria-labelledby="categories-title">
      <h2 id="categories-title">学习路径</h2>
      <div class="notes-category-grid">
        <a v-for="(category, index) in categorySummaries" :key="category.key"
           class="notes-category" :href="withBase(category.path)">
          <span>0{{ index + 1 }}</span><h3>{{ category.text }}</h3>
          <p>{{ category.description }}</p><small>{{ category.count }} 篇笔记</small>
        </a>
      </div>
    </section>
    <section aria-labelledby="reading-title">
      <h2 id="reading-title">推荐阅读</h2>
      <ol class="notes-reading-list">
        <li v-for="item in recommended" :key="item.link">
          <a :href="withBase(item.link)">{{ item.title }}</a>
        </li>
      </ol>
    </section>
  </main>
</template>
```

Add a final three-item characteristics section using factual copy: “本地全文搜索”“按章节组织”“随笔记持续更新”。Do not add decorative icons or claims not supported by the repository.

- [ ] **Step 3: 重新生成导航并验证入口**

Run:

```bash
node scripts/generate-sidebar.mjs
node scripts/validate-content.mjs --require-pages
rg -n "Python|LangChain 1.2|LangGraph" notes.md .vitepress/sidebar.ts
```

Expected: scanner still reports exactly `30` lesson Markdown files; category index pages are excluded from that lesson count but included as group links.

- [ ] **Step 4: 提交内容入口**

```bash
git add index.md notes.md about.md markdown-guide.md python/index.md LangChain_1.2/index.md LangGraph/index.md .vitepress/theme/components/HomePage.vue .vitepress/sidebar.ts
git diff --cached --check
git commit -m "feat: add note landing pages"
```

### Task 5: 扩展默认主题并实现非模板化视觉

**Files:**
- Create: `.vitepress/theme/index.ts`
- Create: `.vitepress/theme/custom.css`
- Modify only for the verified build compatibility fix: `LangChain_1.2/10-RAG.md`

**Interfaces:**
- Consumes: `HomePage.vue`，后续注册 `MermaidDiagram.vue`。
- Produces: VitePress `Theme` 导出、系统字体栈、统一颜色与排版 tokens、首页和文档页响应式样式。

- [ ] **Step 1: 修复已复现的 Vue Markdown 标签解析错误**

Use the existing `npm run docs:build` failure as RED evidence: Vue reports an unclosed element because prose at `LangChain_1.2/10-RAG.md:2142` contains raw `<h1>` and `<h2>` examples. Change only that sentence so the two examples are inline code: `` `<h1>` `` and `` `<h2>` ``. Do not change the fenced HTML example below it. Re-run `npm run docs:build`; after this one-line fix, any later failure must be recorded separately and fixed only when it is another verified Markdown compatibility issue.

- [ ] **Step 2: 创建主题入口**

Create `.vitepress/theme/index.ts`:

```ts
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import 'katex/dist/katex.min.css'
import HomePage from './components/HomePage.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
  }
} satisfies Theme
```

- [ ] **Step 3: 定义克制的视觉 tokens**

Start `.vitepress/theme/custom.css` with fixed system fonts and one warm-copper accent:

```css
:root {
  --vp-font-family-base: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  --vp-font-family-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  --vp-c-brand-1: #9a5a2a;
  --vp-c-brand-2: #7f4822;
  --vp-c-brand-3: #6c3d1d;
  --vp-c-bg: #fbfaf7;
  --vp-c-bg-soft: #f4f1eb;
  --vp-c-divider: #ded9d0;
  --vp-layout-max-width: 1520px;
  --vp-sidebar-width: 286px;
}

.dark {
  --vp-c-brand-1: #d69a68;
  --vp-c-brand-2: #e2ad82;
  --vp-c-bg: #171716;
  --vp-c-bg-soft: #20201e;
  --vp-c-divider: #363530;
}
```

- [ ] **Step 4: 实现首页、正文、媒体和移动端样式**

Add focused selectors for `.notes-home`, `.notes-category-grid`, `.notes-category`, `.notes-reading-list`, `.vp-doc`, `.vp-doc table`, `.vp-doc img`, `.vp-doc blockquote`, `.vp-doc div[class*='language-']`, `.mermaid-shell`, and `@media (max-width: 768px)`.

Required measurable rules:

```css
.notes-home { max-width: 1120px; margin: 0 auto; padding: 88px 32px 96px; }
.notes-home__intro { max-width: 720px; margin-bottom: 72px; }
.notes-home__intro h1 { font-size: clamp(3rem, 8vw, 6.5rem); letter-spacing: -.055em; line-height: .92; }
.notes-category-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid var(--vp-c-divider); }
.notes-category { min-width: 0; padding: 28px 24px 32px 0; border-bottom: 1px solid var(--vp-c-divider); color: inherit; }
.vp-doc img { display: block; max-width: 100%; height: auto; margin-inline: auto; }
.vp-doc table { display: block; width: 100%; overflow-x: auto; }
@media (max-width: 768px) {
  .notes-home { padding: 48px 20px 64px; }
  .notes-category-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; }
}
```

Do not add gradients, backdrop filters, looping keyframes, blur blobs, emoji icons, or shadows stronger than `0 8px 24px rgb(0 0 0 / 8%)`.

- [ ] **Step 5: 运行构建级样式检查**

Run:

```bash
rg -n "gradient|backdrop-filter|@keyframes|drop-shadow" .vitepress/theme/custom.css
npm run docs:build
```

Expected: first command has no matches; build exits `0`.

- [ ] **Step 6: 提交主题基础**

```bash
git add .vitepress/theme/index.ts .vitepress/theme/custom.css LangChain_1.2/10-RAG.md
git diff --cached --check
git commit -m "feat: add editorial documentation theme"
```

### Task 6: 用测试驱动接入 Mermaid 与 KaTeX

**Files:**
- Create: `tests/markdown.test.mjs`
- Create: `.vitepress/markdown.mjs`
- Create: `.vitepress/theme/components/MermaidDiagram.vue`
- Modify: `.vitepress/config.mts`
- Modify: `.vitepress/theme/index.ts`
- Modify: `.vitepress/theme/custom.css`

**Interfaces:**
- Consumes: Markdown-it fence tokens、KaTeX `$...$`/`$$...$$`、VitePress `isDark`。
- Produces: `configureMarkdown(md) -> void`、全局 `<MermaidDiagram code="encoded-source" />`、主题响应式 SVG 或隔离错误状态。

- [ ] **Step 1: 写 Markdown 转换失败测试**

Create `tests/markdown.test.mjs`:

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import MarkdownIt from 'markdown-it'
import { configureMarkdown } from '../.vitepress/markdown.mjs'

test('renders dollar math with KaTeX', () => {
  const md = new MarkdownIt()
  configureMarkdown(md)
  assert.match(md.render('公式：$E = mc^2$'), /class="katex"/)
})

test('turns mermaid fences into encoded components', () => {
  const md = new MarkdownIt()
  configureMarkdown(md)
  const html = md.render('```mermaid\ngraph TD\n  A --> B\n```')
  assert.match(html, /<MermaidDiagram code="graph%20TD/)
  assert.doesNotMatch(html, /language-mermaid/)
})
```

- [ ] **Step 2: 运行测试并确认模块缺失失败**

Run: `node --test tests/markdown.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `.vitepress/markdown.mjs`.

- [ ] **Step 3: 实现 Markdown 配置函数**

Create `.vitepress/markdown.mjs`:

```js
import { katex } from '@mdit/plugin-katex'

export function configureMarkdown(md) {
  md.use(katex, { delimiters: 'dollars' })
  const defaultFence = md.renderer.rules.fence.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, index, options, env, self) => {
    const token = tokens[index]
    if (token.info.trim() !== 'mermaid') return defaultFence(tokens, index, options, env, self)
    return `<MermaidDiagram code="${md.utils.escapeHtml(encodeURIComponent(token.content))}" />`
  }
}
```

Update `.vitepress/config.mts` to call `configureMarkdown(md)` rather than registering KaTeX inline.

- [ ] **Step 4: 实现 SSR 安全、主题响应式 Mermaid 组件**

Create `.vitepress/theme/components/MermaidDiagram.vue` with these behaviors:

```vue
<script setup lang="ts">
import { inBrowser, useData } from 'vitepress'
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{ code: string }>()
const { isDark } = useData()
const container = ref<HTMLElement>()
const error = ref('')
let renderVersion = 0

watch([() => props.code, isDark], async () => {
  if (!inBrowser) return
  const current = ++renderVersion
  error.value = ''
  await nextTick()
  try {
    const { default: mermaid } = await import('mermaid')
    if (!mermaidInitialized) {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true })
      mermaidInitialized = true
    }
    const source = `---\nconfig:\n  theme: ${isDark.value ? 'dark' : 'neutral'}\n---\n${decodeURIComponent(props.code)}`
    const { svg, bindFunctions } = await mermaid.render(`mermaid-${crypto.randomUUID()}`, source)
    if (current !== renderVersion || !container.value) return
    container.value.innerHTML = svg
    bindFunctions?.(container.value)
  } catch (cause) {
    if (current === renderVersion) error.value = cause instanceof Error ? cause.message : '图表渲染失败'
  }
}, { immediate: true, flush: 'post' })
</script>

<template>
  <figure class="mermaid-shell">
    <div ref="container" class="mermaid-shell__canvas" />
    <figcaption v-if="error" class="mermaid-shell__error">Mermaid 图表无法渲染：{{ error }}</figcaption>
  </figure>
</template>
```

Register `MermaidDiagram` in `.vitepress/theme/index.ts`. Add `.mermaid-shell` width, overflow, border, background, dark mode, and error styles to `custom.css`.

- [ ] **Step 5: 运行单元测试与真实内容构建**

Run:

```bash
npm test
npm run docs:build
test -f .vitepress/dist/LangGraph/01-LangGraph基础入门.html
test -f .vitepress/dist/LangGraph/02-LangGraph控制流与节点执行.html
rg -l "katex" .vitepress/dist/assets | head -1
```

Expected: tests pass；构建退出 `0`；两篇包含 Mermaid 的 LangGraph 文章产物存在；构建资产包含 KaTeX 样式。SVG 实际渲染在 Task 9 浏览器验收中确认。

- [ ] **Step 6: 提交 Markdown 增强**

```bash
git add tests/markdown.test.mjs .vitepress/markdown.mjs .vitepress/config.mts .vitepress/theme/index.ts .vitepress/theme/components/MermaidDiagram.vue .vitepress/theme/custom.css
git diff --cached --check
git commit -m "feat: render Mermaid diagrams and KaTeX formulas"
```

### Task 7: 用测试驱动发布 LangGraph 交互页面

**Files:**
- Create: `tests/runtime-viz.test.mjs`
- Create: `scripts/copy-runtime-viz.mjs`
- Generate, do not commit: `public/langgraph-runtime-viz/index.html`
- Modify: `LangGraph/index.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: `LangGraph/langgraph-runtime-viz/index.html`。
- Produces: `buildRuntimeViz(source) -> string` 和可由 Pages 直接访问的 `/langgraph-runtime-viz/`。

- [ ] **Step 1: 写发布转换失败测试**

Create `tests/runtime-viz.test.mjs`:

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import { buildRuntimeViz } from '../scripts/copy-runtime-viz.mjs'

test('runtime viz publish copy is self-contained and links back relatively', () => {
  const source = '<head><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=X"></head><body><main>viz</main></body>'
  const result = buildRuntimeViz(source)
  assert.doesNotMatch(result, /fonts\.googleapis\.com/)
  assert.match(result, /href="\.\.\/LangGraph\/"/)
  assert.match(result, /返回 LangGraph 笔记/)
})
```

- [ ] **Step 2: 运行测试并确认模块缺失失败**

Run: `node --test tests/runtime-viz.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/copy-runtime-viz.mjs`.

- [ ] **Step 3: 实现纯转换和命令入口**

Create `scripts/copy-runtime-viz.mjs` so `buildRuntimeViz(source)`:

1. removes only `<link>` tags whose `href` points to `fonts.googleapis.com` or `fonts.gstatic.com`;
2. inserts `<a class="back-to-notes" href="../LangGraph/">返回 LangGraph 笔记</a>` immediately after `<body>`;
3. inserts a small `.back-to-notes` system-font style before `</style>` or `</head>`;
4. preserves all original JavaScript and SVG markup byte-for-byte outside those insertions/removals.

The executable path reads the source, creates `public/langgraph-runtime-viz/`, and writes `index.html`. Guard it with an `import.meta.url` entry-point check so tests can import without filesystem side effects.

Update `package.json` so `docs:generate` becomes `node scripts/generate-sidebar.mjs && node scripts/copy-runtime-viz.mjs`.

- [ ] **Step 4: 测试并生成真实发布副本**

Run:

```bash
node --test tests/runtime-viz.test.mjs
node scripts/copy-runtime-viz.mjs
test -f public/langgraph-runtime-viz/index.html
! rg -n "fonts\.googleapis\.com|fonts\.gstatic\.com" public/langgraph-runtime-viz/index.html
rg -n "返回 LangGraph 笔记" public/langgraph-runtime-viz/index.html
```

Expected: one test passes；发布文件存在；无远程字体请求；返回链接存在。

- [ ] **Step 5: 验证分类入口与项目子路径兼容**

Ensure `LangGraph/index.md` uses `[打开运行时交互图](/langgraph-runtime-viz/)` so VitePress rewrites it through `withBase` during build. Run:

```bash
VITEPRESS_BASE=/My-study-materials/ npm run docs:build
rg -n "/My-study-materials/langgraph-runtime-viz/" .vitepress/dist/LangGraph/index.html
```

Expected: built category page contains the configured project base.

- [ ] **Step 6: 提交交互页接入代码**

```bash
git add tests/runtime-viz.test.mjs scripts/copy-runtime-viz.mjs LangGraph/index.md package.json .gitignore
git diff --cached --check
git commit -m "feat: publish LangGraph runtime visualization"
```

### Task 8: 配置 GitHub Pages 并完成中文 README

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`

**Interfaces:**
- Consumes: `npm ci`、`npm run docs:build`、`.vitepress/dist`、`VITEPRESS_BASE`。
- Produces: main 分支自动部署、手动触发和可复现的中文维护说明。

- [ ] **Step 1: 创建 Pages 工作流**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy VitePress site to Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - name: Setup Node
        uses: actions/setup-node@v6
        with:
          node-version: 20
          cache: npm
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Install dependencies
        run: npm ci
      - name: Build
        env:
          VITEPRESS_BASE: /My-study-materials/
        run: npm run docs:build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 编写完整中文 README**

README sections in this exact order:

1. 项目简介；
2. 技术栈与五个直接依赖的用途；
3. 环境要求（Node.js 20+、npm）；
4. 安装与本地启动；
5. 添加新笔记；
6. 修改站点名称、副标题和 GitHub 链接（`.vitepress/site.ts`）；
7. 本地构建与预览；
8. GitHub Pages 部署；
9. `VITEPRESS_BASE` 的用户名主页仓库与普通项目仓库示例；
10. Settings → Pages → Source 选择 GitHub Actions；
11. 项目目录；
12. 常见问题；
13. 内容与版权说明。

All commands must be copied from `package.json`. Explicitly document:

```bash
npm install
npm run docs:dev
npm run docs:build
npm run docs:preview
VITEPRESS_BASE=/repository-name/ npm run docs:build
```

- [ ] **Step 3: 静态检查工作流和 README 一致性**

Run:

```bash
rg -n "actions/checkout@v5|actions/setup-node@v6|actions/configure-pages@v4|actions/upload-pages-artifact@v3|actions/deploy-pages@v4" .github/workflows/deploy.yml
rg -n "npm run docs:(dev|build|preview)|VITEPRESS_BASE|GitHub Actions" README.md
```

Expected: all five official Actions and all documented commands are present exactly.

- [ ] **Step 4: 提交部署与文档**

```bash
git add .github/workflows/deploy.yml README.md
git diff --cached --check
git commit -m "docs: add Pages deployment and maintenance guide"
```

### Task 9: 完整构建、链接和浏览器验收

**Files:**
- Modify only if validation finds a defect: files named by failing output
- Verify: `.vitepress/dist/**`

**Interfaces:**
- Consumes: Tasks 1–8 的完整站点。
- Produces: 可复现的成功构建证据、主要页面和响应式交互验收结果。

- [ ] **Step 1: 从 lockfile 做干净安装验证**

Run:

```bash
npm install
npm ci
npm ls --depth=0
```

Expected: all commands exit `0`; direct dependencies are VitePress、Markdown-it、Mermaid、KaTeX、`@mdit/plugin-katex` only.

- [ ] **Step 2: 运行完整自动验证**

Run:

```bash
npm test
npm run docs:build
VITEPRESS_BASE=/My-study-materials/ npm run docs:build
```

Expected: all tests pass and both root-base and project-base builds exit `0`.

- [ ] **Step 3: 检查构建产物与核心链接**

Run:

```bash
test -f .vitepress/dist/index.html
test -f .vitepress/dist/notes.html
test -f .vitepress/dist/about.html
test -f .vitepress/dist/markdown-guide.html
test -f .vitepress/dist/python/index.html
test -f .vitepress/dist/LangChain_1.2/index.html
test -f .vitepress/dist/LangGraph/index.html
test -f .vitepress/dist/langgraph-runtime-viz/index.html
find .vitepress/dist/python .vitepress/dist/LangChain_1.2 .vitepress/dist/LangGraph -name '*.html' | wc -l
rg -n "/My-study-materials/(python|LangChain_1.2|LangGraph|langgraph-runtime-viz)/" .vitepress/dist/index.html .vitepress/dist/notes.html
```

Expected: all eight files exist；lesson/category HTML count is at least `33`；首页和导览页链接都包含 Pages base。

- [ ] **Step 4: 启动生产预览并执行桌面浏览器验收**

Run: `npm run docs:preview -- --host 127.0.0.1`

Inspect at desktop width around 1440 px:

- 首页、`/notes`、三个分类和每类首篇文章；
- 搜索“智能体”能显示标题和上下文结果；
- 左侧目录、右侧“本页目录”和上一篇/下一篇；
- `LangGraph/01-LangGraph基础入门` 的 Mermaid；
- `/markdown-guide` 的 Mermaid、行内公式 `$E = mc^2$`、块公式、任务列表、表格、图片和引用；
- 深浅色切换后正文、表格、代码和 Mermaid 均可读；
- `/langgraph-runtime-viz/` 的步骤按钮和返回链接可用。

- [ ] **Step 5: 执行移动端浏览器验收**

Inspect at 390 × 844 px:

- 首页无横向滚动；
- 三个分类卡片单列排列；
- 导航抽屉和搜索可打开、关闭；
- 长代码块、宽表格、KaTeX 和图片不撑破页面；
- Mermaid 区域可横向滚动而不扩大视口；
- 交互可视化可用，且固定侧栏不会遮挡主要内容。

- [ ] **Step 6: 对发现的问题执行最小修复并重跑对应验证**

For each defect, record the failing URL/viewport, change only the responsible file, rerun its focused test, then rerun:

```bash
npm test
VITEPRESS_BASE=/My-study-materials/ npm run docs:build
```

Expected: tests and final project-base build both exit `0` after the last fix.

- [ ] **Step 7: 最终差异与内容保护检查**

Run:

```bash
git diff --check
git status --short
git diff --stat 2e86fed..HEAD
git diff --name-only 2e86fed..HEAD -- 'python/*.md' 'LangChain_1.2/*.md' 'LangGraph/*.md'
```

Expected: no whitespace errors；only planned generated/uncommitted outputs remain ignored；existing lesson Markdown files are absent from the final command unless a documented build compatibility fix was necessary。

- [ ] **Step 8: 提交最终验收修复（仅在有修改时）**

```bash
git add .vitepress scripts tests index.md notes.md about.md markdown-guide.md README.md python/index.md LangChain_1.2/index.md LangGraph/index.md .github/workflows/deploy.yml package.json package-lock.json .gitignore
git diff --cached --check
git commit -m "fix: resolve documentation build validation issues"
```

If Step 6 required no changes, skip this commit. Report actual command outputs and browser checks; do not report unexecuted checks as successful.
