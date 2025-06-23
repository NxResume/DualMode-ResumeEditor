<script setup lang="ts">
import { reTheme } from '~/utils'

const templates = computed(() => {
  return reTheme.getThemeList().map((theme) => {
    return {
      value: theme,
      label: theme,
      image: `/assets/themes/${theme}.png`,
    }
  })
})

const scrollRef = ref<HTMLElement | null>(null)

useAutoScrollBounce(scrollRef, {
  step: 1,
  intervalTime: 20,
})
</script>

<template>
  <section id="templates" class="mx-4 mb-12 lg:mx-8 sm:mx-6">
    <div class="flex flex-col gap-8 items-start md:flex-row">
      <!-- 左侧：标题与描述 -->
      <div class="w-full space-y-4 md:w-1/3">
        <h2 class="text-2xl font-bold">
          {{ $t('home.templates.title') }}
        </h2>
        <p class="text-gray-500 leading-relaxed">
          {{ $t('home.templates.description') }}
        </p>
      </div>

      <!-- 右侧：模板滑动 + 控制按钮 -->
      <div class="w-full relative md:w-2/3">
        <!-- 滑动区域 -->
        <div
          ref="scrollRef"
          class="scroll-container px-1 py-2 scroll-smooth flex gap-4 overflow-x-auto"
        >
          <div
            v-for="tpl in templates"
            :key="tpl.value"
            class="rounded-xl flex-shrink-0 w-80 cursor-pointer transition-transform duration-300 hover:scale-105"
          >
            <img
              :src="tpl.image"
              :alt="tpl.label"
              class="rounded-xl h-full w-full object-cover"
            >
          </div>
        </div>
        <div
          class="w-1/2 hidden pointer-events-none inset-y-0 left-0 absolute from-[#f8f9fa] to-transparent bg-linear-to-r lg:block"
        />
        <div
          class="w-1/2 hidden pointer-events-none inset-y-0 right-0 absolute from-[#f8f9fa] to-transparent bg-linear-to-l lg:block"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.scroll-container::-webkit-scrollbar {
  display: none;
}
.scroll-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
