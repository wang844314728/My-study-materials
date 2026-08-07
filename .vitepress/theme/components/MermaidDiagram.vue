<script lang="ts">
let mermaidInitialized = false
</script>

<script setup lang="ts">
import { inBrowser, useData } from 'vitepress'
import { computed, nextTick, ref, watch } from 'vue'
import { decodeMermaidSource } from '../../mermaid.mjs'

const props = defineProps<{ code: string }>()
const { isDark } = useData()
const container = ref<HTMLElement>()
const error = ref('')
const source = computed(() => decodeMermaidSource(props.code))
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
    const themedSource = `---\nconfig:\n  theme: ${isDark.value ? 'dark' : 'neutral'}\n---\n${source.value}`
    const { svg, bindFunctions } = await mermaid.render(`mermaid-${crypto.randomUUID()}`, themedSource)
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
    <div v-show="!error" ref="container" class="mermaid-shell__canvas" />
    <pre v-if="error" class="mermaid-shell__source"><code>{{ source }}</code></pre>
    <figcaption v-if="error" class="mermaid-shell__error">Mermaid 图表无法渲染：{{ error }}</figcaption>
  </figure>
</template>
