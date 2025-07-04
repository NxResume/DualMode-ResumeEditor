<script setup lang="ts">
import { cn } from '~/utils/ui'

const features = [
  {
    icon: 'i-ri-markdown-fill',
    titleKey: 'home.features.items.0.title',
    descKey: 'home.features.items.0.description',
    color: 'text-white bg-blue-600/80',
  },
  {
    icon: 'i-ri-layout-2-line',
    titleKey: 'home.features.items.1.title',
    descKey: 'home.features.items.1.description',
    color: 'text-white bg-green-600/80',
  },
  {
    icon: 'i-ri-translate-2',
    titleKey: 'home.features.items.2.title',
    descKey: 'home.features.items.2.description',
    color: 'text-white bg-purple-600/80',
  },
  {
    icon: 'i-ri-file-download-line',
    titleKey: 'home.features.items.3.title',
    descKey: 'home.features.items.3.description',
    color: 'text-white bg-orange-600/80',
  },
  {
    icon: 'i-ri-camera-line',
    titleKey: 'home.features.items.4.title',
    descKey: 'home.features.items.4.description',
    color: 'text-white bg-pink-600/80',
  },
  {
    icon: 'i-ri-cloud-line',
    titleKey: 'home.features.items.5.title',
    descKey: 'home.features.items.5.description',
    color: 'text-white bg-teal-600/80',
  },
]

const scrollFeatRef = ref<HTMLElement | null>(null)

useAutoScrollBounce(scrollFeatRef, {
  step: 1,
  intervalTime: 10,
})
</script>

<template>
  <section class="mx-auto mb-16 px-6 max-w-full">
    <h3 class="text-2xl text-gray-900 tracking-tight font-extrabold mb-6 text-center">
      {{ $t('home.features.title') }}
    </h3>

    <div
      ref="scrollFeatRef"
      class="no-scrollbar p-2 scroll-smooth flex gap-6 overflow-x-auto"
    >
      <div
        v-for="(item, idx) in features"
        :key="idx"
        :class="
          cn('px-4 py-3 rounded-lg flex flex-shrink-0 gap-x-3 w-64 cursor-pointer shadow-md transition-colors duration-300 items-center hover:text-background hover:bg-primary',
             'text-white bg-black hover:text-black hover:bg-white',
          )"
      >
        <!-- 图标 -->
        <i :class="item.icon" class="text-xl" />

        <!-- 文本 -->
        <div class="flex flex-col">
          <h4 class="text-sm font-semibold">
            {{ $t(item.titleKey) }}
          </h4>
          <p class="text-xs leading-snug opacity-80">
            {{ $t(item.descKey) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
