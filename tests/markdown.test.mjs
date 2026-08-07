import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import MarkdownIt from 'markdown-it'
import { configureMarkdown } from '../.vitepress/markdown.mjs'

test('renders dollar math with KaTeX', () => {
  const md = new MarkdownIt()
  configureMarkdown(md)
  assert.match(md.render('公式：$E = mc^2$'), /class="katex"/)
})

test('renders block dollar math with KaTeX display markup', () => {
  const md = new MarkdownIt()
  configureMarkdown(md)
  const html = md.render('$$\n\\sum_{i=1}^{n} i = \\frac{n(n + 1)}{2}\n$$')

  assert.match(html, /class='katex-block'/)
  assert.match(html, /class="katex-display"/)
})

test('leaves currency dollar amounts as prose', () => {
  const md = new MarkdownIt()
  configureMarkdown(md)
  const html = md.render('OpenRouter 最低限额$5，税费$0.8。')

  assert.match(html, /最低限额\$5，税费\$0\.8/)
  assert.doesNotMatch(html, /class="katex"/)
})

test('turns mermaid fences into encoded components', () => {
  const md = new MarkdownIt()
  configureMarkdown(md)
  const html = md.render('```mermaid\ngraph TD\n  A --> B\n```')
  assert.match(html, /<MermaidDiagram code="graph%20TD/)
  assert.doesNotMatch(html, /language-mermaid/)
})

test('decodes the original Mermaid source for rendering and fallback display', async () => {
  const { decodeMermaidSource } = await import('../.vitepress/mermaid.mjs')
  const source = 'graph TD\n  A["<source>"] --> B\n'

  assert.equal(decodeMermaidSource(encodeURIComponent(source)), source)
})

test('Mermaid render errors expose the safely interpolated original source', async () => {
  const component = await readFile(new URL('../.vitepress/theme/components/MermaidDiagram.vue', import.meta.url), 'utf8')

  assert.match(component, /<pre v-if="error" class="mermaid-shell__source">\s*<code>{{ source }}<\/code>\s*<\/pre>/)
  assert.doesNotMatch(component, /v-html="source"/)
})

test('renders Markdown task items as accessible disabled checkboxes', () => {
  const md = new MarkdownIt()
  configureMarkdown(md)
  const html = md.render('- [x] 阅读章节\n- [ ] 实践与复盘')

  assert.match(html, /<ul class="task-list">/)
  assert.match(html, /<li class="task-list-item">/)
  assert.match(html, /<input class="task-list-item-checkbox" type="checkbox" disabled checked aria-label="已完成"> 阅读章节/)
  assert.match(html, /<input class="task-list-item-checkbox" type="checkbox" disabled aria-label="未完成"> 实践与复盘/)
})
