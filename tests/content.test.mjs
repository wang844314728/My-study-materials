import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  buildSidebar,
  extractTitle,
  parseFrontmatter,
  scanContent,
  toRoute,
  validateLocalAssets
} from '../scripts/lib/content.mjs'
import { validateContent } from '../scripts/validate-content.mjs'

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

test('sidebar keeps flat category output unchanged', () => {
  const sidebar = buildSidebar({
    python: [
      { relativePath: 'index.md', route: '/python/', title: 'Python 首页', isIndex: true },
      { relativePath: '01-basics.md', route: '/python/01-basics', title: '基础', isIndex: false }
    ],
    langchain: [],
    langgraph: []
  })

  assert.deepEqual(sidebar['/python/'], [
    { text: 'Python', link: '/python/' },
    { text: '基础', link: '/python/01-basics' }
  ])
})

test('sidebar recursively groups nested lessons and links each directory index', async () => {
  const root = await mkdtemp(join(tmpdir(), 'notes-sidebar-'))
  await mkdir(join(root, 'guides', 'advanced'), { recursive: true })
  await writeFile(join(root, 'index.md'), '# Python 首页')
  await writeFile(join(root, '01-root.md'), '# 根目录课程')
  await writeFile(join(root, 'guides', 'index.md'), '# 指南首页')
  await writeFile(join(root, 'guides', '01-guide.md'), '# 指南课程')
  await writeFile(join(root, 'guides', 'advanced', 'index.md'), '# 进阶首页')
  await writeFile(join(root, 'guides', 'advanced', '01-topic.md'), '# 进阶课程')

  const entries = await scanContent(root, { key: 'python', text: 'Python', path: '/python/' })
  const sidebar = buildSidebar({ python: entries, langchain: [], langgraph: [] })

  assert.deepEqual(sidebar['/python/'], [
    { text: 'Python', link: '/python/' },
    { text: '根目录课程', link: '/python/01-root' },
    {
      text: '指南首页',
      link: '/python/guides/',
      items: [
        { text: '指南课程', link: '/python/guides/01-guide' },
        {
          text: '进阶首页',
          link: '/python/guides/advanced/',
          items: [
            { text: '进阶课程', link: '/python/guides/advanced/01-topic' }
          ]
        }
      ]
    }
  ])
})

test('content validation accepts lessons and image references added beyond the baseline', async () => {
  const root = await createValidationFixture({
    lessons: [
      ['python/01-baseline.md', '# 基线\n![基线](assets/baseline.png)'],
      ['python/02-added.md', '# 新增\n![新增](assets/added.png)']
    ],
    assets: ['python/assets/baseline.png', 'python/assets/added.png']
  })

  const result = await validateContent(root, {
    baseline: {
      lessonPaths: ['python/01-baseline.md'],
      minimumImageReferenceCount: 1
    }
  })

  assert.deepEqual(result, {
    lessonCount: 2,
    imageReferenceCount: 2,
    missingAssetCount: 0
  })
})

test('content validation requires every baseline lesson even when totals are high enough', async () => {
  const root = await createValidationFixture({
    lessons: [['python/02-replacement.md', '# 替代课程\n![替代](assets/replacement.png)']],
    assets: ['python/assets/replacement.png']
  })

  await assert.rejects(
    validateContent(root, {
      baseline: {
        lessonPaths: ['python/01-baseline.md'],
        minimumImageReferenceCount: 1
      }
    }),
    /Missing baseline lesson: python\/01-baseline\.md\./
  )
})

test('content validation enforces the baseline minimum image-reference count', async () => {
  const root = await createValidationFixture({
    lessons: [['python/01-baseline.md', '# 基线课程']]
  })

  await assert.rejects(
    validateContent(root, {
      baseline: {
        lessonPaths: ['python/01-baseline.md'],
        minimumImageReferenceCount: 1
      }
    }),
    /Expected at least 1 local image reference, found 0\./
  )
})

async function createValidationFixture({ lessons, assets = [] }) {
  const root = await mkdtemp(join(tmpdir(), 'notes-validation-'))
  await Promise.all([
    mkdir(join(root, 'python'), { recursive: true }),
    mkdir(join(root, 'LangChain_1.2'), { recursive: true }),
    mkdir(join(root, 'LangGraph', 'langgraph-runtime-viz'), { recursive: true })
  ])
  await Promise.all([
    writeFile(join(root, 'python', 'index.md'), '# Python'),
    writeFile(join(root, 'LangChain_1.2', 'index.md'), '# LangChain'),
    writeFile(join(root, 'LangGraph', 'index.md'), '# LangGraph'),
    writeFile(join(root, 'LangGraph', 'langgraph-runtime-viz', 'index.html'), '<!doctype html>')
  ])

  for (const [path, source] of lessons) {
    await mkdir(join(root, path, '..'), { recursive: true })
    await writeFile(join(root, path), source)
  }
  for (const path of assets) {
    await mkdir(join(root, path, '..'), { recursive: true })
    await writeFile(join(root, path), '')
  }

  return root
}
