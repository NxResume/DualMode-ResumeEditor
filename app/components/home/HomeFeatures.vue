<script setup lang="ts">
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
        class="p-6 rounded-xl bg-white/10 flex-shrink-0 w-64 cursor-pointer shadow-lg transform transition-transform duration-300 relative backdrop-blur-md hover:shadow-2xl hover:-translate-y-2"
      >
        <div
          class="text-3xl mb-6 rounded-xl inline-flex h-14 w-14 items-center justify-center drop-shadow-lg"
          :class="[item.color]"
        >
          <i :class="item.icon" />
        </div>
        <h4 class="text-xl text-black font-semibold mb-2">
          {{ $t(item.titleKey) }}
        </h4>
        <p class="text-sm text-black/80 leading-relaxed">
          {{ $t(item.descKey) }}
        </p>
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
