import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'
import {
  CONTENT_CATEGORIES,
  localImageReferences,
  scanContent,
  validateLocalAssets
} from './lib/content.mjs'
import { CONTENT_BASELINE } from './content-baseline.mjs'

const CATEGORY_DIRECTORIES = {
  python: 'python',
  langchain: 'LangChain_1.2',
  langgraph: 'LangGraph'
}

export async function validateContent(rootDir = process.cwd(), {
  requirePages = false,
  baseline = CONTENT_BASELINE
} = {}) {
  const entriesByCategory = await Promise.all(CONTENT_CATEGORIES.map(async (category) => {
    const entries = await scanContent(join(rootDir, CATEGORY_DIRECTORIES[category.key]), category)
    return entries
  }))
  const allEntries = entriesByCategory.flat()
  const lessons = allEntries.filter((entry) => !entry.isIndex)
  const imageReferences = lessons.flatMap((entry) => localImageReferences(entry.source))
  const missingAssets = validateLocalAssets(lessons)
  const duplicateRoutes = findDuplicates(allEntries.map((entry) => entry.route))
  const lessonPaths = new Set(lessons.map((entry) => `${CATEGORY_DIRECTORIES[entry.categoryKey]}/${entry.relativePath}`))
  const failures = []

  for (const lessonPath of baseline.lessonPaths) {
    if (!lessonPaths.has(lessonPath)) failures.push(`Missing baseline lesson: ${lessonPath}.`)
  }
  if (imageReferences.length < baseline.minimumImageReferenceCount) {
    const referenceLabel = baseline.minimumImageReferenceCount === 1 ? 'reference' : 'references'
    failures.push(`Expected at least ${baseline.minimumImageReferenceCount} local image ${referenceLabel}, found ${imageReferences.length}.`)
  }
  for (const missing of missingAssets) failures.push(`Missing local image "${missing.reference}" in ${missing.filePath}.`)
  for (const route of duplicateRoutes) failures.push(`Duplicate route: ${route}.`)

  await requireFile(join(rootDir, 'LangGraph', 'langgraph-runtime-viz', 'index.html'), 'Missing runtime source HTML')
    .catch((error) => failures.push(error.message))

  if (requirePages) {
    const pagePaths = [
      'index.md',
      'notes.md',
      'about.md',
      'markdown-guide.md',
      'python/index.md',
      'LangChain_1.2/index.md',
      'LangGraph/index.md'
    ]
    await Promise.all(pagePaths.map(async (pagePath) => {
      await requireFile(join(rootDir, pagePath), 'Missing required page')
        .catch((error) => failures.push(error.message))
    }))
  }

  if (failures.length > 0) throw new Error(failures.join('\n'))

  return {
    lessonCount: lessons.length,
    imageReferenceCount: imageReferences.length,
    missingAssetCount: missingAssets.length
  }
}

function findDuplicates(values) {
  const seen = new Set()
  const duplicates = new Set()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}

async function requireFile(filePath, label) {
  try {
    await access(filePath, constants.F_OK)
  } catch {
    throw new Error(`${label}: ${filePath}`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await validateContent(process.cwd(), { requirePages: process.argv.includes('--require-pages') })
  console.log(`Content validation: ${result.lessonCount} lesson Markdown files, ${result.imageReferenceCount} local image references, ${result.missingAssetCount} missing`)
}
