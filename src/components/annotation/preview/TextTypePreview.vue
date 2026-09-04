<script setup lang="ts">
export interface NerSpanItem {
  text: string
  label: string
  color: string
}

export interface TextClsData {
  sampleText: string
  category: string
  score: string
  labels: string[]
}

defineProps<{
  previewKind: string
  nerData: { sampleText: string; spans: NerSpanItem[] }
  textClsData: TextClsData
  customText?: string
}>()
</script>

<template>
  <div class="relative flex h-full w-full flex-col justify-center p-6">
    <!-- 1. Custom Text Rendering -->
    <div v-if="customText" class="space-y-4">
      <div class="rounded-2xl border border-white/10 bg-zinc-900/90 p-5 leading-relaxed text-zinc-200 font-sans text-xs whitespace-pre-wrap max-h-56 overflow-y-auto">
        {{ customText }}
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <span class="size-2 rounded-full bg-primary animate-pulse"></span> Custom Sample Text Loaded
        </span>
      </div>
    </div>

    <!-- 2. Default NER Token Span Highlighting -->
    <div v-else-if="previewKind === 'NER'" class="space-y-4">
      <div class="rounded-2xl border border-white/10 bg-zinc-900/90 p-5 leading-relaxed text-zinc-200">
        <span>President </span>
        <mark class="rounded px-1.5 py-0.5 font-semibold text-white bg-sky-500/30 border border-sky-500/50">
          Joko Widodo
          <span class="ml-1 text-[9px] uppercase font-bold text-sky-400">PERSON</span>
        </mark>
        <span> met with </span>
        <mark class="rounded px-1.5 py-0.5 font-semibold text-white bg-emerald-500/30 border border-emerald-500/50">
          Apple
          <span class="ml-1 text-[9px] uppercase font-bold text-emerald-400">ORG</span>
        </mark>
        <span> CEO </span>
        <mark class="rounded px-1.5 py-0.5 font-semibold text-white bg-sky-500/30 border border-sky-500/50">
          Tim Cook
          <span class="ml-1 text-[9px] uppercase font-bold text-sky-400">PERSON</span>
        </mark>
        <span> in </span>
        <mark class="rounded px-1.5 py-0.5 font-semibold text-white bg-amber-500/30 border border-amber-500/50">
          Jakarta
          <span class="ml-1 text-[9px] uppercase font-bold text-amber-400">GPE</span>
        </mark>
        <span> to discuss artificial intelligence investments.</span>
      </div>

      <!-- Tag Legend -->
      <div class="flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-400">
          <span class="size-2 rounded-full bg-sky-400"></span> PERSON (2)
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
          <span class="size-2 rounded-full bg-emerald-400"></span> ORG (1)
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
          <span class="size-2 rounded-full bg-amber-400"></span> GPE (1)
        </span>
      </div>
    </div>

    <!-- 2. Text Classification -->
    <div v-else class="space-y-4">
      <div class="rounded-2xl border border-white/10 bg-zinc-900/90 p-5 text-sm leading-relaxed text-zinc-200">
        "{{ textClsData.sampleText }}"
      </div>
      <div class="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/50 p-4">
        <div>
          <span class="text-[11px] font-mono text-zinc-400">Detected Category</span>
          <div class="mt-0.5 text-base font-bold text-white">{{ textClsData.category }}</div>
        </div>
        <div class="text-right">
          <span class="text-[11px] font-mono text-zinc-400">Confidence</span>
          <div class="mt-0.5 text-base font-mono font-bold text-emerald-400">{{ textClsData.score }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
