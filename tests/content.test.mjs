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
