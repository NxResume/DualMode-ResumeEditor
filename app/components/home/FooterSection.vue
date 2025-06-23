<template>
  <footer class="mt-10 border-t border-gray-200 bg-white">
    <div class="mx-auto px-4 py-10 lg:px-8 sm:px-6">
      <div class="flex flex-col gap-6 items-start justify-between md:flex-row md:items-center">
        <!-- 项目简介 -->
        <div>
          <h4 class="text-lg text-gray-800 font-semibold">
            {{ $t('home.footer.projectName') }}
          </h4>
          <p class="text-sm text-gray-500 mt-1">
            {{ $t('home.footer.description') }}
          </p>
        </div>

        <!-- 链接 -->
        <div class="text-sm text-gray-600 flex gap-8">
          <a href="https://github.com/NxResume/nuxt-resume-editor" target="_blank" class="hover:text-black">{{ $t('home.footer.links.github') }}</a>
          <a href="/docs" class="hover:text-black">{{ $t('home.footer.links.docs') }}</a>
          <a href="/faq" class="hover:text-black">{{ $t('home.footer.links.faq') }}</a>
          <a href="/terms" class="hover:text-black">{{ $t('home.footer.links.terms') }}</a>
        </div>
      </div>

      <!-- 底部版权 -->
      <div class="text-xs text-gray-400 mt-8 pt-4 border-t flex items-center justify-between">
        <p>{{ $t('home.footer.copyright') }}</p>
        <div class="flex gap-4">
          <a href="mailto:hi@ryanuo.cc" class="hover:text-black">{{ $t('home.footer.contact') }}</a>
          <a href="https://github.com/NxResume" target="_blank" class="hover:text-black">{{ $t('home.footer.github') }}</a>
        </div>
      </div>
    </div>
  </footer>
</template>
