export interface TeamMember {
  wxUserId?: number
  username?: string
  avatar?: string
  role?: number
}

export interface TeamRecord {
  id: number
  reservationId: number
  venueTypeId?: number
  venueTypeName?: string
  venueId?: number
  venueName?: string
  courtId?: number
  title?: string
  description?: string
  deadlineTime?: string
  requiredCount?: number
  currentCount?: number
  remainingCount?: number
  activityDate?: string
  initiatorWxUserId?: number
  initiatorName?: string
  contactType?: number
  contactMasked?: string
  contactValue?: string | null
  status?: number
  createTime?: string
  joined?: boolean
  members?: TeamMember[]
}

export interface TeamPageQuery {
  activityDate?: string
  venueId?: number
  status?: number
}

export interface TeamCancelPayload {
  reason?: string
}
