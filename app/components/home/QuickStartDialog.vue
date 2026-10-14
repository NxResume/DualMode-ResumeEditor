<script setup lang="ts">
const router = useRouter()
const localePath = useLocalePath()

// 快速开始：默认本地存储，直接进简历列表，不再弹存储选择弹窗
// 云端模式可在右上角 ⚙️ 设置中用开关切换
async function handleQuickStartClick() {
  router.push(localePath('resumes'))
}
</script>

<template>
  <ClientOnly>
    <div
      class="text-lg text-white leading-[48px] font-semibold mx-auto mt-10 text-center rounded-4xl h-12 w-40 cursor-pointer select-none shadow-md transition-all duration-500 from-black to-gray-700 bg-linear-to-r hover:shadow-xl hover:scale-105"
      @click="handleQuickStartClick"
    >
      {{ $t('app.startButton') }}
    </div>

    <template #fallback>
      <div
        class="text-lg text-white leading-[48px] font-semibold mx-auto mt-10 text-center rounded-4xl opacity-80 h-12 w-40 select-none shadow-md animate-pulse from-black to-gray-700 bg-linear-to-r"
      >
        &nbsp;
      </div>
    </template>
  </ClientOnly>
</template>
