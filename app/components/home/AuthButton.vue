<script setup lang="ts">
import { LogOut, User } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const { signOut, status, data } = useAuth()
</script>

<template>
  <div class="flex gap-2 items-center">
    <template v-if="status === 'authenticated'">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button class="rounded-full flex transition-colors items-center hover:bg-gray-100 dark:hover:bg-gray-800">
            <img
              v-if="data?.user?.image"
              :src="data.user.image"
              :alt="data.user.name || 'User'"
              class="border-2 border-gray-200 rounded-full h-8 w-8 transition-colors dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            >
            <div v-else class="rounded-full bg-gray-200 flex h-8 w-8 items-center justify-center dark:bg-gray-700">
              <User class="text-gray-600 h-4 w-4 dark:text-gray-400" />
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56" align="end">
          <DropdownMenuLabel class="font-normal">
            <div class="flex flex-col space-y-1">
              <p class="text-sm leading-none font-medium">
                {{ data?.user?.name || 'User' }}
              </p>
              <p v-if="data?.user?.email" class="text-xs text-muted-foreground leading-none">
                {{ data.user.email }}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="cursor-pointer" @click="signOut">
            <LogOut class="mr-2 h-4 w-4" />
            <span>{{ $t('auth.signOut') }}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
    <template v-else>
      <SigninModelItem>
        <Button
          variant="outline"
          size="sm"
          class="hidden md:inline-flex"
        >
          {{ $t('auth.signIn') }}
        </Button>
      </SigninModelItem>
    </template>
  </div>
</template>
