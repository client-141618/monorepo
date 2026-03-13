import { computed, onBeforeUnmount, onMounted, shallowRef } from "vue"

export interface UseSmsCodeCooldownOptions {
  storageKey?: string
  durationMs?: number
}

export function useSmsCodeCooldown(options: UseSmsCodeCooldownOptions = {}) {
  const { storageKey = "smsCodeCooldownUntilMs", durationMs = 60_000 } = options

  const cooldownUntilMs = shallowRef<number>(0)
  const remainingSeconds = shallowRef<number>(0)
  const isCooldown = computed(() => remainingSeconds.value > 0)
  const buttonText = computed(() =>
    isCooldown.value ? `${remainingSeconds.value}s后重试` : "发送验证码",
  )

  let intervalId: number | undefined

  const stop = () => {
    if (intervalId) {
      window.clearInterval(intervalId)
      intervalId = undefined
    }
  }

  const sync = () => {
    if (!cooldownUntilMs.value) {
      remainingSeconds.value = 0
      return
    }

    const sec = Math.max(
      0,
      Math.ceil((cooldownUntilMs.value - Date.now()) / 1000),
    )
    remainingSeconds.value = sec

    if (sec <= 0) {
      stop()
      cooldownUntilMs.value = 0
      localStorage.removeItem(storageKey)
    }
  }

  const resume = () => {
    stop()

    const raw = localStorage.getItem(storageKey)
    const parsed = raw ? Number(raw) : 0
    cooldownUntilMs.value = Number.isFinite(parsed) ? parsed : 0

    sync()
    if (remainingSeconds.value <= 0) return

    intervalId = window.setInterval(() => {
      sync()
    }, 1000)
  }

  const startCooldown = () => {
    cooldownUntilMs.value = Date.now() + durationMs
    localStorage.setItem(storageKey, String(cooldownUntilMs.value))
    resume()
  }

  onMounted(() => {
    resume()
  })

  onBeforeUnmount(() => {
    stop()
  })

  return {
    isCooldown,
    remainingSeconds,
    buttonText,
    startCooldown,
    resume,
    stop,
  }
}
