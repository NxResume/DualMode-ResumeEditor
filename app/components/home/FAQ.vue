<script setup lang="ts">
const faqs = [
  {
    questionKey: 'home.faq.items.0.question',
    answerKey: 'home.faq.items.0.answer',
  },
  {
    questionKey: 'home.faq.items.1.question',
    answerKey: 'home.faq.items.1.answer',
  },
  {
    questionKey: 'home.faq.items.2.question',
    answerKey: 'home.faq.items.2.answer',
  },
  {
    questionKey: 'home.faq.items.3.question',
    answerKey: 'home.faq.items.3.answer',
  },
]

const activeIndex = ref<number | null>(null)

function toggle(index: number) {
  activeIndex.value = activeIndex.value === index ? null : index
}
</script>

<template>
  <section id="faq" class="mx-auto mb-16 px-6 max-w-4xl">
    <h3 class="text-2xl text-gray-900 font-bold mb-6 text-center">
      {{ $t('home.faq.title') }}
    </h3>
    <div class="rounded-xl bg-white shadow divide-gray-200 divide-y">
      <div
        v-for="(faq, index) in faqs"
        :key="index"
        class="px-6 py-4 cursor-pointer select-none"
        @click="toggle(index)"
      >
        <!-- 问题 -->
        <div class="flex items-center justify-between">
          <h4 class="text-base text-gray-800 font-medium">
            {{ $t(faq.questionKey) }}
          </h4>
          <span
            class="transition-transform duration-300" :class="{
              'rotate-180': activeIndex === index,
            }"
          >
            <i class="i-ri-arrow-down-s-line text-xl text-gray-400" />
          </span>
        </div>

        <!-- 答案 -->
        <transition name="fade-slide">
          <p
            v-if="activeIndex === index"
            class="text-sm text-gray-600 leading-relaxed mt-3"
          >
            {{ $t(faq.answerKey) }}
          </p>
        </transition>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease-in-out;
  overflow: hidden;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 500px; /* 足够容纳单条答案即可 */
}
</style>
