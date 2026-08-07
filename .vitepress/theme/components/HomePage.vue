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
    <section aria-labelledby="characteristics-title">
      <h2 id="characteristics-title">站点特点</h2>
      <ul>
        <li>本地全文搜索</li>
        <li>按章节组织</li>
        <li>随笔记持续更新</li>
      </ul>
    </section>
  </main>
</template>
