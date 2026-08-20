<script setup lang="ts">
import type { ResumeData } from '~~/types/resume'
import { Copy, Edit, Plus, Trash2 } from 'lucide-vue-next'
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

const resumes = ref<ResumeData[]>([])
const loading = ref(false)
const refreshing = ref(false)
const actionLoading = ref<string | null>(null)
const creatingResume = ref(false)

async function handleCreateResume() {
  if (creatingResume.value)
    return
  if (resumes.value.length >= MAX_RESUMES) {
    toast({
      title: $t('resumes.limitTitle'),
      description: $t('resumes.limitDescription', { max: MAX_RESUMES }),
      variant: 'destructive',
    })
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
  refreshing.value = true
  resumes.value = await resumeController.fetchResumes()
  refreshing.value = false
}

async function handleDeleteResume(id: string) {
  actionLoading.value = id
  await nextTick()
  try {
    const res = await resumeController.deleteResume(id)
    if (res.success) {
      resumes.value = resumes.value.filter(r => r.id !== id)
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
}

async function handleDuplicateResume(id: string) {
  if (resumes.value.length >= MAX_RESUMES) {
    toast({
      title: $t('resumes.limitTitle'),
      description: $t('resumes.limitDescription', { max: MAX_RESUMES }),
      variant: 'destructive',
    })
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
  <div class="bg-gray-50 min-h-screen">
    <div class="mx-auto px-4 py-8 max-w-6xl">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div class="flex gap-4 items-center">
          <NuxtLink :to="localePath('index')" class="-translate-y-4">
            <div class="i-ri-arrow-left-line" />
          </NuxtLink>
          <div>
            <h1 class="text-3xl text-gray-900 font-bold flex gap-2 items-center">
              {{ $t('resumes.title') }}
              <span class="text-base text-gray-500 font-normal ml-2">{{ resumes.length }}/{{ MAX_RESUMES }}</span>
            </h1>
            <p class="text-gray-600 mt-2">
              {{ $t('resumes.description') }}
            </p>
          </div>
        </div>
        <Button
          v-if="canAccess"
          class="text-white px-4 py-2 bg-black cursor-pointer hover:bg-gray-900"
          variant="default"
          :disabled="resumes.length >= MAX_RESUMES"
          @click="showCreateDialog = true"
        >
          <Plus class="h-4 w-4" />
          {{ $t('resumes.createNew') }}
        </Button>
      </div>

      <!-- 仅 database 模式 + 未登录时提示登录；local 模式直接进入简历管理 -->
      <div v-if="currentMode === 'database' && status !== 'authenticated'" class="py-12 text-center">
        <div class="mx-auto max-w-md">
          <div class="mb-6">
            <div class="i-ri-user-line text-6xl text-gray-400 mx-auto mb-4" />
            <h2 class="text-2xl text-gray-900 font-bold mb-2">
              {{ $t('auth.notSignedIn') }}
            </h2>
            <p class="text-gray-600">
              {{ $t('auth.signInRequired') }}
            </p>
          </div>
          <Button
            class="text-white px-6 py-3 bg-black hover:bg-gray-900"
            size="lg"
            @click="signIn('github')"
          >
            <svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
            </svg>
            {{ $t('auth.signInWithGithub') }}
          </Button>
        </div>
      </div>

      <!-- 已登录状态 -->
      <ClientOnly v-else>
        <!-- Resume Empty State -->
        <div v-if="resumes.length === 0 && !loading" class="py-24 text-center col-span-full">
          <div class="flex flex-col items-center justify-center">
            <div class="i-ri-file-list-3-line text-7xl text-gray-300 mb-4" />
            <h2 class="text-2xl text-gray-700 font-bold mb-2">
              {{ $t('resumes.emptyTitle') }}
            </h2>
            <p class="text-gray-500 mb-6">
              {{ $t('resumes.emptyDescription') }}
            </p>
            <Button
              class="text-white px-6 py-3 bg-black cursor-pointer hover:bg-gray-900"
              size="lg"
              :disabled="resumes.length >= MAX_RESUMES"
              @click="showCreateDialog = true"
            >
              <Plus class="h-4 w-4" />
              {{ $t('resumes.createNew') }}
            </Button>
          </div>
        </div>
        <!-- Loading Skeletons -->
        <div v-if="loading" class="gap-6 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2">
          <div v-for="i in 3" :key="i">
            <div class="flex flex-col space-y-3">
              <Skeleton class="rounded-xl h-[125px] w-[250px]" />
              <div class="space-y-2">
                <Skeleton class="h-4 w-[250px]" />
                <Skeleton class="h-4 w-[200px]" />
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="resumes.length > 0" class="gap-6 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2">
          <div
            v-for="resume in resumes"
            :key="resume.id"
            class="relative p-6 rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg"
          >
            <!-- 卡片级 loading 蒙版 -->
            <div
              v-if="actionLoading === resume.id"
              class="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center z-10"
            >
              <svg class="animate-spin h-6 w-6 text-gray-500" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
            <div class="mb-4 flex items-start justify-between">
              <h3 class="text-lg text-gray-900 font-semibold">
                <template v-if="editingResumeId === resume.id">
                  <Input
                    :id="`resume-name-input-${resume.id}`"
                    v-model="editingResumeName"
                    class="text-lg text-gray-900 font-semibold px-1 py-0.5 outline-none border-b border-gray-300 bg-transparent min-w-24 w-auto focus:border-black"
                    @blur="() => saveEditResumeName(resume)"
                    @keyup.enter="() => saveEditResumeName(resume)"
                  />
                </template>
                <template v-else>
                  <span class="cursor-pointer select-text" @click="startEditResumeName(resume)">{{ resume.name }}</span>
                  <button
                    class="text-gray-500 ml-1 hover:text-black"
                    :title="$t('resumes.edit')"
                    @click="startEditResumeName(resume)"
                  >
                    <Edit class="h-4 w-4" />
                  </button>
                </template>
              </h3>
              <div class="flex gap-2">
                <button
                  class="text-gray-600 p-2 rounded cursor-pointer hover:text-green-600 hover:bg-green-50"
                  :title="$t('resumes.duplicate')"
                  @click="handleDuplicateResume(resume.id)"
                >
                  <Copy class="h-4 w-4" />
                </button>
                <button
                  class="text-gray-600 p-2 rounded cursor-pointer hover:text-red-600 hover:bg-red-50"
                  :title="$t('resumes.delete')"
                  @click="handleDeleteResume(resume.id)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div class="text-sm text-gray-500 mb-4">
              <div>{{ $t('resumes.lastModified') }}: {{ formatDate(resume.updatedAt) }}</div>
              <div>{{ $t('resumes.created') }}: {{ formatDate(resume.createdAt) }}</div>
            </div>

            <div class="flex gap-2">
              <Button
                class="text-white px-4 py-2 bg-black flex flex-1 gap-2 cursor-pointer items-center justify-center hover:bg-gray-900"
                variant="default"
                @click="handleEditResume(resume.id)"
              >
                <Edit class="h-4 w-4" />
                {{ $t('resumes.edit') }}
              </Button>
            </div>
          </div>
        </div>
      </ClientOnly>
    </div>

    <!-- Create Resume Dialog -->
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
            :disabled="!newResumeName.trim() || resumes.length >= MAX_RESUMES || creatingResume"
            class="text-white bg-black hover:bg-gray-900"
            variant="default"
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
  </div>
</template>
