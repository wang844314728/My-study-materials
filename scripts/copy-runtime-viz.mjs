import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const hrefAttribute = /\bhref\s*=\s*(?:"([^\"]*)"|'([^']*)'|([^\s>]+))/i
const remoteFontHref = /^(?:https?:)?\/\/fonts\.(?:googleapis|gstatic)\.com(?:[:/?#]|$)/i
const backLink = '<a class="back-to-notes" href="../LangGraph/">返回 LangGraph 笔记</a>'
const backLinkCss = '.back-to-notes{position:fixed;top:1rem;left:1rem;z-index:10;padding:.5rem .75rem;border-radius:.375rem;background:#fff;color:#1f2937;font:500 14px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-decoration:none;box-shadow:0 1px 3px #0003}.back-to-notes:hover{background:#f3f4f6}'

function readTag(source, start) {
  let quote

  for (let end = start + 1; end < source.length; end += 1) {
    const character = source[end]
    if (quote) {
      if (character === quote) quote = undefined
    } else if (character === '"' || character === "'") {
      quote = character
    } else if (character === '>') {
      const markup = source.slice(start, end + 1)
      const match = /^<\s*(\/?)\s*([a-z][\w:-]*)\b/i.exec(markup)
      return match && {
        start,
        end,
        markup,
        closing: Boolean(match[1]),
        name: match[2].toLowerCase()
      }
    }
  }

  return undefined
}

function findRawTextClose(source, name, start) {
  const lowerSource = source.toLowerCase()
  let candidate = lowerSource.indexOf(`</${name}`, start)

  while (candidate !== -1) {
    const tag = readTag(source, candidate)
    if (tag?.closing && tag.name === name) return tag
    candidate = lowerSource.indexOf(`</${name}`, candidate + 2)
  }

  return undefined
}

function findTag(source, name, closing) {
  let cursor = 0

  while (cursor < source.length) {
    const start = source.indexOf('<', cursor)
    if (start === -1) return undefined

    const tag = readTag(source, start)
    if (!tag) {
      cursor = start + 1
      continue
    }
    if (tag.name === name && tag.closing === closing) return tag

    if (!tag.closing && (tag.name === 'script' || tag.name === 'style')) {
      const rawTextClose = findRawTextClose(source, tag.name, tag.end + 1)
      cursor = rawTextClose ? rawTextClose.end + 1 : source.length
      continue
    }
    cursor = tag.end + 1
  }

  return undefined
}

function removeRemoteFontLinks(source) {
  let result = ''
  let cursor = 0

  while (cursor < source.length) {
    const start = source.indexOf('<', cursor)
    if (start === -1) return result + source.slice(cursor)

    const tag = readTag(source, start)
    if (!tag) {
      result += source.slice(cursor, start + 1)
      cursor = start + 1
      continue
    }

    result += source.slice(cursor, start)
    if (!tag.closing && (tag.name === 'script' || tag.name === 'style')) {
      const rawTextClose = findRawTextClose(source, tag.name, tag.end + 1)
      if (!rawTextClose) return result + source.slice(start)
      result += source.slice(start, rawTextClose.end + 1)
      cursor = rawTextClose.end + 1
      continue
    }

    const match = tag.name === 'link' && tag.markup.match(hrefAttribute)
    const href = match?.[1] ?? match?.[2] ?? match?.[3]
    if (!href || !remoteFontHref.test(href)) result += tag.markup
    cursor = tag.end + 1
  }

  return result
}

export function buildRuntimeViz(source) {
  const withoutRemoteFonts = removeRemoteFontLinks(source)
  const body = findTag(withoutRemoteFonts, 'body', false)
  const withBackLink = body
    ? `${withoutRemoteFonts.slice(0, body.end + 1)}${backLink}${withoutRemoteFonts.slice(body.end + 1)}`
    : withoutRemoteFonts
  const style = findTag(withBackLink, 'style', false)

  if (style) {
    const styleClose = findRawTextClose(withBackLink, 'style', style.end + 1)
    if (styleClose) {
      return `${withBackLink.slice(0, styleClose.start)}\n${backLinkCss}${withBackLink.slice(styleClose.start)}`
    }
  }

  const headClose = findTag(withBackLink, 'head', true)
  return headClose
    ? `${withBackLink.slice(0, headClose.start)}<style>${backLinkCss}</style>${withBackLink.slice(headClose.start)}`
    : withBackLink
}

async function copyRuntimeViz() {
  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const sourcePath = resolve(rootDir, 'LangGraph/langgraph-runtime-viz/index.html')
  const outputPath = resolve(rootDir, 'public/langgraph-runtime-viz/index.html')
  const source = await readFile(sourcePath, 'utf8')

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, buildRuntimeViz(source))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await copyRuntimeViz()
}
