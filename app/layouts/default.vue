<template>
  <div class="h-100vh relative">
    <main class="h-full">
      <slot />
    </main>
    <div class="flex flex-col gap-2 bottom-4 right-4 fixed z-50">
      <LanguageSwitcher />
      <!-- <ThemeSwitcher /> -->
      <NuxtLink to="https://github.com/NxResume/nuxt-resume-editor" target="_blank" class="language-link">
        <div class="i-ri-github-line" />
      </NuxtLink>
    </div>
  </div>
</template>

<style>
.language-link {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.85rem;
  text-decoration: none;
  color: inherit;
  min-width: 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.language-link:hover {
  background: var(--hover-bg);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color, #3b82f6);
}

.language-link:active {
  transform: translateY(0);
  box-shadow: none;
}
</style>
