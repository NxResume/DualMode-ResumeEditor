<script setup lang="ts">
import { Copy, Edit, Plus, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useResumeStore } from '@/stores/resume'

const resumeStore = useResumeStore()
const router = useRouter()
const localePath = useLocalePath()

const showCreateDialog = ref(false)
const newResumeName = ref('')

function handleCreateResume() {
  if (newResumeName.value.trim()) {
    const newResume = resumeStore.createResume(newResumeName.value.trim())
    showCreateDialog.value = false
    newResumeName.value = ''
    router.push(localePath({
      name: 'edit-id',
      params: { id: newResume.id },
    }))
  }
}

function handleEditResume(id: string) {
  resumeStore.switchResume(id)
  router.push(localePath({
    name: 'edit-id',
    params: { id },
  }))
}

function handleDuplicateResume(id: string) {
  resumeStore.duplicateResume(id)
}

function handleDeleteResume(id: string) {
  if (resumeStore.resumes.length > 1) {
    resumeStore.deleteResume(id)
  }
}

function formatDate(date: Date) {
  const d = new Date(date)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}
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
          class="text-white px-4 py-2 bg-black cursor-pointer hover:bg-gray-900"
          variant="default"
          @click="showCreateDialog = true"
        >
          <Plus class="h-4 w-4" />
          {{ $t('resumes.createNew') }}
        </Button>
      </div>

      <ClientOnly>
        <!-- Resume Grid -->
        <div class="gap-6 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2">
          <div
            v-for="resume in resumeStore.resumes"
            :key="resume.id"
            class="p-6 rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg"
          >
            <div class="mb-4 flex items-start justify-between">
              <h3 class="text-lg text-gray-900 font-semibold">
                {{ resume.name }}
              </h3>
              <div class="flex gap-2">
                <button
                  class="text-gray-600 p-2 rounded cursor-pointer hover:text-blue-600 hover:bg-blue-50"
                  :title="$t('resumes.edit')"
                  @click="handleEditResume(resume.id)"
                >
                  <Edit class="h-4 w-4" />
                </button>
                <button
                  class="text-gray-600 p-2 rounded cursor-pointer hover:text-green-600 hover:bg-green-50"
                  :title="$t('resumes.duplicate')"
                  @click="handleDuplicateResume(resume.id)"
                >
                  <Copy class="h-4 w-4" />
                </button>
                <button
                  v-if="resumeStore.resumes.length > 1"
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
              <!-- <button
                class="text-gray-600 p-2 rounded hover:text-gray-800 hover:bg-gray-100"
                :title="$t('resumes.download')"
              >
                <Download class="h-4 w-4" />
              </button> -->
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
            <Label for="resume-name">{{ $t('resumes.name') }}</Label>
            <input
              id="resume-name"
              v-model="newResumeName"
              :placeholder="$t('resumes.namePlaceholder')"
              @keyup.enter="handleCreateResume"
            >
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
