<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LoadingButton from '@/components/ui/button/LoadingButton.vue'
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
const sendingCode = ref(false)
const registering = ref(false)
const loggingIn = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('error')
const isRegister = ref(false)
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function setMessage(text: string, type: 'success' | 'error' = 'error') {
  message.value = text
  messageType.value = type
}

// 切换登录/注册时清空旧提示
function switchTab(register: boolean) {
  if (isRegister.value === register)
    return
  isRegister.value = register
  message.value = ''
}

function startCountdown() {
  countdown.value = 60
  if (timer)
    clearInterval(timer)
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

async function handleSendCode() {
  if (sendingCode.value || countdown.value > 0)
    return
  if (!email.value || !password.value || !confirmPassword.value) {
    setMessage(t('login.fillEmailAndPasswords'))
    return
  }
  if (password.value !== confirmPassword.value) {
    setMessage(t('login.passwordsNotMatch'))
    return
  }
  sendingCode.value = true
  try {
    const res = await $fetch('/api/auth/register', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    if (res.success) {
      setMessage(t('login.codeSent'), 'success')
      startCountdown()
    }
    else {
      setMessage(res.message)
    }
  }
  catch (error: any) {
    setMessage(error?.data?.message || t('login.sendCodeFailed'))
  }
  finally {
    sendingCode.value = false
  }
}

async function autoLogin() {
  const res = await signIn('credentials', {
    email: email.value,
    password: password.value,
    redirect: false,
  })
  return Boolean(res?.ok && !res?.error)
}

async function handleRegister() {
  if (registering.value)
    return
  const code = pin.value.join('')
  if (!email.value || !password.value || !confirmPassword.value || code.length !== 5) {
    setMessage(t('login.fillAllInfo'))
    return
  }
  if (password.value !== confirmPassword.value) {
    setMessage(t('login.passwordsNotMatch'))
    return
  }
  registering.value = true
  try {
    const res = await $fetch('/api/auth/verify-email', {
      method: 'POST',
      body: { email: email.value, code },
    })
    if (!res.success) {
      setMessage(res.message)
      return
    }

    // 注册成功后自动登录
    if (await autoLogin()) {
      setMessage(t('login.registerSuccessAutoLogin'), 'success')
      props.callback?.()
    }
    else {
      // 自动登录失败则回退到登录表单
      isRegister.value = false
      setMessage(t('login.registerSuccess'), 'success')
    }
  }
  catch (error: any) {
    setMessage(error?.data?.message || t('login.registerFailed'))
  }
  finally {
    registering.value = false
  }
}

async function handleLogin() {
  if (loggingIn.value)
    return
  if (!email.value || !password.value) {
    setMessage(t('login.fillEmailAndPassword'))
    return
  }
  loggingIn.value = true
  try {
    const res = await signIn('credentials', {
      email: email.value,
      password: password.value,
      redirect: false,
    })
    if (res?.ok && !res?.error) {
      setMessage(t('login.loginSuccess'), 'success')
      props.callback?.()
      // navigateTo('/')
    }
    else {
      setMessage(t('login.loginFailed'))
    }
  }
  catch {
    setMessage(t('login.loginFailed'))
  }
  finally {
    loggingIn.value = false
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
      <button class="px-4 py-2" :class="[!isRegister ? 'font-bold underline' : '']" @click="switchTab(false)">
        {{ t('login.login') }}
      </button>
      <button class="px-4 py-2" :class="[isRegister ? 'font-bold underline' : '']" @click="switchTab(true)">
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
        <LoadingButton
          class="text-xs text-white px-3 py-2 rounded bg-gray-800 cursor-pointer"
          :loading="sendingCode"
          :disabled="sendingCode || countdown > 0"
          style="white-space: nowrap;"
          size="sm"
          variant="secondary"
          @click="handleSendCode"
        >
          <template #loading>
            {{ t('login.sending') }}
          </template>
          {{ countdown > 0 ? t('login.resend', { count: countdown }) : t('login.sendCode') }}
        </LoadingButton>
      </div>
      <LoadingButton
        class="text-white mt-2 py-2 rounded bg-gray-700 w-full"
        :loading="registering"
        :disabled="pin.join('').length !== 5 || registering"
        size="default"
        variant="default"
        @click="handleRegister"
      >
        <template #loading>
          {{ t('login.registering') }}
        </template>
        {{ t('login.register') }}
      </LoadingButton>
    </template>
    <template v-else>
      <LoadingButton
        class="text-white py-2 rounded bg-gray-800 w-full"
        :loading="loggingIn"
        :disabled="loggingIn"
        size="default"
        variant="default"
        @click="handleLogin"
      >
        <template #loading>
          {{ t('login.logining') }}
        </template>
        {{ t('login.login') }}
      </LoadingButton>
    </template>
    <div v-if="message" class="text-sm mt-2" :class="messageType === 'success' ? 'text-green-600' : 'text-red-500'">
      {{ message }}
    </div>
  </div>
</template>
