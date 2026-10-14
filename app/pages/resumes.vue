<script setup lang="ts">
import type { ResumeData } from '~~/types/resume'
import { Copy, Edit, FileText, Pencil, Plus, Trash2 } from 'lucide-vue-next'
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
// 列表按最后修改倒序展示（不改动源数组，只影响展示）
const sortedResumes = computed(() =>
  [...resumes.value].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
)
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
      <!-- 顶部：返回 + 标题 + 数量 + 主操作 -->
      <header class="page-head">
        <NuxtLink :to="localePath('index')" class="back-btn" :title="$t('back')">
          <span class="i-ri-arrow-left-line" />
        </NuxtLink>

        <div class="head-text">
          <h1 class="page-title">
            {{ $t('resumes.title') }}
          </h1>
          <span class="count-chip">{{ resumes.length }} / {{ MAX_RESUMES }}</span>
        </div>

        <div class="head-actions">
          <span v-if="atLimit" class="limit-chip">{{ $t('resumes.atLimit') }}</span>
          <Button v-if="canAccess" class="text-[13px]" :disabled="atLimit" @click="showCreateDialog = true">
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
        <Button size="lg" class="text-[13px]" @click="signIn('github')">
          <svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
          </svg>
          {{ $t('auth.signInWithGithub') }}
        </Button>
      </div>

      <ClientOnly v-else>
        <!-- 骨架屏：首次加载时先占位，避免「暂无简历」一闪而过 -->
        <div v-if="loading" class="resume-list">
          <div v-for="i in 4" :key="i" class="resume-row is-skeleton">
            <Skeleton class="rounded-[10px] h-9 w-9" />
            <div class="row-body">
              <Skeleton class="h-4 w-40" />
              <Skeleton class="h-3 w-56" />
            </div>
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
          <Button size="lg" class="text-[13px]" :disabled="atLimit" @click="showCreateDialog = true">
            <Plus class="h-4 w-4" />
            {{ $t('resumes.createNew') }}
          </Button>
        </div>

        <!-- 简历列表：一行一份，紧凑的卡片式列表 -->
        <div v-else class="resume-list">
          <div v-for="resume in sortedResumes" :key="resume.id" class="resume-row">
            <div v-if="actionLoading === resume.id" class="row-mask">
              <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>

            <!-- 左侧文件图标 -->
            <div class="row-icon">
              <FileText class="h-[18px] w-[18px]" />
            </div>

            <!-- 中间：名称 + 时间 -->
            <div class="row-body">
              <div class="row-name">
                <Input
                  v-if="editingResumeId === resume.id"
                  :id="`resume-name-input-${resume.id}`"
                  v-model="editingResumeName"
                  class="text-[13px] font-semibold px-2 h-7 max-w-[280px]"
                  @blur="() => saveEditResumeName(resume)"
                  @keyup.enter="() => saveEditResumeName(resume)"
                  @keyup.esc="editingResumeId = null"
                />
                <template v-else>
                  <span class="row-name-text" :title="resume.name" @dblclick="startEditResumeName(resume)">
                    {{ resume.name }}
                  </span>
                  <button
                    class="rename-btn"
                    :title="$t('resumes.rename')"
                    @click="startEditResumeName(resume)"
                  >
                    <Pencil class="h-3 w-3" />
                  </button>
                </template>
              </div>

              <div class="row-meta">
                <span>{{ $t('resumes.lastModified') }} {{ formatDate(resume.updatedAt) }}</span>
                <span class="row-meta-dot">·</span>
                <span>{{ $t('resumes.created') }} {{ formatDate(resume.createdAt) }}</span>
              </div>
            </div>

            <!-- 右侧操作 -->
            <div class="row-actions">
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
              <Button variant="outline" class="row-open" @click="handleEditResume(resume.id)">
                <Edit class="h-3.5 w-3.5" />
                {{ $t('resumes.edit') }}
              </Button>
            </div>
          </div>
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
  --rl-page: hsl(var(--muted) / 0.45);
  --rl-card: hsl(var(--card));

  min-height: 100vh;
  background: var(--rl-page);
}

.dark .resumes-page {
  --rl-page: hsl(var(--background));
  --rl-card: hsl(var(--card));
}

.page-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}

/* ---------- 顶部 ---------- */
.page-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex: none;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  background: var(--rl-card);
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition:
    color 150ms,
    border-color 150ms,
    background-color 150ms;
}

.back-btn:hover {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
  border-color: hsl(var(--foreground) / 0.15);
}

.head-text {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: hsl(var(--foreground));
}

.count-chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  background: hsl(var(--foreground) / 0.06);
  font-size: 11.5px;
  font-weight: 600;
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
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  background: hsl(var(--foreground) / 0.05);
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

/* ---------- 列表 ---------- */
.resume-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resume-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  background: var(--rl-card);
  transition:
    border-color 150ms,
    box-shadow 150ms,
    background-color 150ms;
}

.resume-row:not(.is-skeleton):hover {
  border-color: hsl(var(--foreground) / 0.15);
  box-shadow:
    0 1px 2px hsl(240 10% 4% / 0.04),
    0 6px 16px hsl(240 10% 4% / 0.05);
}

/* 左侧图标块 */
.row-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex: none;
  border-radius: 10px;
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  transition:
    background-color 150ms,
    color 150ms;
}

.resume-row:not(.is-skeleton):hover .row-icon {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
}

/* 中间主体 */
.row-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.row-name {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.row-name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: hsl(var(--foreground));
  cursor: text;
}

.rename-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex: none;
  border-radius: 5px;
  color: hsl(var(--muted-foreground));
  opacity: 0;
  cursor: pointer;
  transition:
    opacity 150ms,
    background-color 150ms,
    color 150ms;
}

.resume-row:hover .rename-btn {
  opacity: 1;
}

.rename-btn:hover {
  background: hsl(var(--accent));
  color: hsl(var(--foreground));
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: hsl(var(--muted-foreground));
}

.row-meta-dot {
  opacity: 0.5;
}

/* 右侧操作 */
.row-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: none;
  opacity: 0.65;
  transition: opacity 150ms;
}

.resume-row:hover .row-actions {
  opacity: 1;
}

.row-open {
  height: 32px;
  margin-left: 6px;
  padding: 0 12px;
  font-size: 12.5px;
  gap: 6px;
}

.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
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
  color: #ef4444;
}

/* 行内加载遮罩 */
.row-mask {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--rl-card);
  opacity: 0.8;
  color: hsl(var(--muted-foreground));
}

/* ---------- 空状态 / 登录引导 ---------- */
.empty-block,
.signin-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 24px;
  border: 1px dashed hsl(var(--border));
  border-radius: 16px;
  background: var(--rl-card);
  text-align: center;
}

.empty-icon,
.signin-icon {
  font-size: 48px;
  color: hsl(var(--muted-foreground) / 0.4);
  margin-bottom: 14px;
}

.empty-title,
.signin-title {
  margin-bottom: 6px;
  font-size: 17px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.empty-desc,
.signin-desc {
  margin-bottom: 22px;
  font-size: 13.5px;
  color: hsl(var(--muted-foreground));
}

/* 窄窗口：先收掉时间，保留名称与操作 */
@media (max-width: 767px) {
  .row-meta {
    display: none;
  }

  .page-inner {
    padding: 24px 16px 64px;
  }
}
</style>
