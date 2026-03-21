const DEFAULT_PLACEHOLDER = "--"

export function formatDateTimeText(value?: string | null, fallback = DEFAULT_PLACEHOLDER) {
  if (!value) return fallback
  return value.replace("T", " ").replace("Z", "").replace(/\.\d+$/, "")
}

export function formatYuanFromFen(
  value?: number | string | null,
  options?: { fallback?: string; fractionDigits?: number },
) {
  const fallback = options?.fallback ?? DEFAULT_PLACEHOLDER
  const fractionDigits = options?.fractionDigits ?? 2
  if (value === null || value === undefined) return fallback
  const cents = Number(value)
  if (!Number.isFinite(cents)) return fallback
  return (cents / 100).toFixed(fractionDigits)
}

export function formatCurrencyFromFen(
  value?: number | string | null,
  options?: { fallback?: string; fractionDigits?: number; symbol?: string },
) {
  const fallback = options?.fallback ?? DEFAULT_PLACEHOLDER
  const symbol = options?.symbol ?? "¥"
  const amount = formatYuanFromFen(value, options)
  if (amount === fallback) return fallback
  return `${symbol}${amount}`
}
