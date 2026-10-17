<script lang="ts" setup>
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const { t } = useI18n()

const open = ref(false)
// 首次进编辑页自动弹一次教程；之后只能从顶栏 ？ 按钮手动打开
const guideShown = useLocalStorage('nuxt-resume-guide-shown', false)

onMounted(() => {
  if (!guideShown.value) {
    guideShown.value = true
    open.value = true
  }
})

// 标题层级讲「在简历里各代表什么」，示例代码与说明文字都走 i18n
const structureRows = computed(() => [
  { code: t('guide.structCode1'), label: t('guide.structH1') },
  { code: t('guide.structCode2'), label: t('guide.structH2') },
  { code: t('guide.structCode3'), label: t('guide.structH3') },
])

// 语法示例是语言无关的 Markdown 代码，说明文字走 i18n
const syntaxRows = computed(() => [
  { code: '**加粗**', label: t('guide.synBold') },
  { code: '- 列表', label: t('guide.synList') },
  { code: '[文字](链接)', label: t('guide.synLink') },
  { code: '---', label: t('guide.synDivider') },
])

// 左右分栏 / 图标是本站自定义语法，代码示例也走 i18n（中英文示例写法不同）
const specialRows = computed(() => [
  { code: t('guide.specialContainerCode'), label: t('guide.specialContainer') },
  { code: t('guide.specialIconCode'), label: t('guide.specialIcon') },
])
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <button
        class="text-[13px] text-foreground/80 rounded-lg inline-flex h-8 w-8 cursor-pointer select-none transition-colors duration-150 items-center justify-center hover:text-foreground hover:bg-accent"
        type="button" :title="t('guide.button')" :aria-label="t('guide.button')"
      >
        <span class="i-ri-question-line" />
      </button>
    </DialogTrigger>

    <DialogScrollContent class="sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{{ t('guide.dialogTitle') }}</DialogTitle>
        <DialogDescription>{{ t('guide.dialogDesc') }}</DialogDescription>
      </DialogHeader>

      <div class="guide-body">
        <section>
          <h4 class="guide-h">
            {{ t('guide.editH') }}
          </h4>
          <p class="guide-p">
            {{ t('guide.editP1') }}
          </p>
          <p class="guide-sub">
            {{ t('guide.editStructTitle') }}
          </p>
          <ul class="guide-syntax">
            <li v-for="row in structureRows" :key="row.code">
              <code>{{ row.code }}</code>
              <span>{{ row.label }}</span>
            </li>
          </ul>
          <p class="guide-sub">
            {{ t('guide.editSyntaxTitle') }}
          </p>
          <ul class="guide-syntax">
            <li v-for="row in syntaxRows" :key="row.code">
              <code>{{ row.code }}</code>
              <span>{{ row.label }}</span>
            </li>
          </ul>
          <p class="guide-sub">
            {{ t('guide.editSpecialTitle') }}
          </p>
          <ul class="guide-syntax">
            <li v-for="row in specialRows" :key="row.code">
              <code>{{ row.code }}</code>
              <span>{{ row.label }}</span>
            </li>
          </ul>
        </section>

        <section>
          <h4 class="guide-h">
            {{ t('guide.photoH') }}
          </h4>
          <p class="guide-p">
            {{ t('guide.photoUpload') }}
          </p>
          <p class="guide-p">
            {{ t('guide.photoAdjust') }}
          </p>
          <p class="guide-p">
            {{ t('guide.photoDelete') }}
          </p>
        </section>

        <section>
          <h4 class="guide-h">
            {{ t('guide.saveH') }}
          </h4>
          <p class="guide-p">
            {{ t('guide.saveP1') }}
          </p>
          <p class="guide-p">
            {{ t('guide.exportP1') }}
          </p>
        </section>
      </div>
    </DialogScrollContent>
  </Dialog>
</template>

<style scoped>
.guide-body {
  display: grid;
  gap: 18px;
  font-size: 13.5px;
  line-height: 1.7;
}

.guide-h {
  margin-bottom: 6px;
  padding-left: 8px;
  border-left: 3px solid hsl(var(--ring));
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: hsl(var(--foreground));
}

.guide-p {
  margin: 0;
  color: hsl(var(--foreground) / 0.85);
}

.guide-sub {
  margin: 10px 0 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
}

.guide-syntax {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
}

.guide-syntax li {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.guide-syntax code {
  flex: none;
  width: 176px;
  padding: 2px 8px;
  border-radius: 6px;
  background: hsl(var(--muted));
  font-size: 12.5px;
  text-align: center;
}

.guide-syntax span {
  font-size: 12.5px;
  color: hsl(var(--muted-foreground));
}
</style>
