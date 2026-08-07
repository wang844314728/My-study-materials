import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative } from 'node:path'

export const CONTENT_CATEGORIES = [
  { key: 'python', text: 'Python', path: '/python/', description: '从基础语法到并发编程' },
  { key: 'langchain', text: 'LangChain 1.2', path: '/LangChain_1.2/', description: '模型、工具、智能体与 RAG' },
  { key: 'langgraph', text: 'LangGraph', path: '/LangGraph/', description: '有状态工作流与智能体运行时' }
]

const SKIPPED_DIRECTORIES = new Set([
  'assets',
  'node_modules',
  'dist',
  '.vitepress',
  'langgraph-runtime-viz'
])

const collator = new Intl.Collator('zh-CN', { numeric: true })

export function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return {}

  return Object.fromEntries(match[1]
    .split(/\r?\n/)
    .map((line) => line.match(/^([\w-]+):\s*(.*?)\s*$/))
    .filter(Boolean)
    .map(([, key, rawValue]) => [key, parseFrontmatterValue(rawValue)]))
}

function parseFrontmatterValue(rawValue) {
  const value = rawValue.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, '$1$2')
  if (value === 'true') return true
  if (value === 'false') return false
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value)) {
    const numericValue = Number(value)
    if (Number.isFinite(numericValue)) return numericValue
  }
  return value
}

export function extractTitle(source, filePath) {
  const frontmatter = parseFrontmatter(source)
  if (typeof frontmatter.title === 'string' && frontmatter.title.trim()) return frontmatter.title.trim()

  const heading = source.match(/^#\s+(.+)$/m)
  if (heading) return heading[1].replace(/\s+#+\s*$/, '').trim()

  return basename(filePath, extname(filePath))
    .replace(/^\d+-/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
}

export function toRoute(relativePath) {
  const normalizedPath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
  const withoutExtension = normalizedPath.replace(/\.md$/i, '')
  const route = withoutExtension === 'index'
    ? ''
    : withoutExtension.replace(/\/index$/i, '/')

  return `/${route}`.replace(/\/+/g, '/')
}

export async function scanContent(rootDir, category) {
  const markdownFiles = await findMarkdownFiles(rootDir)
  const entries = await Promise.all(markdownFiles.map(async (filePath) => {
    const source = await readFile(filePath, 'utf8')
    const relativePath = relative(rootDir, filePath).replace(/\\/g, '/')
    const frontmatter = parseFrontmatter(source)
    const filename = basename(filePath)
    const numericPrefixMatch = filename.match(/^(\d+)-/)
    const order = typeof frontmatter.order === 'number' && Number.isFinite(frontmatter.order)
      ? frontmatter.order
      : null

    return {
      categoryKey: category.key,
      filePath,
      relativePath,
      route: toRoute(`${category.path}/${relativePath}`),
      title: extractTitle(source, filePath),
      order,
      numericPrefix: numericPrefixMatch ? Number(numericPrefixMatch[1]) : null,
      isIndex: filename.toLowerCase() === 'index.md',
      source
    }
  }))

  return entries.sort(compareEntries)
}

async function findMarkdownFiles(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true })
  const paths = await Promise.all(entries.map(async (entry) => {
    if (entry.name.startsWith('.')) return []

    const filePath = join(rootDir, entry.name)
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) return []
      return findMarkdownFiles(filePath)
    }

    return entry.isFile() && extname(entry.name).toLowerCase() === '.md' ? [filePath] : []
  }))

  return paths.flat()
}

function compareEntries(left, right) {
  if (left.isIndex !== right.isIndex) return left.isIndex ? -1 : 1

  const orderDifference = compareOptionalNumber(left.order, right.order)
  if (orderDifference !== 0) return orderDifference

  const prefixDifference = compareOptionalNumber(left.numericPrefix, right.numericPrefix)
  if (prefixDifference !== 0) return prefixDifference

  return collator.compare(left.relativePath, right.relativePath)
}

function compareOptionalNumber(left, right) {
  const leftIsNumber = Number.isFinite(left)
  const rightIsNumber = Number.isFinite(right)
  if (leftIsNumber && rightIsNumber) return left - right
  if (leftIsNumber) return -1
  if (rightIsNumber) return 1
  return 0
}

export function localImageReferences(source) {
  return Array.from(source.matchAll(/!\[[^\]]*\]\(([^\n)]+)\)/g))
    .map((match) => normalizeImageDestination(match[1]))
    .filter(Boolean)
}

function normalizeImageDestination(value) {
  let destination = value.trim()
  if (destination.startsWith('<')) {
    const closingBracket = destination.indexOf('>')
    if (closingBracket === -1) return null
    destination = destination.slice(1, closingBracket)
  } else {
    destination = destination.replace(/\s+(?:"[^"]*"|'[^']*'|\([^)]*\))\s*$/, '')
  }

  if (/^(?:https?:|data:|\/)/i.test(destination)) return null
  const reference = destination.split(/[?#]/, 1)[0]
  if (!reference) return null

  try {
    return { reference, resolvedReference: decodeURIComponent(reference) }
  } catch {
    return { reference, resolvedReference: reference }
  }
}

export function validateLocalAssets(entries) {
  return entries.flatMap((entry) => localImageReferences(entry.source)
    .filter(({ resolvedReference }) => !existsSync(join(dirname(entry.filePath), resolvedReference)))
    .map(({ reference, resolvedReference }) => ({
      filePath: entry.filePath,
      reference,
      resolvedPath: join(dirname(entry.filePath), resolvedReference)
    })))
}

export function buildSidebar(entriesByCategory) {
  const groupedEntries = normalizeCategoryEntries(entriesByCategory)

  return Object.fromEntries(CONTENT_CATEGORIES.map((category) => {
    const entries = groupedEntries.get(category.key) ?? []
    return [category.path, [
      { text: category.text, link: category.path },
      ...buildDirectoryItems(createDirectoryTree(entries))
    ]]
  }))
}

function createDirectoryTree(entries) {
  const root = { name: '', index: null, articles: [], directories: new Map() }

  for (const entry of entries) {
    const pathParts = entry.relativePath.split('/')
    pathParts.pop()
    let directory = root

    for (const name of pathParts) {
      if (!directory.directories.has(name)) {
        directory.directories.set(name, { name, index: null, articles: [], directories: new Map() })
      }
      directory = directory.directories.get(name)
    }

    if (entry.isIndex) directory.index = entry
    else directory.articles.push(entry)
  }

  return root
}

function buildDirectoryItems(directory) {
  const articles = directory.articles.map((entry) => ({ text: entry.title, link: entry.route }))
  const groups = [...directory.directories.values()].map((child) => {
    const group = {
      text: child.index?.title ?? extractTitle('', child.name),
      items: buildDirectoryItems(child)
    }
    if (child.index) group.link = child.index.route
    return group
  })

  return [...articles, ...groups]
}

function normalizeCategoryEntries(entriesByCategory) {
  if (entriesByCategory instanceof Map) return entriesByCategory
  if (Array.isArray(entriesByCategory)) {
    if (entriesByCategory.every((entry) => 'categoryKey' in entry)) {
      return entriesByCategory.reduce((grouped, entry) => {
        const entries = grouped.get(entry.categoryKey) ?? []
        entries.push(entry)
        grouped.set(entry.categoryKey, entries)
        return grouped
      }, new Map())
    }
    return new Map(entriesByCategory.map(({ category, entries }) => [category.key, entries]))
  }
  return new Map(Object.entries(entriesByCategory))
}
