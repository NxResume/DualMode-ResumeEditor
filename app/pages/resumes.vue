<script setup lang="ts">
import type { ResumeData } from '~~/types/resume'
import { Copy, Edit, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast/use-toast'
import resumeController from '~/composables/action/resume'

const router = useRouter()
const localePath = useLocalePath()
const { status, signIn } = useAuth()
const { toast } = useToast()
const storageManager = useStorageManager()
const { currentMode } = storageManager

// 本地模式 或 已登录 → 允许操作
const canAccess = computed(() => currentMode.value === 'local' || status.value === 'authenticated')

const MAX_RESUMES = 10
const showCreateDialog = ref(false)
const newResumeName = ref('')
const editingResumeId = ref<string | null>(null)
const editingResumeName = ref('')
const deletingResume = ref<ResumeData | null>(null)

const resumes = ref<ResumeData[]>([])
const loading = ref(false)
const actionLoading = ref<string | null>(null)
const creatingResume = ref(false)

const atLimit = computed(() => resumes.value.length >= MAX_RESUMES)

function warnLimit() {
  toast({
    title: $t('resumes.limitTitle'),
    description: $t('resumes.limitDescription', { max: MAX_RESUMES }),
    variant: 'destructive',
  })
}

async function handleCreateResume() {
  if (creatingResume.value)
    return
  if (atLimit.value) {
    warnLimit()
    return
  }
  if (newResumeName.value.trim()) {
    creatingResume.value = true
    try {
      const newResume = await resumeController.createResume(newResumeName.value.trim())
      showCreateDialog.value = false
      newResumeName.value = ''
      router.push(localePath({
        name: 'edit-id',
        params: { id: newResume.id },
      }))
    }
    finally {
      creatingResume.value = false
    }
  }
}

function handleEditResume(id: string) {
  router?.push(localePath({
    name: 'edit-id',
    params: { id },
  }))
}

async function reloadResumes() {
  loading.value = true
  try {
    resumes.value = await resumeController.fetchResumes()
  }
  finally {
    loading.value = false
  }
}

// 删除是破坏性操作：先弹确认，再真正删
function askDeleteResume(resume: ResumeData) {
  deletingResume.value = resume
}

async function confirmDeleteResume() {
  const target = deletingResume.value
  if (!target)
    return
  deletingResume.value = null
  actionLoading.value = target.id
  await nextTick()
  try {
    const res = await resumeController.deleteResume(target.id)
    if (res.success) {
      resumes.value = resumes.value.filter(r => r.id !== target.id)
    }
    else {
      toast({
        title: $t('resumes.deleteFailed'),
        variant: 'destructive',
      })
    }
  }
  finally {
    actionLoading.value = null
  }
}

function formatDate(date: Date) {
  const d = new Date(date)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

function startEditResumeName(resume: any) {
  editingResumeId.value = resume.id
  editingResumeName.value = resume.name
  nextTick(() => {
    const input = document.getElementById(`resume-name-input-${resume.id}`) as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

async function saveEditResumeName(current: any) {
  if (
    editingResumeId.value === current.id
    && editingResumeName.value.trim()
    && editingResumeName.value !== current.name
  ) {
    const newName = editingResumeName.value.trim()
    actionLoading.value = current.id
    await nextTick()
    resumeController.renameResume(current.id, newName)
      .then((res) => {
        if (res) {
          const idx = resumes.value.findIndex(r => r.id === current.id)
          if (idx !== -1)
            resumes.value[idx]!.name = newName
          editingResumeId.value = null
        }
      })
      .finally(() => {
        actionLoading.value = null
      })
  }
  else {
    editingResumeId.value = null
  }
}

async function handleDuplicateResume(id: string) {
  if (atLimit.value) {
    warnLimit()
    return
  }
  actionLoading.value = id
  await nextTick()
  try {
    const res = await resumeController.duplicateResume(id, resumes.value)
    if (res) {
      await reloadResumes()
    }
  }
  finally {
    actionLoading.value = null
  }
}

// local 模式或已登录时都加载简历
onMounted(() => {
  if (canAccess.value) {
    reloadResumes()
  }
})

// 模式/登录状态变化时重新加载（例如从未登录→登录，或用户切换到 local 模式）
watch([currentMode, status], () => {
  if (canAccess.value) {
    reloadResumes()
  }
})

definePageMeta({
  // 移除 sidebase-auth 中间件：本地模式不需要登录即可访问
})
</script>

<template>
  <div class="resumes-page">
    <div class="page-inner">
      <!-- 顶部：标题 + 数量 + 主操作 -->
      <header class="page-head">
        <NuxtLink :to="localePath('index')" class="back-btn" :title="$t('back')">
          <span class="i-ri-arrow-left-line" />
        </NuxtLink>

        <div class="head-text">
          <h1 class="page-title">
            {{ $t('resumes.title') }}
            <span class="count-chip">{{ resumes.length }}/{{ MAX_RESUMES }}</span>
          </h1>
          <p class="page-desc">
            {{ $t('resumes.description') }}
          </p>
        </div>

        <div class="head-actions">
          <span v-if="atLimit" class="limit-chip">{{ $t('resumes.atLimit') }}</span>
          <Button v-if="canAccess" :disabled="atLimit" @click="showCreateDialog = true">
            <Plus class="h-4 w-4" />
            {{ $t('resumes.createNew') }}
          </Button>
        </div>
      </header>

      <!-- 仅 database 模式 + 未登录时提示登录；local 模式直接进入简历管理 -->
      <div v-if="currentMode === 'database' && status !== 'authenticated'" class="signin-block">
        <div class="signin-icon i-ri-user-line" />
        <h2 class="signin-title">
          {{ $t('auth.notSignedIn') }}
        </h2>
        <p class="signin-desc">
          {{ $t('auth.signInRequired') }}
        </p>
        <Button size="lg" @click="signIn('github')">
          <svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
          </svg>
          {{ $t('auth.signInWithGithub') }}
        </Button>
      </div>

      <ClientOnly v-else>
        <!-- 骨架屏：首次加载时先占位，避免「暂无简历」一闪而过 -->
        <div v-if="loading" class="card-grid">
          <div v-for="i in 3" :key="i" class="resume-card is-skeleton">
            <Skeleton class="h-5 w-32" />
            <Skeleton class="mt-4 h-4 w-full" />
            <Skeleton class="mt-2 h-4 w-2/3" />
            <Skeleton class="mt-6 h-9 w-full" />
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="resumes.length === 0" class="empty-block">
          <div class="empty-icon i-ri-file-list-3-line" />
          <h2 class="empty-title">
            {{ $t('resumes.emptyTitle') }}
          </h2>
          <p class="empty-desc">
            {{ $t('resumes.emptyDescription') }}
          </p>
          <Button size="lg" :disabled="atLimit" @click="showCreateDialog = true">
            <Plus class="h-4 w-4" />
            {{ $t('resumes.createNew') }}
          </Button>
        </div>

        <!-- 简历卡片 -->
        <div v-else class="card-grid">
          <article v-for="resume in resumes" :key="resume.id" class="resume-card">
            <!-- 卡片级 loading 蒙版 -->
            <div v-if="actionLoading === resume.id" class="card-mask">
              <svg class="h-6 w-6 animate-spin" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>

            <div class="card-head">
              <h3 class="card-title">
                <Input
                  v-if="editingResumeId === resume.id"
                  :id="`resume-name-input-${resume.id}`"
                  v-model="editingResumeName"
                  class="text-base font-semibold px-1 h-8"
                  @blur="() => saveEditResumeName(resume)"
                  @keyup.enter="() => saveEditResumeName(resume)"
                  @keyup.esc="editingResumeId = null"
                />
                <template v-else>
                  <span class="card-title-text" :title="resume.name" @dblclick="startEditResumeName(resume)">
                    {{ resume.name }}
                  </span>
                  <button
                    class="icon-action"
                    :title="$t('resumes.rename')"
                    @click="startEditResumeName(resume)"
                  >
                    <Pencil class="h-3.5 w-3.5" />
                  </button>
                </template>
              </h3>

              <div class="card-actions">
                <button
                  class="icon-action"
                  :title="$t('resumes.duplicate')"
                  @click="handleDuplicateResume(resume.id)"
                >
                  <Copy class="h-4 w-4" />
                </button>
                <button
                  class="icon-action is-danger"
                  :title="$t('resumes.delete')"
                  @click="askDeleteResume(resume)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- 标签 / 值左右两列对齐 -->
            <dl class="card-meta">
              <div class="meta-row">
                <dt>{{ $t('resumes.lastModified') }}</dt>
                <dd>{{ formatDate(resume.updatedAt) }}</dd>
              </div>
              <div class="meta-row">
                <dt>{{ $t('resumes.created') }}</dt>
                <dd>{{ formatDate(resume.createdAt) }}</dd>
              </div>
            </dl>

            <Button class="card-primary" @click="handleEditResume(resume.id)">
              <Edit class="h-4 w-4" />
              {{ $t('resumes.edit') }}
            </Button>
          </article>
        </div>
      </ClientOnly>
    </div>

    <!-- 新建简历 -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ $t('resumes.createNew') }}</DialogTitle>
          <DialogDescription>
            {{ $t('resumes.createDescription') }}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <Input
              id="resume-name"
              v-model="newResumeName"
              :placeholder="$t('resumes.namePlaceholder')"
              :disabled="creatingResume"
              @keyup.enter="handleCreateResume"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" :disabled="creatingResume" @click="showCreateDialog = false">
            {{ $t('common.cancel') }}
          </Button>
          <Button
            :disabled="!newResumeName.trim() || atLimit || creatingResume"
            @click="handleCreateResume"
          >
            <span v-if="creatingResume">
              <svg class="mr-2 h-4 w-4 inline animate-spin" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
              {{ $t('common.creating') || $t('common.create') }}
            </span>
            <span v-else>
              {{ $t('common.create') }}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 删除确认（破坏性操作必须二次确认） -->
    <Dialog :open="!!deletingResume" @update:open="(v: boolean) => { if (!v) deletingResume = null }">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ $t('resumes.deleteConfirmTitle') }}</DialogTitle>
          <DialogDescription>
            {{ $t('resumes.deleteConfirmDescription', { name: deletingResume?.name }) }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="deletingResume = null">
            {{ $t('common.cancel') }}
          </Button>
          <Button variant="destructive" @click="confirmDeleteResume">
            {{ $t('resumes.deleteConfirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.resumes-page {
  min-height: 100vh;
  background: hsl(var(--background));
}

.page-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

/* 顶部 */
.page-head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 28px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: none;
  margin-top: 2px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  color: hsl(var(--foreground) / 0.75);
  cursor: pointer;
  transition:
    background-color 150ms,
    color 150ms;
}

.back-btn:hover {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

.head-text {
  flex: 1;
  min-width: 0;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.page-desc {
  margin-top: 4px;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}

.count-chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  background: hsl(var(--muted));
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: hsl(var(--muted-foreground));
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.limit-chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgb(245 158 66 / 14%);
  font-size: 11.5px;
  color: hsl(var(--foreground) / 0.7);
}

/* 卡片网格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.resume-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 18px;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  background: hsl(var(--card));
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  transition:
    box-shadow 150ms,
    border-color 150ms;
}

.resume-card:hover {
  border-color: hsl(var(--ring) / 0.4);
  box-shadow: 0 4px 14px rgb(15 23 42 / 8%);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.card-title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: text;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: none;
}

.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition:
    background-color 150ms,
    color 150ms;
}

.icon-action:hover {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

.icon-action.is-danger:hover {
  background: rgb(239 68 68 / 10%);
  color: #dc2626;
}

/* 标签 / 值两列对齐 */
.card-meta {
  margin: 14px 0 16px;
  padding-top: 12px;
  border-top: 1px solid hsl(var(--border));
}

.meta-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 0;
  font-size: 12.5px;
}

.meta-row dt {
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.meta-row dd {
  color: hsl(var(--foreground) / 0.85);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.card-primary {
  width: 100%;
}

.card-mask {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: hsl(var(--card) / 0.7);
  color: hsl(var(--muted-foreground));
}

/* 空状态 / 登录引导 */
.empty-block,
.signin-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 88px 24px;
  text-align: center;
}

.empty-icon,
.signin-icon {
  font-size: 56px;
  color: hsl(var(--muted-foreground) / 0.5);
  margin-bottom: 16px;
}

.empty-title,
.signin-title {
  margin-bottom: 6px;
  font-size: 18px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.empty-desc,
.signin-desc {
  margin-bottom: 24px;
  font-size: 13.5px;
  color: hsl(var(--muted-foreground));
}
</style>
