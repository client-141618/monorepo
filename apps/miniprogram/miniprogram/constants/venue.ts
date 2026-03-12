export const VENUE_TYPE = {
  BADMINTON: 1,
  TABLE_TENNIS: 2,
  FOOTBALL: 3,
  ROCK_CLIMBING: 4,
} as const

export type VenueTypeValue = (typeof VENUE_TYPE)[keyof typeof VENUE_TYPE]

export const VENUE_TYPE_OPTIONS: { label: string; value: VenueTypeValue }[] = [
  { label: "羽毛球", value: VENUE_TYPE.BADMINTON },
  { label: "乒乓球", value: VENUE_TYPE.TABLE_TENNIS },
  { label: "足球场", value: VENUE_TYPE.FOOTBALL },
  { label: "攀岩", value: VENUE_TYPE.ROCK_CLIMBING },
]
