const DEFAULT_VENUE_PREFIX = "场馆 #"

export function getVenueNameById(
  venueId: number,
  venueNameMap: Record<number, string>,
  fallbackPrefix = DEFAULT_VENUE_PREFIX,
) {
  return venueNameMap[venueId] || `${fallbackPrefix}${venueId}`
}

export function formatVenueCourtInfo(params: {
  venueId: number
  courtId: number
  venueName?: string | null
  venueNameMap: Record<number, string>
}) {
  const venueName = params.venueName?.trim() || getVenueNameById(params.venueId, params.venueNameMap)
  return `${venueName} ${params.courtId}号场`
}
