<script setup lang="ts">
const { signIn } = useAuth()

definePageMeta({
  layout: false,
})
</script>

<template>
  <div class="px-4 py-12 bg-gray-50 flex min-h-screen items-center justify-center lg:px-8 sm:px-6">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-3xl text-gray-900 font-extrabold mt-6 text-center">
          {{ $t('auth.signIn') }}
        </h2>
        <p class="text-sm text-gray-600 mt-2 text-center">
          {{ $t('auth.signInDescription') }}
        </p>
      </div>
      <div class="mt-8 space-y-6">
        <div>
          <button
            class="group text-sm text-white font-medium px-4 py-2 border border-transparent rounded-md bg-gray-800 flex w-full justify-center relative focus:outline-none hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            @click="signIn('github')"
          >
            <span class="pl-3 flex items-center inset-y-0 left-0 absolute">
              <svg class="text-gray-400 h-5 w-5 group-hover:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
              </svg>
            </span>
            {{ $t('auth.signInWithGithub') }}
          </button>
        </div>

        <div class="text-center">
          <p class="text-sm text-gray-600">
            {{ $t('auth.bySigningIn') }}
            <a href="/terms" class="text-gray-900 font-medium hover:text-gray-700">
              {{ $t('auth.termsOfService') }}
            </a>
            {{ $t('auth.and') }}
            <a href="/privacy" class="text-gray-900 font-medium hover:text-gray-700">
              {{ $t('auth.privacyPolicy') }}
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
