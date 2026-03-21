export function parseOptionalNonNegativeInteger(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return { value: null as number | null, valid: true }

  const numberValue = Number(trimmed)
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    return { value: null as number | null, valid: false }
  }

  return { value: numberValue, valid: true }
}
