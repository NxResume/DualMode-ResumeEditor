<script setup lang="ts">
import LoginRegister from './LoginRegister.vue'

defineProps<{
  callback?: () => void
}>()

const { signIn, refresh } = useAuth()

const socialButtons = [
  { type: 'github', aria: 'Sign in with Github', svg: `<svg class=\"text-gray-400 h-6 w-6 group-hover:text-gray-300\" fill=\"currentColor\" viewBox=\"0 0 20 20\"><path fill-rule=\"evenodd\" d=\"M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z\" clip-rule=\"evenodd\" /></svg>` },
  { type: 'google', aria: 'Sign in with Google', svg: `<svg class=\"text-gray-400 h-6 w-6 group-hover:text-gray-300\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M6 12a6 6 0 0 0 11.659 2H12v-4h9.805v4H21.8c-.927 4.564-4.962 8-9.8 8c-5.523 0-10-4.477-10-10S6.477 2 12 2a9.99 9.99 0 0 1 8.282 4.393l-3.278 2.295A6 6 0 0 0 6 12\" /></svg>` },
  { type: 'gitee', aria: 'Sign in with Gitee', svg: `<svg class=\"text-gray-400 h-6 w-6 group-hover:text-gray-300\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.59.59 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z\" /></svg>` },
]

function handle(type: string) {
  signIn(type)
}
</script>

<template>
  <div class="mx-auto max-w-xs w-full space-y-8">
    <LoginRegister
      :callback="() => {
        refresh()
        callback?.()
      }"
    />
    <div>
      <div class="my-4 flex items-center">
        <div class="border-t border-gray-300 flex-grow" />
        <span class="text-xs text-gray-400 mx-2">{{ $t('login.or') }}</span>
        <div class="border-t border-gray-300 flex-grow" />
      </div>
      <div class="flex gap-4 justify-center">
        <button
          v-for="btn in socialButtons"
          :key="btn.type"
          class="rounded-lg bg-gray-800 flex h-12 w-12 cursor-pointer items-center justify-center focus:outline-none hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
          :aria-label="btn.aria"
          @click="handle(btn.type)"
          v-html="btn.svg"
        />
      </div>
    </div>
    <div class="mt-4 text-center">
      <p class="text-sm text-gray-600">
        {{ $t('login.bySigningIn') }}
        <a href="/terms" class="text-gray-900 font-medium hover:text-gray-700">{{ $t('login.terms') }}</a>
        {{ $t('login.and') }}
        <a href="/privacy" class="text-gray-900 font-medium hover:text-gray-700">{{ $t('login.privacy') }}</a>
      </p>
    </div>
  </div>
</template>
