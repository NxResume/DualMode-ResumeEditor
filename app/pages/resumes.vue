<script setup lang="ts">
import { Copy, Edit, Plus, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useResumeStore } from '@/stores/resume'

const resumeStore = useResumeStore()
const router = useRouter()
const localePath = useLocalePath()
const { status, signIn } = useAuth()

const showCreateDialog = ref(false)
const newResumeName = ref('')
const editingResumeId = ref<string | null>(null)
const editingResumeName = ref('')

async function handleCreateResume() {
  if (newResumeName.value.trim()) {
    const newResume = await resumeStore.createResume(newResumeName.value.trim())
    showCreateDialog.value = false
    newResumeName.value = ''
    router.push(localePath({
      name: 'edit-id',
      params: { id: newResume.id },
    }))
  }
}

function handleEditResume(id: string) {
  router?.push(localePath({
    name: 'edit-id',
    params: { id },
  }))
}

function handleDuplicateResume(id: string) {
  resumeStore.duplicateResume(id)
}

function handleDeleteResume(id: string) {
  resumeStore.deleteResume(id)
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

function saveEditResumeName(resume: any) {
  if (
    editingResumeId.value === resume.id
    && editingResumeName.value.trim()
    && editingResumeName.value !== resume.name
  ) {
    resumeStore.renameResume(resume.id, editingResumeName.value.trim())
  }
  editingResumeId.value = null
}

onMounted(async () => {
  if (status.value === 'authenticated') {
    await resumeStore.fetchResumes()
  }
})

definePageMeta({
  middleware: 'sidebase-auth',
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
            <h1 class="text-3xl text-gray-900 font-bold">
              {{ $t('resumes.title') }}
            </h1>
            <p class="text-gray-600 mt-2">
              {{ $t('resumes.description') }}
            </p>
          </div>
        </div>
        <Button
          v-if="status === 'authenticated'"
          class="text-white px-4 py-2 bg-black cursor-pointer hover:bg-gray-900"
          variant="default"
          @click="showCreateDialog = true"
        >
          <Plus class="h-4 w-4" />
          {{ $t('resumes.createNew') }}
        </Button>
      </div>

      <!-- 未登录状态 -->
      <div v-if="status !== 'authenticated'" class="py-12 text-center">
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
        <div v-if="resumeStore.resumes.length === 0" class="py-24 text-center col-span-full">
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
              @click="showCreateDialog = true"
            >
              <Plus class="h-4 w-4" />
              {{ $t('resumes.createNew') }}
            </Button>
          </div>
        </div>
        <div v-else class="gap-6 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2">
          <div
            v-for="resume in resumeStore.resumes"
            :key="resume.id"
            class="p-6 rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg"
          >
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
                  <button class="text-gray-500 ml-1 hover:text-black" :title="$t('resumes.edit')" @click="startEditResumeName(resume)">
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
              @keyup.enter="handleCreateResume"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCreateDialog = false">
            {{ $t('common.cancel') }}
          </Button>
          <Button :disabled="!newResumeName.trim()" class="text-white bg-black hover:bg-gray-900" variant="default" @click="handleCreateResume">
            {{ $t('common.create') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
