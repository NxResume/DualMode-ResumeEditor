<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Input from '@/components/ui/input/Input.vue'
import {
  PinInput,
  PinInputGroup,
  PinInputSeparator,
  PinInputSlot,
} from '@/components/ui/pin-input'

const props = defineProps<{
  callback?: () => void
}>()

const { t } = useI18n()

const { signIn } = useAuth()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const pin = ref<string[]>([])
const loading = ref(false)
const message = ref('')
const isRegister = ref(false)
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

async function handleSendCode() {
  if (countdown.value > 0)
    return
  if (!email.value || !password.value || !confirmPassword.value) {
    message.value = t('login.fillEmailAndPasswords')
    return
  }
  if (password.value !== confirmPassword.value) {
    message.value = t('login.passwordsNotMatch')
    return
  }
  loading.value = true
  const res = await $fetch('/api/auth/register', {
    method: 'POST',
    body: { email: email.value, password: password.value },
  })
  loading.value = false
  if (res.success) {
    message.value = t('login.codeSent')
    countdown.value = 60
    timer && clearInterval(timer)
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer!)
        timer = null
      }
    }, 1000)
  }
  else {
    message.value = res.message
  }
}

async function handleRegister() {
  const code = pin.value.join('')
  if (!email.value || !password.value || !confirmPassword.value || code.length !== 5) {
    message.value = t('login.fillAllInfo')
    return
  }
  if (password.value !== confirmPassword.value) {
    message.value = t('login.passwordsNotMatch')
    return
  }
  loading.value = true
  const res = await $fetch('/api/auth/verify-email', {
    method: 'POST',
    body: { email: email.value, code },
  })
  loading.value = false
  if (res.success) {
    message.value = t('login.registerSuccess')
    isRegister.value = false // 注册成功后切换到登录
  }
  else {
    message.value = res.message
  }
}

async function handleLogin() {
  if (!email.value || !password.value) {
    message.value = t('login.fillEmailAndPassword')
    return
  }
  loading.value = true
  const res = await signIn('credentials', {
    email: email.value,
    password: password.value,
    redirect: false,
  })
  loading.value = false
  if (res.ok && !res.error) {
    message.value = t('login.loginSuccess')
    props.callback?.()
    // navigateTo('/')
  }
  else {
    message.value = res?.error || '登录失败'
  }
}

function handlePinComplete(_val: string[]) {
  // 可选：自动注册
  // handleRegister()
}
</script>

<template>
  <div class="mx-auto max-w-xs w-full space-y-4">
    <div class="mb-2 flex justify-center">
      <button class="px-4 py-2" :class="[!isRegister ? 'font-bold underline' : '']" @click="isRegister = false">
        {{ t('login.login') }}
      </button>
      <button class="px-4 py-2" :class="[isRegister ? 'font-bold underline' : '']" @click="isRegister = true">
        {{ t('login.register') }}
      </button>
    </div>
    <Input v-model="email" type="email" :placeholder="$t('login.emailPlaceholder')" />
    <Input v-model="password" type="password" :placeholder="$t('login.passwordPlaceholder')" />
    <Input v-if="isRegister" v-model="confirmPassword" type="password" :placeholder="$t('login.confirmPasswordPlaceholder')" />
    <template v-if="isRegister">
      <div class="mt-4 flex flex-row gap-2 items-center">
        <PinInput
          v-model="pin"
          placeholder="○"
          @complete="handlePinComplete"
        >
          <PinInputGroup class="gap-1">
            <template v-for="(id, index) in 5" :key="id">
              <PinInputSlot
                class="border rounded-md"
                :index="index"
              />
              <template v-if="index !== 4">
                <PinInputSeparator />
              </template>
            </template>
          </PinInputGroup>
        </PinInput>
        <button
          class="text-xs text-white px-3 py-2 rounded bg-gray-800 cursor-pointer"
          :disabled="loading || countdown > 0"
          style="white-space: nowrap;"
          @click="handleSendCode"
        >
          {{ countdown > 0 ? t('login.resend', { count: countdown }) : t('login.sendCode') }}
        </button>
      </div>
      <button
        class="text-white mt-2 py-2 rounded bg-gray-700 w-full"
        :disabled="pin.join('').length !== 5 || loading"
        @click="handleRegister"
      >
        {{ t('login.register') }}
      </button>
    </template>
    <template v-else>
      <button
        class="text-white py-2 rounded bg-gray-800 w-full"
        :disabled="loading"
        @click="handleLogin"
      >
        {{ t('login.login') }}
      </button>
    </template>
    <div v-if="message" class="text-sm text-red-500 mt-2">
      {{ message }}
    </div>
  </div>
</template>
